import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenRouterService } from '../../services/openrouter';
import { ChatMessage } from '../../types';
import { ModelSelectorModal } from './ModelSelectorModal';
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
  RefreshCw,
  Mic,
  MicOff,
  Code2,
  Terminal,
  CornerDownLeft
} from 'lucide-react';

const SYSTEM_PRESETS = [
  { name: 'General Assistant', prompt: 'You are ZUU AI, an elite, accurate, and insightful AI assistant.' },
  { name: 'Full-Stack Architect', prompt: 'You are a senior full-stack software engineer and cloud architect. Write clean, production-ready, type-safe code with comments.' },
  { name: 'Bengali & English Specialist', prompt: 'You are a bilingual AI expert fluent in Bengali (বাংলা) and English. Answer naturally in the requested language.' },
  { name: 'Viral Video Scriptwriter', prompt: 'You are an award-winning YouTube and TikTok scriptwriter. Write catchy hooks, engaging storytelling, and visual directions.' },
  { name: 'Creative Storyteller', prompt: 'You are a master novelist with vivid sensory descriptions and compelling dialogue.' }
];

export const ChatStudio: React.FC = () => {
  const {
    activeConversation,
    activeConversationId,
    createConversation,
    addMessageToActive,
    updateLastMessageChunk,
    models,
    selectedModel,
    settings,
    setNotification
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConv = activeConversation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isSending]);

  useEffect(() => {
    if (currentConv?.systemPrompt) {
      setSystemPrompt(currentConv.systemPrompt);
    }
  }, [currentConv?.id]);

  // Speech Recognition (Mic Input)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotification({ message: 'Speech recognition is not supported in this browser.', type: 'info' });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD, en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setNotification({ message: 'Listening... Speak in Bengali or English', type: 'info' });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

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

    const assistantPlaceholder: ChatMessage = {
      id: crypto.randomUUID(),
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

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
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

  const selectedModelObj = models.find((m) => m.id === selectedModel);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-neutral-950 relative overflow-hidden">
      {/* Top Bar: Model Button & Controls */}
      <div className="h-14 border-b border-white/5 bg-neutral-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
        <button
          onClick={() => setIsModelModalOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-white/10 hover:border-purple-500/40 text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[180px] sm:max-w-[280px]">
            {selectedModelObj?.name || selectedModel}
          </span>
          {selectedModel.endsWith(':free') ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              FREE
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              PRO
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSystemModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-all"
            title="System Persona"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Persona</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {(!currentConv || currentConv.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-600/30 mb-4 animate-in zoom-in-95 duration-200">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Ready to create with ZUU AI?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mb-8 max-w-md">
              Ask complex questions, analyze code, translate Bengali/English, or generate video scripts using 460+ connected models.
            </p>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {[
                { title: 'বাংলায় ভিডিও স্ক্রিপ্ট', desc: 'একটি প্রোডাক্ট মার্কেটিং স্ক্রিপ্ট তৈরি করো', icon: '🎬' },
                { title: 'Code Architect', desc: 'Write a full-stack Next.js or React component', icon: '💻' },
                { title: 'Explain Deep Reasoning', desc: 'How does DeepSeek R1 solve complex logic?', icon: '🧠' },
                { title: 'Creative Storytelling', desc: 'Craft a thrilling sci-fi narrative in neo-Tokyo', icon: '✨' }
              ].map((starter, i) => (
                <div
                  key={i}
                  onClick={() => handleSendMessage(starter.title + ': ' + starter.desc)}
                  className="group cursor-pointer p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-white/5 hover:border-purple-500/30 transition-all active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{starter.icon}</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {starter.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {starter.desc}
                  </p>
                </div>
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

                <div className={`flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Attached Image */}
                  {msg.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 max-w-sm shadow-md">
                      <img src={msg.imageUrl} alt="Attached" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Deep Reasoning Box (DeepSeek R1 / o1) */}
                  {hasReasoning && (
                    <div className="w-full rounded-2xl bg-neutral-900/90 border border-purple-500/20 overflow-hidden text-xs text-neutral-400">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3.5 py-2 flex items-center justify-between bg-purple-950/20 hover:bg-purple-950/30 transition-colors text-purple-300 font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                          <span>Internal Thought & Reasoning</span>
                        </div>
                        {isReasoningOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                      </button>
                      {(isReasoningOpen || (!msg.content && isSending)) && (
                        <div className="p-3.5 bg-neutral-950/60 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-purple-500/10 text-neutral-300 animate-in fade-in">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-600/20'
                        : 'bg-neutral-900 text-neutral-100 border border-white/10 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {msg.content || (isSending && !isUser ? (hasReasoning ? '🧠 Synthesizing final answer...' : 'Connecting to AI model...') : '')}
                    </div>
                  </div>

                  {/* Footer actions */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2.5 text-[10px] text-neutral-500 px-1">
                      <span>{msg.model?.split('/').pop() || selectedModel.split('/').pop()}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        title="Copy text"
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

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          {/* Image preview */}
          {attachedImage && (
            <div className="relative inline-block mb-2">
              <img src={attachedImage} alt="Attachment" className="h-16 w-16 object-cover rounded-xl border border-white/20 shadow-md" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-neutral-900 border border-white/10 focus-within:border-purple-500/50 rounded-2xl px-3 py-2 shadow-xl transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Attach Image (Vision AI)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Mic Input */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-colors ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Speak with Voice"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* AI Enhance */}
            <button
              onClick={handleEnhanceInput}
              disabled={!input.trim()}
              className="p-2 rounded-xl text-neutral-400 hover:text-purple-400 hover:bg-white/5 transition-colors disabled:opacity-40"
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
              placeholder="Ask anything or speak (Enter to send, Shift+Enter for new line)..."
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none px-3 py-1.5 text-xs sm:text-sm text-white placeholder-neutral-500 resize-none max-h-32 scrollbar-none"
            />

            {/* Send */}
            <button
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !attachedImage) || isSending}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {/* System Persona Modal */}
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
