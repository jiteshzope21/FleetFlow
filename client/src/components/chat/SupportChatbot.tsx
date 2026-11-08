import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LifeBuoy,
  History,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Cpu,
} from 'lucide-react';
import { chatService, IChatMessage, IChatConversationSummary, IChatSource } from '../../services/chat.service.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const SupportChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<IChatConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    'How do I assign a driver to a vehicle?',
    'Why is my vehicle blocked from dispatch?',
    'How do I calculate trip cost with AI?',
    'What are our subscription plan limits?',
  ]);

  // Escalation Modal
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateSubject, setEscalateSubject] = useState('');
  const [escalatePriority, setEscalatePriority] = useState('HIGH');
  const [escalateCategory, setEscalateCategory] = useState('TECHNICAL');
  const [escalating, setEscalating] = useState(false);
  const [escalationSuccess, setEscalationSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadModelInfo();
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadModelInfo = async () => {
    try {
      const info = await chatService.getModelInfo();
      setModelInfo(info);
    } catch {
      // ignore
    }
  };

  const loadConversations = async () => {
    try {
      const list = await chatService.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (convId: string) => {
    try {
      setLoading(true);
      const conv = await chatService.getConversationById(convId);
      setCurrentConversationId(conv._id);
      setMessages(conv.messages || []);
      setShowHistory(false);
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setEscalationSuccess(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await chatService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (currentConversationId === convId) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: IChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setEscalationSuccess(null);

    try {
      const data = await chatService.sendMessage(textToSend.trim(), currentConversationId || undefined);
      setCurrentConversationId(data.conversationId);

      const assistantMsg: IChatMessage = {
        role: 'assistant',
        content: data.response,
        ragSources: data.ragSources,
        modelStatus: data.modelStatus,
        latencyMs: data.latencyMs,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.suggestedFollowups && data.suggestedFollowups.length > 0) {
        setSuggestedFollowups(data.suggestedFollowups);
      }

      if (data.shouldEscalate && data.escalationMetadata) {
        setEscalateSubject(data.escalationMetadata.suggested_subject || textToSend.slice(0, 70));
        setEscalateCategory(data.escalationMetadata.category || 'TECHNICAL');
        setEscalatePriority(data.escalationMetadata.priority || 'HIGH');
      }

      loadConversations();
    } catch (err: any) {
      const errorMsg: IChatMessage = {
        role: 'assistant',
        content:
          'I am having trouble connecting to the FleetFlow AI engine right now. Please check your network or open a ticket on Customer Support (/support).',
        modelStatus: 'NETWORK_ERROR',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(`msg-${index}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConversationId || !escalateSubject.trim()) return;

    setEscalating(true);
    try {
      const ticket = await chatService.escalateToTicket({
        conversationId: currentConversationId,
        subject: escalateSubject.trim(),
        priority: escalatePriority,
        category: escalateCategory,
      });

      setEscalateModalOpen(false);
      setEscalationSuccess(ticket.ticketNumber);

      // Append system notice
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Support ticket #${ticket.ticketNumber} has been opened and routed to human support. You can track progress under Support Tickets (/support).`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to escalate ticket');
    } finally {
      setEscalating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format text with bold, numbered lists and bullet points
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bold tags **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-[11px]"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });

          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2">
                <span className="text-brand-500 font-bold">•</span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          if (/^\d+\.\s/.test(line.trim())) {
            const num = line.trim().match(/^(\d+\.)/)?.[0];
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2">
                <span className="text-brand-600 dark:text-brand-400 font-semibold">{num}</span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-2xl shadow-brand-900/40 hover:scale-105 transition-all duration-200 group border border-brand-400/30"
          title="FleetFlow AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="tracking-wide">FleetFlow AI</span>
          <span className="hidden sm:inline text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-700/60 text-brand-100">
            SLM + RAG
          </span>
        </button>
      )}

      {/* Chat Window Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[640px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-brand-600 text-white">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">FleetFlow AI Assistant</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Cpu className="w-3 h-3 text-brand-400" />
                  <span>
                    {modelInfo?.active_mode === 'FINE_TUNED_SLM_WITH_RAG'
                      ? 'Domain SLM (Qwen 1.5B LoRA + RAG)'
                      : 'AI Support Assistant (Active)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${showHistory ? 'text-brand-400 bg-slate-800' : 'text-slate-300'}`}
                title="Conversation History"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                title="New Support Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Drawer Overlay */}
          {showHistory && (
            <div className="absolute inset-0 top-[57px] bg-slate-950/95 z-20 flex flex-col p-4 text-white overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Recent Support Threads
                </span>
                <button
                  onClick={startNewConversation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-[11px] font-bold text-white"
                >
                  <Plus className="w-3 h-3" /> New Chat
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  <p>No previous conversations.</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {conversations.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => selectConversation(c._id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between group transition-all ${
                        currentConversationId === c._id
                          ? 'border-brand-500/50 bg-brand-950/30 text-white'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold truncate">{c.title}</p>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" /> {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/50 hover:text-red-400 text-slate-500 transition-opacity"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Welcome to FleetFlow AI Support
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[320px]">
                  I am specialized in the FleetFlow platform: dispatching trips, managing trucks, tracking fuel, maintenance work orders, and billing.
                </p>

                <div className="w-full mt-6 space-y-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggested Questions
                  </span>
                  {suggestedFollowups.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 dark:hover:border-brand-500/50 text-xs text-slate-700 dark:text-slate-300 font-medium transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const isSystem = msg.role === 'system';

              if (isSystem) {
                return (
                  <div key={index} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 flex-shrink-0" />
                    <span>{msg.content}</span>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs ${
                        isAssistant
                          ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
                          : 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                      }`}
                    >
                      {isAssistant ? renderFormattedText(msg.content) : msg.content}
                    </div>

                    {/* Metadata & Actions for Assistant */}
                    {isAssistant && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        {msg.latencyMs ? <span>{(msg.latencyMs / 1000).toFixed(1)}s</span> : null}

                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="hover:text-slate-200 inline-flex items-center gap-0.5"
                          title="Copy response"
                        >
                          {copiedId === `msg-${index}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>

                        {/* RAG Citations Toggle */}
                        {msg.ragSources && msg.ragSources.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedSources((prev) => ({
                                ...prev,
                                [index]: !prev[index],
                              }))
                            }
                            className="inline-flex items-center gap-0.5 text-brand-500 hover:text-brand-400 font-semibold"
                          >
                            <span>Sources ({msg.ragSources.length})</span>
                            {expandedSources[index] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expanded RAG Sources */}
                    {isAssistant && expandedSources[index] && msg.ragSources && (
                      <div className="mt-2 w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">
                          Verified Knowledge Grounding:
                        </span>
                        {msg.ragSources.map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="truncate pr-2">• {s.header} ({s.source})</span>
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-brand-500">
                              {(s.score * 100).toFixed(0)}% match
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing / Reasoning Indicator */}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium">FleetFlow SLM is reasoning...</span>
                </div>
              </div>
            )}

            {/* Human Escalation Banner */}
            {currentConversationId && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-brand-950/40 to-slate-900 border border-brand-500/20 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Unresolved issue?</span>
                  <span className="text-[11px] text-slate-400">Escalate conversation to human support queue</span>
                </div>
                <button
                  onClick={() => setEscalateModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs whitespace-nowrap transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Followups Pills */}
          {suggestedFollowups.length > 0 && messages.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto no-scrollbar">
              {suggestedFollowups.slice(0, 3).map((f, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(f)}
                  className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:border-brand-400/40 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800/90 rounded-xl p-2 border border-slate-200 dark:border-slate-700/60 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask FleetFlow AI a question..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 resize-none outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 max-h-24 py-1"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className={`p-2 rounded-lg text-white font-bold transition-all ${
                  inputMessage.trim() && !loading
                    ? 'bg-brand-600 hover:bg-brand-500'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>Enter to send, Shift+Enter for newline</span>
              <span className="font-mono text-emerald-500">SLM Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-600/10 text-brand-600">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Escalate to Human Support
                </h3>
              </div>
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              A support ticket will be opened with this conversation transcript attached for the operations team to investigate.
            </p>

            <form onSubmit={handleEscalateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket Subject
                </label>
                <input
                  type="text"
                  required
                  value={escalateSubject}
                  onChange={(e) => setEscalateSubject(e.target.value)}
                  placeholder="Summary of operational or billing issue..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={escalatePriority}
                    onChange={(e) => setEscalatePriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={escalateCategory}
                    onChange={(e) => setEscalateCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="BILLING">BILLING</option>
                    <option value="GENERAL">GENERAL</option>
                    <option value="FEATURE_REQUEST">FEATURE_REQUEST</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEscalateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {escalating ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

