// ==============================================================================
// Supabase Edge Function: dispatch-jobs
// Environment: Deno
// Invoked by Supabase pg_cron / scheduled webhook
// Safe Atomic Queue Claiming using claim_due_jobs() with FOR UPDATE SKIP LOCKED
// Bounded Exponential Backoff Retry & Asia/Dhaka Timezone Scheduling
// ==============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

/**
 * Calculates next execution timestamp for recurring daily slots in Asia/Dhaka
 */
function calculateNextDhakaRun(hours: number = 14, minutes: number = 0): string {
  // Asia/Dhaka is UTC+6
  const now = new Date();
  const dhakaOffsetMs = 6 * 60 * 60 * 1000;
  const dhakaNow = new Date(now.getTime() + dhakaOffsetMs);

  const targetDhaka = new Date(dhakaNow);
  targetDhaka.setUTCHours(hours, minutes, 0, 0);

  if (targetDhaka.getTime() <= dhakaNow.getTime()) {
    // Already passed today, advance to tomorrow
    targetDhaka.setUTCDate(targetDhaka.getUTCDate() + 1);
  }

  // Convert back to UTC standard ISO
  const targetUtc = new Date(targetDhaka.getTime() - dhakaOffsetMs);
  return targetUtc.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const workerId = `edge_worker_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

  // 1. Authenticate Request
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized dispatcher invocation." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 2. Claim due jobs atomically via PostgreSQL stored procedure
    const { data: claimedJobs, error: claimError } = await supabase.rpc("claim_due_jobs", {
      p_worker_id: workerId,
      p_batch_size: 5
    });

    if (claimError) {
      console.error("[dispatch-jobs] RPC claim error:", claimError);
    }

    const jobs = claimedJobs || [];
    const dispatchResults: any[] = [];

    // 3. Process each claimed job
    for (const job of jobs) {
      const jobId = job.job_id || job.id;
      const agentId = job.agent_id;
      const currentAttempts = Number(job.attempts || 1);
      const maxAttempts = 3;

      try {
        // Load agent to verify status
        const { data: agent } = await supabase
          .from("agents")
          .select("id, name, status")
          .eq("id", agentId)
          .single();

        if (!agent || agent.status === "disabled" || agent.status === "archived") {
          // Permanently cancel job for disabled agent
          await supabase.from("jobs").update({
            status: "cancelled",
            completed_at: new Date().toISOString()
          }).eq("id", jobId);

          dispatchResults.push({ jobId, agentId, status: "cancelled", reason: "Agent disabled" });
          continue;
        }

        // Invoke the run-agent Edge Function
        const runAgentUrl = `${supabaseUrl}/functions/v1/run-agent`;
        const agentRes = await fetch(runAgentUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            agentId,
            jobId,
            taskPrompt: job.payload?.prompt || "Daily automated content generation",
            isDryRun: Boolean(job.payload?.isDryRun ?? false),
            triggerType: "schedule"
          })
        });

        const agentData = await agentRes.json().catch(() => ({}));

        if (agentRes.ok && agentData.success) {
          // Success: Mark completed
          await supabase.from("jobs").update({
            status: "completed",
            completed_at: new Date().toISOString()
          }).eq("id", jobId);

          // Schedule next occurrence if recurring
          if (job.schedule_id) {
            const nextScheduledAt = calculateNextDhakaRun(14, 0); // 2:00 PM Dhaka slot
            await supabase.from("jobs").insert([{
              schedule_id: job.schedule_id,
              agent_id: agentId,
              task_type: job.task_type || "daily_post",
              payload: job.payload,
              status: "pending",
              scheduled_at: nextScheduledAt,
              idempotency_key: `idemp_${agentId}_${Date.now()}`
            }]);
          }

          dispatchResults.push({ jobId, agentId, status: "completed", postId: agentData.publishedPostId });
        } else {
          // Failure: Apply bounded exponential backoff
          const errorMsg = agentData.error || `HTTP ${agentRes.status}`;
          if (currentAttempts < maxAttempts) {
            const backoffSeconds = Math.pow(2, currentAttempts) * 60; // 2m, 4m, 8m
            const retryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

            await supabase.from("jobs").update({
              status: "pending", // Re-queue
              scheduled_at: retryAt,
              locked_by: null,
              locked_at: null
            }).eq("id", jobId);

            dispatchResults.push({ jobId, agentId, status: "retrying", retryAt, error: errorMsg });
          } else {
            // Max retries exceeded: Mark permanently failed
            await supabase.from("jobs").update({
              status: "failed",
              completed_at: new Date().toISOString()
            }).eq("id", jobId);

            dispatchResults.push({ jobId, agentId, status: "permanently_failed", attempts: currentAttempts, error: errorMsg });
          }
        }
      } catch (err: any) {
        dispatchResults.push({ jobId, agentId, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      workerId,
      durationMs: Date.now() - startTime,
      jobsClaimed: jobs.length,
      results: dispatchResults
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      workerId,
      error: err.message || "Fatal error in dispatch-jobs",
      durationMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
