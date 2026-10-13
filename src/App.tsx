import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { AllAgentsPage } from './pages/AllAgentsPage';
import { AgentBuilderPage } from './pages/AgentBuilderPage';
import { AgentWorkspacePage } from './pages/AgentWorkspacePage';
import { AgentTemplatesPage } from './pages/AgentTemplatesPage';
import { AgentMarketplacePage } from './pages/AgentMarketplacePage';
import { TasksPage } from './pages/TasksPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ContentCalendarPage } from './pages/ContentCalendarPage';
import { FacebookPagesPage } from './pages/FacebookPagesPage';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { FailedJobsPage } from './pages/FailedJobsPage';
import { GeneratedContentPage } from './pages/GeneratedContentPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ToolRegistryPage } from './pages/ToolRegistryPage';
import { PromptLibraryPage } from './pages/PromptLibraryPage';
import { MemoryPage } from './pages/MemoryPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExecutionLogsPage } from './pages/ExecutionLogsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { UsageCostControlsPage } from './pages/UsageCostControlsPage';
import { UsersPermissionsPage } from './pages/UsersPermissionsPage';
import { SecurityAuditPage } from './pages/SecurityAuditPage';
import { BackupRestorePage } from './pages/BackupRestorePage';
import { ImportExportPage } from './pages/ImportExportPage';
import { GeneralSettingsPage } from './pages/GeneralSettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Core 12 Dashboard Sections */}
          <Route index element={<OverviewPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="agents" element={<AllAgentsPage />} />
          <Route path="agents/new" element={<AgentBuilderPage />} />
          <Route path="agents/:id" element={<AgentWorkspacePage />} />
          <Route path="workflows" element={<WorkflowBuilderPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="content" element={<GeneratedContentPage />} />
          <Route path="facebook-pages" element={<FacebookPagesPage />} />
          <Route path="google-sheets" element={<GoogleSheetsPage />} />
          <Route path="executions" element={<TasksPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="failed-jobs" element={<FailedJobsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="connections" element={<IntegrationsPage />} />
          <Route path="settings" element={<GeneralSettingsPage />} />

          {/* Ancillary Platform Tools */}
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="content-calendar" element={<ContentCalendarPage />} />
          <Route path="templates" element={<AgentTemplatesPage />} />
          <Route path="marketplace" element={<AgentMarketplacePage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="tools" element={<ToolRegistryPage />} />
          <Route path="prompts" element={<PromptLibraryPage />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="logs" element={<ExecutionLogsPage />} />
          <Route path="health" element={<SystemHealthPage />} />
          <Route path="usage-costs" element={<UsageCostControlsPage />} />
          <Route path="users" element={<UsersPermissionsPage />} />
          <Route path="audit-logs" element={<SecurityAuditPage />} />
          <Route path="backup-restore" element={<BackupRestorePage />} />
          <Route path="import-export" element={<ImportExportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
