import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Play,
  Send,
  Bot,
  User,
  Plus,
  ChevronDown,
  ChevronUp,
  Hash,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LABELS } from '../../lib/labels';
import { useFlowStore } from '../../store/flowStore';
import { llmService } from '../../services/llmService';
import type { LlmChatMessage } from '../../models/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SessionInfo {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  flowName: string;
  status: 'active' | 'idle' | 'error';
}

interface StoredSession {
  info: SessionInfo;
  messages: ChatMessage[];
}

interface PlaygroundModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function nowFull() {
  return new Date().toLocaleString();
}

function makeSession(flowName: string, index: number): StoredSession {
  return {
    info: {
      sessionId: uid('sess-'),
      sessionName: `Session ${index}`,
      createdAt: nowFull(),
      flowName,
      status: 'idle',
    },
    messages: [],
  };
}

// Maps frontend node type to the backend-supported provider name.
// Using Map instead of a plain object avoids Generic Object Injection Sink:
// Map.get() does not access object properties by user-controlled key.
const NODE_TYPE_TO_PROVIDER = new Map<string, string>([
  ['ollama-llm',       'ollama'],
  ['openai-llm',       'azure_openai'],  // backend uses Azure OpenAI connector (OpenAI-compatible)
  ['azure-openai-llm', 'azure_openai'],  // Azure OpenAI
  ['anthropic-llm',    'bedrock'],       // Anthropic via AWS Bedrock
  ['google-llm',       'vertex_ai'],     // Google via Vertex AI
  ['mistral-llm',      'bedrock'],       // Mistral via AWS Bedrock
  ['cohere-llm',       'bedrock'],       // Cohere via AWS Bedrock
]);

// Resolve backend provider from node config (explicit override) or derived from node type.
// Map.get() is safe from prototype-pollution — no bracket access on a plain object.
function resolveProvider(nodeType: string, config: Record<string, unknown>): string {
  return String(config.llm_provider ?? NODE_TYPE_TO_PROVIDER.get(nodeType) ?? 'ollama');
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PlaygroundModal({ open, onClose }: PlaygroundModalProps) {
  const { currentFlowName, currentFlowId, nodes } = useFlowStore();

  // Use flow ID (or name as fallback) as the key so sessions are isolated per flow
  const flowKey = currentFlowId ?? currentFlowName;

  const initialSession = makeSession(currentFlowName, 1);

  // All sessions — persisted across "New Session" clicks
  const [sessions, setSessions] = useState<StoredSession[]>([initialSession]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSession.info.sessionId);

  const [showSessionDetails, setShowSessionDetails] = useState(true);

  // Input settings
  const [inputType, setInputType] = useState<'chat' | 'text' | 'json'>('chat');

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Per-flow session cache ─────────────────────────────────────────────
  // Stores snapshots for every flow visited so history is preserved when switching.
  // Map.get/set avoids Generic Object Injection Sink on bracket access.
  type FlowSnapshot = { sessions: StoredSession[]; activeSessionId: string };
  const flowSnapshotsRef = useRef<Map<string, FlowSnapshot>>(new Map());

  // Always-current refs so the flow-switch effect can read latest state synchronously.
  // Updated via useLayoutEffect (runs after render, before effects) to satisfy react-hooks/refs.
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  useLayoutEffect(() => {
    sessionsRef.current = sessions;
    activeSessionIdRef.current = activeSessionId;
  });

  // Track which flow we were on before the current render
  const prevFlowKeyRef = useRef(flowKey);

  // Derive active session data
  const activeSession = sessions.find((s) => s.info.sessionId === activeSessionId) ?? sessions[0];
  const messages = activeSession.messages;

  // Save current sessions for the old flow then restore (or create fresh) for the new flow
  useEffect(() => {
    const prevKey = prevFlowKeyRef.current;
    if (prevKey !== flowKey) {
      // Save snapshot for the flow we're leaving
      flowSnapshotsRef.current.set(prevKey, {
        sessions: sessionsRef.current,
        activeSessionId: activeSessionIdRef.current,
      });
      prevFlowKeyRef.current = flowKey;
    }

    const snapshot = flowSnapshotsRef.current.get(flowKey);
    if (snapshot) {
      setSessions(snapshot.sessions);
      setActiveSessionId(snapshot.activeSessionId);
    } else {
      const fresh = makeSession(currentFlowName, 1);
      setSessions([fresh]);
      setActiveSessionId(fresh.info.sessionId);
    }
    setInputValue('');
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create a new session without destroying existing ones
  const newSession = () => {
    const next = makeSession(currentFlowName, sessions.length + 1);
    setSessions((prev) => [...prev, next]);
    setActiveSessionId(next.info.sessionId);
    setInputValue('');
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Capture session ID at send time to avoid stale closure
    const sessionId = activeSession.info.sessionId;

    const userMsg: ChatMessage = {
      id: uid('msg-'),
      role: 'user',
      content: text,
      timestamp: nowTime(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.info.sessionId === sessionId
          ? { ...s, messages: [...s.messages, userMsg], info: { ...s.info, status: 'active' } }
          : s
      )
    );
    setInputValue('');
    setIsLoading(true);

    // Resolve provider + model from the first LLM node in the flow
    const llmNode = nodes.find((n) => n.data.definition.category === 'llm');
    const nodeType = llmNode?.data.definition.type ?? '';
    const nodeConfig = llmNode?.data.config ?? {};
    const provider = resolveProvider(nodeType, nodeConfig);
    const model = String(nodeConfig.model ?? '');
    // Prefer temperature/tokens from the node config; fall back to sensible defaults
    const temperature = typeof nodeConfig.temperature === 'number' ? nodeConfig.temperature : 0.7;
    const maxTokens =
      typeof nodeConfig.num_predict === 'number' ? nodeConfig.num_predict  // Ollama field
      : typeof nodeConfig.max_tokens === 'number' ? nodeConfig.max_tokens  // OpenAI / others
      : 1000;

    // Build full conversation history from current session messages + new user message
    const history = activeSession.messages.map<LlmChatMessage>((m) => ({
      role: m.role,
      content: m.content,
    }));
    const llmMessages: LlmChatMessage[] = [
      ...history,
      { role: 'user', content: text },
    ];

    try {
      const data = await llmService.chat({
        provider,
        model,
        messages: llmMessages,
        temperature,
        max_tokens: maxTokens,
      });
      const assistantMsg: ChatMessage = {
        id: uid('msg-'),
        role: 'assistant',
        content: data.response,
        timestamp: nowTime(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.info.sessionId === sessionId
            ? { ...s, messages: [...s.messages, assistantMsg], info: { ...s.info, status: 'idle' } }
            : s
        )
      );
    } catch (err) {
      const errorText =
        err instanceof Error
          ? `${LABELS.PLAYGROUND_ERROR_PREFIX}${err.message}`
          : `${LABELS.PLAYGROUND_ERROR_PREFIX}Unknown error`;
      const errorMsg: ChatMessage = {
        id: uid('msg-'),
        role: 'assistant',
        content: errorText,
        timestamp: nowTime(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.info.sessionId === sessionId
            ? { ...s, messages: [...s.messages, errorMsg], info: { ...s.info, status: 'error' } }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-3xl w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-primary fill-current" />
              </div>
              <DialogTitle className="text-base font-semibold">{LABELS.PLAYGROUND_TITLE}</DialogTitle>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {currentFlowName}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mr-7">
              {/* LLM indicator — provider/model come from the LLM node in the flow */}
              {(() => {
                const llmNode = nodes.find((n) => n.data.definition.category === 'llm');
                if (!llmNode) return (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                    No LLM node
                  </Badge>
                );
                const nodeType = llmNode.data.definition.type;
                const provider = resolveProvider(nodeType, llmNode.data.config);
                const model = String(llmNode.data.config.model ?? '');
                return (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono max-w-[200px] truncate">
                    {provider}{model ? ` · ${model}` : ''}
                  </Badge>
                );
              })()}

              {/* Divider */}
              <div className="w-px h-4 bg-border" />

              {/* Input Type */}
              <Select value={inputType} onValueChange={(v) => setInputType(v as typeof inputType)}>
                <SelectTrigger className="h-7 text-xs w-24 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>

              {/* Divider */}
              <div className="w-px h-4 bg-border" />

              {/* New Session — placed before session list for clear grouping */}
              <Button
                size="icon"
                variant="ghost"
                title="New Session"
                aria-label="New Session"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={newSession}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>

              {/* Session switcher — preserves all past sessions */}
              <Select value={activeSessionId} onValueChange={(id) => { setActiveSessionId(id); setInputValue(''); }}>
                <SelectTrigger className="h-7 text-xs w-40 bg-background">
                  <SelectValue placeholder={LABELS.PLAYGROUND_SELECT_SESSION_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.info.sessionId} value={s.info.sessionId}>
                      <span className="flex items-center gap-1.5">
                        <span>{s.info.sessionName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({s.messages.length} msg{s.messages.length !== 1 ? 's' : ''})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* ── Session Details ── */}
        <div className="flex-shrink-0 border-b border-border">
          <button
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-muted/40 transition-colors text-xs font-medium text-muted-foreground"
            onClick={() => setShowSessionDetails((v) => !v)}
          >
            <span className="flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              {LABELS.PLAYGROUND_SESSION_DETAILS} — {activeSession.info.sessionName}
            </span>
            {showSessionDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showSessionDetails && (
            <div className="px-5 pb-3 flex items-start gap-6">
              {/* Session Name */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{LABELS.PLAYGROUND_SESSION_NAME_LABEL}</span>
                <span className="text-xs font-medium text-foreground">{activeSession.info.sessionName}</span>
              </div>
              {/* Created At */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {LABELS.PLAYGROUND_CREATED_AT_LABEL}
                </span>
                <span className="text-xs text-foreground whitespace-nowrap">{activeSession.info.createdAt}</span>
              </div>
              {/* Divider */}
              <div className="w-px self-stretch bg-border mx-1" />
              {/* All Sessions */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{LABELS.PLAYGROUND_ALL_SESSIONS_LABEL}</span>
                <div className="flex flex-wrap gap-1.5">
                  {sessions.map((s) => (
                    <button
                      key={s.info.sessionId}
                      onClick={() => { setActiveSessionId(s.info.sessionId); setInputValue(''); }}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                        s.info.sessionId === activeSessionId
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
                      )}
                    >
                      {s.info.sessionName} · {s.messages.length} msg{s.messages.length !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                {LABELS.PLAYGROUND_EMPTY_STATE}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center',
                  msg.role === 'user'
                    ? 'bg-primary/15 border border-primary/30'
                    : 'bg-muted border border-border',
                )}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[75%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm',
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    'text-[10px] mt-1 opacity-60',
                    msg.role === 'user' ? 'text-right' : 'text-left',
                  )}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-7 h-7 rounded-full flex-shrink-0 bg-muted border border-border flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ── */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border bg-card/80">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                inputType === 'json'
                  ? '{ "key": "value" }'
                  : inputType === 'text'
                  ? 'Enter text input…'
                  : 'Send a message…'
              }
              className="h-9 text-sm bg-background"
              disabled={isLoading}
            />
            <Button
              size="icon"
              aria-label="Send message"
              className="h-9 w-9 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
