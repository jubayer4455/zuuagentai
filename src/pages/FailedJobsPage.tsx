import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Terminal, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useExecutionStore } from '../store/useExecutionStore';
import { useAgentStore } from '../store/useAgentStore';

export const FailedJobsPage: React.FC = () => {
  const { executions, retryExecution } = useExecutionStore();
  const { agents } = useAgentStore();

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Filter actual failed executions and error logs
  const failedExecutions = executions.filter(e => e.status === 'failed' || e.errorSummary);

  const handleRetry = async (execId: string, agentId: string) => {
    setRetryingId(execId);
    setRetryMessage(null);
    try {
      const agent = agents.find(a => a.id === agentId) || agents[0];
      if (!agent) throw new Error('Agent configuration not found for retry.');
      await retryExecution(execId, agent);
      setRetryMessage(`Execution ${execId} successfully re-queued for execution.`);
    } catch (err: any) {
      setRetryMessage(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Failed Jobs & Incident Center
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Real-time failed executions, rate-limit warnings, stack traces, and exponential backoff retry controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-950/80 text-rose-400 border border-rose-800">
            {failedExecutions.length} Failed Incidents
          </span>
        </div>
      </div>

      {retryMessage && (
        <div className="p-3.5 rounded-xl border border-cyan-800 bg-cyan-950/60 text-cyan-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>{retryMessage}</span>
        </div>
      )}

      {/* Incident List */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/90 overflow-hidden">
        {failedExecutions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">Zero Active Job Failures</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All agent executions, Facebook publishing requests, and scheduled triggers are running without error.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {failedExecutions.map((exec) => (
              <div key={exec.id} className="p-5 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-100 text-sm">
                      {exec.agentName || 'Agent Task'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ID: {exec.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-400 border border-rose-800">
                      {exec.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(exec.startedAt).toLocaleString()}</span>
                    </span>

                    <button
                      onClick={() => handleRetry(exec.id, exec.agentId)}
                      disabled={retryingId === exec.id}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold transition"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${retryingId === exec.id ? 'animate-spin' : ''}`} />
                      <span>{retryingId === exec.id ? 'Retrying...' : 'Retry Job'}</span>
                    </button>
                  </div>
                </div>

                {/* Error Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-900/40 text-rose-300 font-mono text-[11px] space-y-1">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Error Code: {exec.errorCode || 'RUNTIME_ERROR'}</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {exec.errorSummary || 'Execution failed due to external provider or configuration error.'}
                  </p>
                </div>

                {/* Execution Context Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Trigger: <strong className="text-slate-300 capitalize">{exec.triggerType}</strong></span>
                  <span>Correlation ID: <strong className="text-slate-300 font-mono">{exec.correlationId}</strong></span>
                  <span>Tokens Used: <strong className="text-slate-300">{exec.totalTokensUsed}</strong></span>
                  <span>Duration: <strong className="text-slate-300">{exec.durationMs ? `${exec.durationMs}ms` : 'N/A'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
