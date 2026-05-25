import { useState, useRef, useEffect } from 'react';
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
import { useFlowStore } from '../../store/flowStore';

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
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
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

// ─── Component ──────────────────────────────────────────────────────────────

export function PlaygroundModal({ open, onClose }: PlaygroundModalProps) {
  const { currentFlowName, currentFlowId } = useFlowStore();

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

  // Derive active session data
  const activeSession = sessions.find((s) => s.info.sessionId === activeSessionId) ?? sessions[0];
  const messages = activeSession.messages;

  // Sync flow name into all sessions when flow changes
  useEffect(() => {
    setSessions((prev) =>
      prev.map((s) => ({ ...s, info: { ...s.info, flowName: currentFlowName } }))
    );
  }, [currentFlowName]);

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

    // Placeholder response — replace with real API call once endpoint is shared
    try {
      await new Promise((r) => setTimeout(r, 800));
      const assistantMsg: ChatMessage = {
        id: uid('msg-'),
        role: 'assistant',
        content: `[Playground] Received: "${text}"\n\nThis is a placeholder response. Connect the playground to your flow execution endpoint to get real results.`,
        timestamp: nowTime(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.info.sessionId === sessionId
            ? { ...s, messages: [...s.messages, assistantMsg], info: { ...s.info, status: 'idle' } }
            : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.info.sessionId === sessionId
            ? { ...s, info: { ...s.info, status: 'error' } }
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
              <DialogTitle className="text-base font-semibold">Playground</DialogTitle>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {currentFlowName}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mr-7">
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
                  <SelectValue placeholder="Select session" />
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
              Session Details — {activeSession.info.sessionName}
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
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Session Name</span>
                <span className="text-xs font-medium text-foreground">{activeSession.info.sessionName}</span>
              </div>
              {/* Created At */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Created At
                </span>
                <span className="text-xs text-foreground whitespace-nowrap">{activeSession.info.createdAt}</span>
              </div>
              {/* Divider */}
              <div className="w-px self-stretch bg-border mx-1" />
              {/* All Sessions */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">All Sessions</span>
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
                Send a message to start the playground session.
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
