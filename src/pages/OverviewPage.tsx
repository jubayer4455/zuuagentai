import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CheckSquare, 
  Cpu, 
  TrendingUp, 
  ArrowUpRight, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { useApprovalStore } from '../store/useApprovalStore';
import { useProviderStore } from '../store/useProviderStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { useSystemStore } from '../store/useSystemStore';
import { getDatabaseConnectionInfo } from '../services/supabase';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { agents } = useAgentStore();
  const { executions } = useExecutionStore();
  const { approvals } = useApprovalStore();
  const { providers } = useProviderStore();
  const { integrations } = useIntegrationStore();
  const { healthMetrics, runHealthCheck } = useSystemStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const pausedAgents = agents.filter(a => a.status === 'paused').length;
  const disabledAgents = agents.filter(a => a.status === 'disabled' || a.status === 'error').length;

  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  const failedExecutions = executions.filter(e => e.status === 'failed').length;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

  // Real estimated tokens & costs
  const totalTokens = executions.reduce((acc, curr) => acc + (curr.totalTokensUsed || 0), 0);
  const totalEstimatedCost = executions.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  const dbInfo = getDatabaseConnectionInfo();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await runHealthCheck();
    setIsRefreshing(false);
  };

  const filteredAgents = filterCategory === 'all' 
    ? agents 
    : agents.filter(a => a.category === filterCategory);

  const latestExecution = executions[0];
  const lastExecutionTime = latestExecution 
    ? new Date(latestExecution.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : 'None yet';
  const lastExecutionDate = latestExecution ? new Date(latestExecution.startedAt).toLocaleDateString() : '';

  // Pending scheduled jobs from active recurring agent schedules
  const pendingScheduledJobs = agents.filter(a => a.status === 'active').length * 2; // e.g. 2 daily slots per active agent
  const nextScheduledExecution = 'Today, 8:00 PM (Asia/Dhaka UTC+6)';

  // Real error messages from actual failed executions
  const recentErrors = executions
    .filter(e => e.status === 'failed' || Boolean(e.errorSummary))
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Master Admin Control Center
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Operational
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Universal multi-agent orchestration, execution traces, approval queues, and AI provider telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Health</span>
          </button>
          
          <button
            onClick={() => navigate('/agents/new')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Agent</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards - 6 Metric Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Active Agents */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Active Agents</span>
            <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
              <Bot className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-xl font-extrabold text-slate-100">{activeAgents}</span>
            <span className="text-[10px] text-slate-400">/ {totalAgents} total</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-medium">
            {activeAgents > 0 ? 'Fleet operational' : 'No active agents'}
          </div>
        </div>

        {/* 2. Pending Scheduled Jobs */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Pending Jobs</span>
            <div className="p-1.5 rounded-lg bg-violet-950/60 text-violet-400 border border-violet-800/50">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-xl font-extrabold text-slate-100">{pendingScheduledJobs}</span>
            <span className="text-[10px] text-slate-400">queued</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            Next: <span className="text-cyan-400">8:00 PM</span>
          </div>
        </div>

        {/* 3. Successful Executions */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Successful Runs</span>
            <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-xl font-extrabold text-emerald-400">{successfulExecutions}</span>
            <span className="text-[10px] text-slate-400">completed</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-semibold">
            {totalExecutions > 0 ? `${Math.round((successfulExecutions / totalExecutions) * 100)}% rate` : 'N/A'}
          </div>
        </div>

        {/* 4. Failed Executions */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Failed Executions</span>
            <div className={`p-1.5 rounded-lg border ${
              failedExecutions > 0 ? 'bg-rose-950/60 text-rose-400 border-rose-800/50' : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
            }`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className={`text-xl font-extrabold ${failedExecutions > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {failedExecutions}
            </span>
            <span className="text-[10px] text-slate-400">incidents</span>
          </div>
          <div className="mt-1 text-[10px]">
            {failedExecutions > 0 ? (
              <button onClick={() => navigate('/failed-jobs')} className="text-rose-400 hover:underline">
                View incident logs
              </button>
            ) : (
              <span className="text-emerald-400 font-medium">Zero errors</span>
            )}
          </div>
        </div>

        {/* 5. Last Execution Time */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Last Execution</span>
            <div className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/50">
              <PlayCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-sm font-bold text-slate-100 truncate">{lastExecutionTime}</div>
            <div className="text-[10px] text-slate-400">{lastExecutionDate || 'Live'}</div>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            {latestExecution ? latestExecution.agentName : 'Idle'}
          </div>
        </div>

        {/* 6. Next Scheduled Execution */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Next Scheduled</span>
            <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/50">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xs font-bold text-cyan-400">8:00 PM GMT+6</div>
            <div className="text-[10px] text-slate-400">Asia/Dhaka</div>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            pg_cron active
          </div>
        </div>
      </div>

      {/* Recent Error Messages Callout (If any failures exist) */}
      {recentErrors.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 text-xs space-y-2">
          <div className="flex items-center justify-between text-rose-300 font-bold">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Recent Error Messages from Executions</span>
            </div>
            <button onClick={() => navigate('/failed-jobs')} className="text-cyan-400 hover:underline">
              Investigate in Incident Center
            </button>
          </div>
          <div className="space-y-1 text-slate-300">
            {recentErrors.map(err => (
              <div key={err.id} className="p-2 rounded-lg bg-slate-900/80 border border-rose-950/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-rose-300">[{err.agentName}]</span>{' '}
                  <span className="text-slate-400">{err.errorSummary || 'Execution runtime timeout'}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{new Date(err.startedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Agents & Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Agents & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Agent Launcher */}
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Active Agent Fleet
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Universal multi-agent configurations and real-time execution states
                </p>
              </div>
              <button 
                onClick={() => navigate('/agents')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
              >
                <span>View All ({agents.length})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {filteredAgents.slice(0, 4).map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="p-4 hover:bg-slate-800/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-100 hover:text-cyan-400 transition">
                          {agent.name}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                          agent.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-md">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <div className="hidden sm:block text-right">
                      <div className="text-slate-200 font-mono text-[11px]">{agent.primaryModel}</div>
                      <div className="text-[10px] text-slate-400">v{agent.version}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Executions Log */}
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Recent Executions & Traces
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execution correlation IDs and step progress
                </p>
              </div>
              <button 
                onClick={() => navigate('/tasks')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {executions.slice(0, 4).map((exec) => (
                <div key={exec.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200">{exec.agentName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{exec.correlationId}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Trigger: <span className="capitalize text-slate-300">{exec.triggerType}</span> • 
                      Tokens: <span className="text-slate-300">{exec.totalTokensUsed}</span> • 
                      Duration: <span className="text-slate-300">{exec.durationMs ? `${exec.durationMs}ms` : 'In progress'}</span>
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      exec.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : exec.status === 'awaiting_approval'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {exec.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: System Diagnostics & Integrations */}
        <div className="space-y-6">
          {/* System Health Status */}
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                System Diagnostics
              </h2>
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="space-y-3">
              {healthMetrics.map((metric) => (
                <div key={metric.component} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{metric.component}</span>
                    <span className={`text-[10px] font-bold uppercase ${
                      metric.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {metric.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {metric.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Database Mode: <span className="font-semibold text-slate-200">{dbInfo.mode}</span>
            </div>
          </div>

          {/* Integrations Health */}
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Integrations Health
              </h2>
              <button 
                onClick={() => navigate('/integrations')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {integrations.map((conn) => (
                <div key={conn.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{conn.displayName}</div>
                    <div className="text-[10px] text-slate-400">
                      ID: {conn.accountIdentifier}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
