import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterService } from '../../services/openrouter';
import { ChatMessage } from '../../types';
import {
  Send,
  Paperclip,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  Sliders,
  X,
  Search,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

const SYSTEM_PRESETS = [
  { name: 'General Assistant', prompt: 'You are ZUU AI, a world-class helpful, accurate, and insightful AI assistant.' },
  { name: 'Full-Stack Coder', prompt: 'You are an elite senior full-stack engineer and software architect. Write clean, production-ready, type-safe code with comments and explanation.' },
  { name: 'Bengali & English Specialist', prompt: 'You are a bilingual AI expert fluent in both Bengali (বাংলা) and English. Answer naturally in the user requested language.' },
  { name: 'Video Scriptwriter', prompt: 'You are an award-winning YouTube and TikTok scriptwriter. Write catchy hooks, engaging storytelling, and visual directions.' },
  { name: 'Creative Storyteller', prompt: 'You are a master storyteller and creative novelist with vivid descriptions, compelling dialogue, and rich world-building.' }
];

export const ChatStudio: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    activeConversation,
    createConversation,
    addMessageToActive,
    updateLastMessageChunk,
    models,
    selectedModel,
    setSelectedModel,
    settings,
    setNotification
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConv = activeConversation();

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isSending]);

  // Sync active system prompt
  useEffect(() => {
    if (currentConv?.systemPrompt) {
      setSystemPrompt(currentConv.systemPrompt);
    }
  }, [currentConv?.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent && !attachedImage) return;
    if (isSending) return;

    let convId = activeConversationId;
    if (!convId || !currentConv) {
      const newConv = createConversation(selectedModel);
      convId = newConv.id;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      imageUrl: attachedImage || undefined,
      createdAt: new Date().toISOString()
    };

    addMessageToActive(userMessage);
    setInput('');
    setAttachedImage(null);
    setIsSending(true);

    // Placeholder assistant message for streaming
    const assistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      createdAt: new Date().toISOString()
    };
    addMessageToActive(assistantPlaceholder);

    try {
      const convHistory = currentConv ? [...currentConv.messages, userMessage] : [userMessage];

      await OpenRouterService.sendChatCompletion({
        apiKey: settings.openRouterApiKey,
        model: selectedModel,
        messages: convHistory,
        systemPrompt: systemPrompt || undefined,
        temperature: settings.temperature || 0.7,
        onChunk: (chunk, reasoningChunk) => {
          updateLastMessageChunk(chunk, reasoningChunk);
        }
      });
    } catch (err: any) {
      updateLastMessageChunk(`\n\n❌ **Error:** ${err.message || 'Failed to generate response'}`);
      setNotification({ message: err.message || 'Generation error', type: 'error' });
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleEnhanceInput = async () => {
    if (!input.trim()) return;
    setNotification({ message: 'Enhancing prompt with AI...', type: 'info' });
    const enhanced = await OpenRouterService.enhancePrompt(input, 'image', settings.openRouterApiKey);
    setInput(enhanced);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const selectedModelObj = models.find((m) => m.id === selectedModel);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-neutral-950 relative overflow-hidden">
      {/* Top Chat Bar: Model Selector & Settings */}
      <div className="h-14 border-b border-white/5 bg-neutral-900/50 backdrop-blur px-4 flex items-center justify-between z-20">
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-white/10 text-xs font-medium text-white transition-all shadow-sm"
          >
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span className="truncate max-w-[180px] sm:max-w-[260px]">
              {selectedModelObj?.name || selectedModel}
            </span>
            {selectedModel.endsWith(':free') && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                FREE
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Model Picker Dropdown */}
          {showModelPicker && (
            <div className="absolute top-12 left-0 w-80 sm:w-96 max-h-[480px] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl">
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search 460+ models..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredModels.slice(0, 50).map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                          : 'hover:bg-white/5 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{m.name}</span>
                        {m.is_free && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            FREE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {m.id} • Context: {Math.round(m.context_length / 1000)}k
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: System Prompt Button */}
        <button
          onClick={() => setShowSystemModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
          title="Configure System Prompt"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">System Prompt</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {(!currentConv || currentConv.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-600/20 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              How can ZUU AI help you today?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mb-6">
              Powered by OpenRouter 460+ models. Ask anything in English or Bengali, analyze images, or generate scripts.
            </p>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {[
                'বাংলায় আমাকে একটি ভিডিও স্ক্রিপ্ট লিখে দাও',
                'Write an optimized React TypeScript component',
                'Create a 30s marketing pitch for a SaaS product',
                'Explain how DeepSeek R1 reasoning works'
              ].map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(starter)}
                  className="p-3 text-left rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-xs text-neutral-300 hover:text-white transition-all active:scale-[0.98]"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentConv.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasReasoning = Boolean(msg.reasoning && msg.reasoning.trim());
            const isReasoningOpen = expandedReasoning[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Attached Image for User */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 max-w-xs shadow-md">
                      <img src={msg.imageUrl} alt="Attached" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Reasoning Accordion (DeepSeek R1 / o1 thinking) */}
                  {hasReasoning && (
                    <div className="w-full rounded-xl bg-neutral-900/90 border border-purple-500/20 overflow-hidden text-xs text-neutral-400">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between bg-purple-950/20 hover:bg-purple-950/30 transition-colors text-purple-300 font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                          <span>Thought Process & Reasoning</span>
                        </div>
                        {isReasoningOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {isReasoningOpen && (
                        <div className="p-3 bg-neutral-950/40 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-purple-500/10 text-neutral-300">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-600/20'
                        : 'bg-neutral-900 text-neutral-100 border border-white/10 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content || (isSending && !isUser ? 'Thinking...' : '')}</div>
                  </div>

                  {/* Action buttons (Copy, model badge) */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 px-1">
                      <span>{msg.model?.split('/').pop() || selectedModel.split('/').pop()}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-neutral-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="relative inline-block mb-2">
              <img src={attachedImage} alt="Attachment" className="h-16 w-16 object-cover rounded-xl border border-white/20 shadow-md" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-neutral-900 border border-white/10 focus-within:border-purple-500/50 rounded-2xl px-3 py-2 shadow-xl transition-all">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Attach Image (Vision AI)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* AI Enhance Button */}
            <button
              onClick={handleEnhanceInput}
              disabled={!input.trim()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-400 hover:bg-white/5 transition-colors disabled:opacity-40"
              title="Enhance prompt with AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything or attach an image (Enter to send, Shift+Enter for new line)..."
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none px-3 py-1 text-xs sm:text-sm text-white placeholder-neutral-500 resize-none max-h-32 scrollbar-none"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !attachedImage) || isSending}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 text-center text-[10px] text-neutral-500">
            ZUU AI Studio • Direct OpenRouter connection • Free models daily quota active
          </div>
        </div>
      </div>

      {/* System Prompt Modal */}
      {showSystemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                System Persona & Instructions
              </h3>
              <button
                onClick={() => setShowSystemModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Preset Personas:</label>
                <div className="flex flex-wrap gap-1.5">
                  {SYSTEM_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setSystemPrompt(preset.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 border border-white/5"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Custom System Prompt:</label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="e.g. You are a senior React architect..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSystemPrompt('');
                  setShowSystemModal(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={() => setShowSystemModal(false)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white shadow-md shadow-purple-600/20"
              >
                Save Persona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
