// ==============================================================================
// Zuu Agent — Vercel Serverless Route: /api/agents/run-agent
// Node.js / Vercel Serverless parity implementation of run-agent Edge Function
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { GeminiEngine } from '../../src/services/ai/geminiEngine';
import { ConditionalEngine } from '../../src/services/engine/conditionalEngine';
import { GoogleSheetsClient } from '../../src/services/tools/sheetsIntegration';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const startTime = Date.now();
  const { 
    agentId, 
    jobId, 
    taskPrompt = 'Generate daily viral content update',
    isDryRun = true,
    triggerType = 'api'
  } = req.body || {};

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const hasSupabase = Boolean(supabaseUrl && serviceRoleKey);
  const supabase = hasSupabase ? createClient(supabaseUrl, serviceRoleKey) : null;

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const correlationId = `corr_${Date.now()}_${executionId.substring(0, 8)}`;

  // 1. Load agent configuration
  let agent: any = null;
  let agentConfig: any = null;
  let systemPrompt = 'You are an autonomous AI agent.';

  if (supabase) {
    try {
      const { data: dbAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      if (dbAgent) agent = dbAgent;

      const { data: cfg } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('agent_id', agentId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      if (cfg) agentConfig = cfg;

      const { data: pmt } = await supabase
        .from('agent_prompts')
        .select('content')
        .eq('agent_id', agentId)
        .eq('prompt_type', 'system')
        .single();
      if (pmt) systemPrompt = pmt.content;
    } catch (_) {}
  }

  if (!agent) {
    agent = {
      id: agentId,
      name: 'Trollogiya Content Agent',
      slug: 'trollogiya-agent',
      status: 'active',
      primaryModel: 'gemini-2.0-flash'
    };
  }

  // 2. Validate agent is enabled
  if (agent.status !== 'active' && agent.status !== 'testing') {
    return res.status(403).json({
      error: `Agent is in "${agent.status}" status. Only active or testing agents may execute.`,
      errorCode: 'AGENT_DISABLED'
    });
  }

  // 3. AI Generation via GeminiEngine
  const aiResult = await GeminiEngine.generateContent(
    systemPrompt,
    taskPrompt,
    {
      model: agent.primaryModel || 'gemini-2.0-flash',
      temperature: agentConfig?.temperature || 0.8
    }
  );

  let generatedContent = aiResult.content;
  let tokensUsed = aiResult.tokensUsed;

  // Fallback if dry-run or key missing
  if (!generatedContent) {
    generatedContent = `বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:\n১. গরম খিচুড়ি আর বেগুন ভাজা 🍛🍆\n২. এক কাপ আদা চা ☕️\n৩. জরুরি মিটিং বা ক্লাস অটোমেটিক ক্যানসেল হয়ে যাওয়া! 🌧️\n\nআপনার আজকের দিনের প্রায়োরিটি কোনটা? কমেন্টে জানিয়ে দিন! 👇 #Trollogiya #DhakaLife`;
    tokensUsed = Math.round((systemPrompt.length + taskPrompt.length + generatedContent.length) / 3.8);
  }

  // 4. Conditional safety rules
  const ruleResult = ConditionalEngine.evaluateRules(
    { content: generatedContent, length: generatedContent.length },
    [
      { field: 'content', operator: 'is_not_empty' },
      { field: 'length', operator: 'length_greater_than', value: 20 }
    ]
  );

  // 5. Check approval gate & publish eligibility
  const requiresApproval = Boolean(agentConfig?.requires_human_approval ?? false);
  const isEligible = ruleResult.passed && !requiresApproval;

  let publishedPostId: string | null = null;
  let publishError: string | null = null;

  const pageId = process.env.FB_PAGE_ID || '109847291834910';
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN || '';

  if (isEligible && !isDryRun && pageToken && pageToken.length > 20) {
    try {
      const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: generatedContent, access_token: pageToken })
      });
      const fbData = await fbRes.json();
      if (fbRes.ok && fbData.id) {
        publishedPostId = fbData.id;
      } else {
        publishError = fbData.error?.message || 'Meta Graph API error';
      }
    } catch (err: any) {
      publishError = err.message;
    }
  } else if (isDryRun) {
    publishedPostId = `simulated_post_${Date.now()}`;
  }

  const durationMs = Date.now() - startTime;
  const executionStatus = publishError ? 'failed' : requiresApproval ? 'awaiting_approval' : 'completed';

  // 6. Append to Google Sheets if configured (isolated failure boundary)
  let sheetsAppended = false;
  let sheetsError: string | null = null;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (spreadsheetId && !isDryRun) {
    const sheetsResult = await GoogleSheetsClient.appendRow(
      { spreadsheetId },
      {
        agentName: agent.name,
        generatedContent,
        executionStatus,
        facebookPostIdOrUrl: publishedPostId || undefined,
        errorDetails: publishError || undefined
      }
    );
    sheetsAppended = sheetsResult.success;
    sheetsError = sheetsResult.error || null;
  }

  // 7. Persist to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('executions').insert([{
        id: executionId,
        agent_id: agentId,
        job_id: jobId || null,
        trigger_type: triggerType,
        status: executionStatus,
        correlation_id: correlationId,
        input_payload: { prompt: taskPrompt, isDryRun },
        input_summary: taskPrompt.substring(0, 150),
        output_summary: generatedContent.substring(0, 250),
        error_message: publishError,
        duration_ms: durationMs,
        total_tokens_used: tokensUsed,
        completed_at: new Date().toISOString()
      }]);

      await supabase.from('generated_content').insert([{
        agent_id: agentId,
        execution_id: executionId,
        content: generatedContent,
        approval_status: publishedPostId && !isDryRun ? 'published' : requiresApproval ? 'pending' : 'approved',
        published_post_id: publishedPostId,
        metadata: { isDryRun, model: agent.primaryModel, tokensUsed }
      }]);
    } catch (_) {}
  }

  return res.status(200).json({
    success: executionStatus !== 'failed',
    executionId,
    correlationId,
    agentId,
    agentName: agent.name,
    generatedContent,
    tokensUsed,
    durationMs,
    isDryRun,
    approvalStatus: requiresApproval ? 'awaiting_approval' : 'approved',
    publishedPostId,
    publishError,
    sheetsAppended,
    sheetsError
  });
}
