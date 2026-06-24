'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Send, Bot, User, Sparkles, RefreshCw, AlertCircle,
    FileText, CalendarDays, UserCircle2, ChevronDown, ChevronUp,
    Loader2, Zap, Shield, Brain, Activity, Pill, BookOpen, X
} from 'lucide-react';
import { ragApi, RAGQueryResponse, SourceChunk } from '@/lib/api/rag';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: SourceChunk[];
    timestamp: Date;
    isError?: boolean;
    answerMode?: 'record_grounded' | 'general_medical';
    followUpQuestions?: string[];
}

const SUGGESTED_QUERIES = [
    "What are my recent medical records?",
    "When is my next appointment?",
    "What was the reason for my last visit?",
    "Show my confirmed appointments.",
    "What chronic conditions do I have active?",
    "Show me my current active prescriptions."
];

// ── Source Badge ───────────────────────────────────────────────────────────────
function SourceBadge({ chunk }: { chunk: SourceChunk }) {
    const [expanded, setExpanded] = useState(false);

    let icon = <FileText className="w-3.5 h-3.5" />;
    let color = 'bg-blue-50 text-blue-700 border-blue-200';

    switch (chunk.source_type) {
        case 'profile':
            icon = <UserCircle2 className="w-3.5 h-3.5" />;
            color = 'bg-sky-50 text-sky-700 border-sky-200';
            break;
        case 'record':
            icon = <FileText className="w-3.5 h-3.5" />;
            color = 'bg-blue-50 text-blue-700 border-blue-200';
            break;
        case 'appointment':
            icon = <CalendarDays className="w-3.5 h-3.5" />;
            color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            break;
        case 'vital':
            icon = <Activity className="w-3.5 h-3.5" />;
            color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            break;
        case 'diagnosis':
            icon = <FileText className="w-3.5 h-3.5" />;
            color = 'bg-rose-50 text-rose-700 border-rose-200';
            break;
        case 'prescription':
            icon = <Pill className="w-3.5 h-3.5" />;
            color = 'bg-amber-50 text-amber-700 border-amber-200';
            break;
        case 'parsed_data':
            icon = <Sparkles className="w-3.5 h-3.5" />;
            color = 'bg-violet-50 text-violet-700 border-violet-200';
            break;
        case 'access_grant':
            icon = <Shield className="w-3.5 h-3.5" />;
            color = 'bg-teal-50 text-teal-700 border-teal-200';
            break;
        default:
            icon = <FileText className="w-3.5 h-3.5" />;
            color = 'bg-slate-50 text-slate-700 border-slate-200';
    }

    return (
        <div className={`text-[11px] border rounded-xl overflow-hidden ${color}`}>
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left hover:brightness-95 transition-all"
            >
                {icon}
                <span className="font-bold capitalize">{chunk.source_type.replace('_', ' ')}</span>
                <span className="ml-auto text-[10px] font-medium opacity-60">
                    score: {chunk.score.toFixed(3)}
                </span>
                {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
            {expanded && (
                <div className="px-3 pb-2 text-[11px] leading-relaxed font-medium opacity-80 border-t border-current/20">
                    {chunk.text.slice(0, 300)}{chunk.text.length > 300 ? '…' : ''}
                </div>
            )}
        </div>
    );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ message, onQuestionClick }: { message: Message, onQuestionClick: (q: string) => void }) {
    const isUser = message.role === 'user';
    const [showSources, setShowSources] = useState(false);

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                isUser 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                    : 'bg-gradient-to-br from-violet-500 to-purple-700 text-white'
            }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble + Sources */}
            <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm ${
                    isUser
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                        : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Sources toggle */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="w-full space-y-1.5">
                        <button
                            type="button"
                            onClick={() => setShowSources(s => !s)}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <Shield className="w-3 h-3" />
                            {showSources ? 'Hide' : 'Show'} {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                        </button>
                        {showSources && (
                            <div className="space-y-1 w-full">
                                {message.sources.map((src, i) => (
                                    <SourceBadge key={i} chunk={src} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Grounded vs General badge */}
                {!isUser && message.answerMode && (
                    <div className="flex items-center">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border shadow-sm ${
                            message.answerMode === 'record_grounded'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                            {message.answerMode === 'record_grounded' ? (
                                <>
                                    <Shield className="w-3 h-3 text-emerald-600" />
                                    <span>MedChain Grounded</span>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="w-3 h-3 text-indigo-600" />
                                    <span>General Medical</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Suggested follow-up questions */}
                {!isUser && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="space-y-1.5 w-full mt-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Follow-up:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {message.followUpQuestions.map((fq, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onQuestionClick(fq)}
                                    className="text-left text-[10px] font-bold text-violet-700 bg-violet-50/50 hover:bg-violet-100 border border-violet-100 rounded-full px-2.5 py-1 transition-all active:scale-95"
                                >
                                    {fq}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-[9px] text-slate-400 font-medium px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}

// ── Floating AIAssistantWidget ───────────────────────────────────────────────
export function AIAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isReindexing, setIsReindexing] = useState(false);
    const [indexStatus, setIndexStatus] = useState<{ loaded: boolean; vectors: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Get user role and initial details
    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setUserRole(role);

        if (role === 'PATIENT') {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: "👋 Hello! I'm **MedChain AI**, your personal health assistant.\n\nI can help you search your medical records, check appointment schedules, look up prescriptions, and answer healthcare questions.\n\nWhat can I assist you with today?",
                timestamp: new Date(),
            }]);

            // Check index health
            ragApi.health().then(h => {
                setIndexStatus({ loaded: h.index_loaded, vectors: h.total_vectors });
            }).catch(() => setIndexStatus({ loaded: false, vectors: 0 }));
        }
    }, []);

    // Auto scroll chat
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isLoading, isOpen]);

    // Send query
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        setError(null);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const resp: RAGQueryResponse = await ragApi.query({ 
                query: text.trim(), 
                top_k: 5 
            });
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: resp.answer,
                sources: resp.sources,
                timestamp: new Date(),
                answerMode: resp.answer_mode,
                followUpQuestions: resp.follow_up_questions,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            const detail = err.message || 'Something went wrong';
            const errMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ ${detail}\n\nIf this is your first time using MedChain AI, please build the index to load your knowledge base.`,
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errMsg]);
            setError(detail);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    // Reindex trigger
    const handleReindex = async () => {
        setIsReindexing(true);
        setError(null);
        try {
            const result = await ragApi.reindex();
            setIndexStatus({ loaded: true, vectors: result.total_chunks });
            const sysMsg: Message = {
                id: 'reindex-' + Date.now(),
                role: 'assistant',
                content: `✅ Knowledge base rebuilt successfully!\n${result.total_chunks} document chunks indexed from your medical files, vitals, prescriptions, and access logs.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, sysMsg]);
        } catch (err: any) {
            setError(err.message || 'Reindex failed');
        } finally {
            setIsReindexing(false);
        }
    };

    // Keyboard handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    // Do not show widget for doctors or if roles are not loaded yet
    if (userRole !== 'PATIENT') return null;

    return (
        <>
            {/* FLOATING ACTION BUTTON (FAB) */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    type="button"
                    onClick={() => setIsOpen(prev => !prev)}
                    className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none"
                    aria-label="Toggle MedChain AI Assistant"
                >
                    {/* Pulsing ring indicator */}
                    {!isOpen && (
                        <span className="absolute inset-0 rounded-full bg-violet-400/30 animate-ping pointer-events-none duration-1000" />
                    )}
                    
                    {isOpen ? (
                        <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
                    ) : (
                        <Brain className="w-7 h-7 text-white group-hover:animate-pulse" />
                    )}
                </button>
            </div>

            {/* SIDEBAR CONTAINER */}
            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l border-slate-100 shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] z-50 flex flex-col transition-all duration-300 ease-out transform ${
                    isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                }`}
            >
                {/* SIDEBAR HEADER */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-md">
                            <Brain className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-extrabold text-slate-900 leading-none">MedChain AI</h2>
                            {indexStatus !== null && (
                                <span className="text-[10px] text-slate-500 font-bold mt-1 inline-flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${indexStatus.loaded ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                    {indexStatus.loaded ? `${indexStatus.vectors} chunks ready` : 'Index not built'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Reindex Button */}
                        <button
                            type="button"
                            onClick={handleReindex}
                            disabled={isReindexing}
                            title="Rebuild Knowledge Index"
                            className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            {isReindexing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* WARNING BANNER FOR UNINDEXED HEALTH RECORDS */}
                {indexStatus !== null && !indexStatus.loaded && (
                    <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-100 text-[11px] flex gap-2 text-amber-800 font-semibold items-start">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            Index not built. 
                            <button 
                                onClick={handleReindex} 
                                className="underline ml-1 text-violet-700 hover:text-violet-900"
                            >
                                Build Index now
                            </button> to read your records.
                        </div>
                    </div>
                )}

                {/* MESSAGES VIEW */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/15">
                    {messages.map(msg => (
                        <div key={msg.id} className="space-y-2">
                            <MessageBubble message={msg} onQuestionClick={sendMessage} />
                        </div>
                    ))}

                    {/* Chat response loading */}
                    {isLoading && (
                        <div className="flex gap-2.5 animate-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-sm shrink-0 mt-1">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium ml-1">Analyzing details…</span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* QUICK START QUESTIONS */}
                {messages.length <= 1 && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Common Record Queries:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                            {SUGGESTED_QUERIES.map(q => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => sendMessage(q)}
                                    disabled={isLoading}
                                    className="text-left text-[10px] font-semibold text-slate-600 hover:text-violet-700 bg-slate-50 hover:bg-violet-50/50 border border-slate-200/60 hover:border-violet-200 rounded-xl px-2.5 py-2 transition-all active:scale-95 disabled:opacity-50 line-clamp-2"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* INPUT ZONE */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100/50 transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about prescriptions, records, or appointments..."
                            className="flex-1 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-400 resize-none outline-none min-h-[20px] max-h-[100px] leading-relaxed"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 text-center font-medium leading-relaxed">
                        MedChain AI provides support based on records and medical education. Consult a clinician for health decisions.
                    </p>
                </div>
            </div>
        </>
    );
}
