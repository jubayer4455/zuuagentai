import React from 'react';
import { useAppStore } from './store/useAppStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ChatStudio } from './components/chat/ChatStudio';
import { ImageStudio } from './components/image/ImageStudio';
import { VideoStudio } from './components/video/VideoStudio';
import { ModelExplorer } from './components/models/ModelExplorer';
import { SettingsModal } from './components/settings/SettingsModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, notification, setNotification } = useAppStore();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'chat' && <ChatStudio />}
          {activeTab === 'image' && <ImageStudio />}
          {activeTab === 'video' && <VideoStudio />}
          {activeTab === 'models' && <ModelExplorer />}
          {activeTab === 'settings' && <SettingsModal />}
        </main>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 border border-white/15 text-xs text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}

          <span>{notification.message}</span>

          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:text-white text-neutral-400 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
