import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Sliders,
  X,
  Mic,
  MicOff,
  Code2,
  Terminal,
  CornerDownLeft,
  ArrowUp,
  RotateCcw,
  Layers
} from 'lucide-react';

const SYSTEM_PRESETS = [
  { name: 'General Assistant', prompt: 'You are an elite, accurate, and insightful AI assistant. Answer directly and concisely.' },
  { name: 'Full-Stack Software Engineer', prompt: 'You are a senior full-stack software engineer and cloud architect. Write clean, production-ready, type-safe code with comments.' },
  { name: 'Bengali & English Specialist', prompt: 'You are a bilingual AI expert fluent in Bengali (বাংলা) and English. Answer naturally in the requested language.' },
  { name: 'Video Scriptwriter', prompt: 'You are an award-winning YouTube and TikTok scriptwriter. Write catchy hooks, engaging storytelling, and visual scene directions.' },
  { name: 'Business & Copywriting', prompt: 'You are an expert marketing copywriter and strategist. Write persuasive, high-converting copy.' }
];

// Helper to render markdown-like content cleanly without external heavy deps
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks
  const parts = useMemo(() => {
    const segments: Array<{ type: 'text' | 'code'; language?: string; text: string }> = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          text: content.slice(lastIndex, match.index)
        });
      }
      segments.push({
        type: 'code',
        language: match[1] || 'code',
        text: match[2].trimEnd()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        text: content.slice(lastIndex)
      });
    }

    return segments;
  }, [content]);

  return (
    <div className="space-y-3 leading-relaxed text-zinc-200">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <div
              key={idx}
              className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d10] font-mono text-xs shadow-sm"
            >
              <div className="px-3.5 py-1.5 bg-[#141418] border-b border-zinc-800 flex items-center justify-between text-zinc-400 select-none">
                <span className="text-[11px] font-medium text-zinc-400 tracking-wider">
                  {part.language}
                </span>
                <button
                  onClick={() => handleCopyCode(part.text, idx)}
                  className="flex items-center gap-1.5 text-[11px] hover:text-zinc-200 text-zinc-400 py-0.5 px-2 rounded hover:bg-zinc-800/60 transition-colors"
                >
                  {copiedIndex === idx ? (
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
              <pre className="p-3.5 overflow-x-auto text-zinc-200 text-[12px] leading-relaxed">
                <code>{part.text}</code>
              </pre>
            </div>
          );
        }

        // Render plain text with basic inline formatting
        const paragraphs = part.text.split('\n\n');
        return (
          <React.Fragment key={idx}>
            {paragraphs.map((p, pIdx) => {
              if (!p.trim()) return null;

              // Check for bullet list
              if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
                const items = p.split('\n').filter(i => i.trim());
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>
                        {item.replace(/^[-*]\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="whitespace-pre-wrap">
                  {p}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

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
        setNotification({ message: 'Listening... (Bengali or English)', type: 'info' });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

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
    setNotification({ message: 'Optimizing prompt...', type: 'info' });
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
  const isFree = selectedModel.endsWith(':free') || selectedModelObj?.is_free;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] relative overflow-hidden">
      {/* Top Header: Model Switcher & Persona controls */}
      <div className="h-12 border-b border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModelModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[180px] sm:max-w-[280px]">
              {selectedModelObj?.name?.split(':')[0]?.replace('OpenAI: ', '') || selectedModel.split('/').pop()}
            </span>
            {isFree ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Pro
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSystemModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Configure System Persona"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Persona</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {(!currentConv || currentConv.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
              <Layers className="w-5 h-5 text-zinc-300" />
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 mb-1.5">
              How can I assist you today?
            </h2>
            <p className="text-xs text-zinc-400 mb-8 max-w-md leading-relaxed">
              Choose from 460+ connected LLMs for full-stack engineering, deep chain-of-thought reasoning, multimodal vision, and content generation.
            </p>

            {/* Starter Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {[
                { title: 'Write a full-stack component', desc: 'Create a responsive React & Tailwind data table', icon: Code2 },
                { title: 'Explain with reasoning', desc: 'Break down complex logic step-by-step', icon: Terminal },
                { title: 'বাংলায় ভিডিও স্ক্রিপ্ট তৈরি করো', desc: 'একটি প্রোডাক্টের আকর্ষনীয় ৩০ সেকেন্ডের স্ক্রিপ্ট', icon: Sparkles },
                { title: 'Architecture analysis', desc: 'Evaluate trade-offs between database systems', icon: Bot }
              ].map((starter, i) => {
                const Icon = starter.icon;
                return (
                  <div
                    key={i}
                    onClick={() => handleSendMessage(starter.title + ': ' + starter.desc)}
                    className="group cursor-pointer p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.06] hover:border-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                      <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {starter.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {starter.desc}
                    </p>
                  </div>
                );
              })}
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
                className={`max-w-3xl mx-auto flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700/70 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                    <Bot className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}

                <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Attached Image */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-zinc-700/80 max-w-sm shadow-sm">
                      <img src={msg.imageUrl} alt="Attached" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Deep Reasoning Collapsible Box */}
                  {hasReasoning && (
                    <div className="w-full rounded-xl bg-zinc-900/90 border border-zinc-800 overflow-hidden text-xs text-zinc-400">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3 py-1.5 flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/60 transition-colors text-zinc-400 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Thought process</span>
                        </div>
                        {isReasoningOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                      </button>
                      {(isReasoningOpen || (!msg.content && isSending)) && (
                        <div className="p-3 bg-black/40 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-zinc-800/80 text-zinc-400">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full text-xs sm:text-sm leading-relaxed text-zinc-200">
                      {msg.content ? (
                        <FormattedMessage content={msg.content} />
                      ) : (
                        isSending && (
                          <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                            <span>{hasReasoning ? 'Synthesizing response...' : 'Connecting to model...'}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Message Metadata & Copy */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                      <span>{msg.model?.split('/').pop() || selectedModel.split('/').pop()}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-zinc-300 transition-colors text-zinc-500"
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
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Area (Linear/Claude style) */}
      <div className="p-3 sm:p-5 border-t border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          {/* Image preview chip */}
          {attachedImage && (
            <div className="relative inline-block mb-2">
              <img src={attachedImage} alt="Attachment" className="h-14 w-14 object-cover rounded-lg border border-zinc-700 shadow-sm" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-800 text-zinc-300 rounded-full flex items-center justify-center border border-zinc-600 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex flex-col bg-zinc-900/90 border border-zinc-700/80 focus-within:border-zinc-500 rounded-2xl p-2.5 shadow-lg transition-all">
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
              placeholder="Ask anything or describe a task (Shift + Return for new line)..."
              rows={2}
              className="w-full bg-transparent border-0 outline-none px-2 py-1 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 resize-none max-h-36 scrollbar-none"
            />

            {/* Bottom Actions Bar inside container */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] mt-1">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                  title="Attach Image (Vision AI)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Input */}
                <button
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title="Voice Input (Speech-to-Text)"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Prompt Optimizer */}
                <button
                  onClick={handleEnhanceInput}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors disabled:opacity-30"
                  title="Refine prompt"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSending || (!input.trim() && !attachedImage)}
                  className={`p-1.5 rounded-xl transition-all ${
                    input.trim() || attachedImage
                      ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
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
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSystemModal(false)}
        >
          <div
            className="bg-[#121215] border border-white/[0.09] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">System Persona</h3>
                <p className="text-xs text-zinc-400">Define how the model should behave and respond</p>
              </div>
              <button
                onClick={() => setShowSystemModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SYSTEM_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSystemPrompt(p.prompt)}
                    className="p-2 text-left rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Custom Instructions</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="e.g. Always respond concisely in Bengali or English..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  setSystemPrompt('');
                  setShowSystemModal(false);
                }}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setNotification({ message: 'System instructions saved', type: 'success' });
                  setShowSystemModal(false);
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 rounded-lg hover:bg-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
