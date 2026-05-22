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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
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

// ─── Component ──────────────────────────────────────────────────────────────

export function PlaygroundModal({ open, onClose }: PlaygroundModalProps) {
  const { currentFlowName, currentFlowId } = useFlowStore();

  // Session
  const [session, setSession] = useState<SessionInfo>(() => ({
    sessionId: uid('sess-'),
    sessionName: 'Default Session',
    createdAt: nowFull(),
    flowName: currentFlowName,
    status: 'idle',
  }));

  const [showSessionDetails, setShowSessionDetails] = useState(true);

  // Input settings
  const [inputType, setInputType] = useState<'chat' | 'text' | 'json'>('chat');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync flow name into session when flow changes
  useEffect(() => {
    setSession((prev) => ({ ...prev, flowName: currentFlowName }));
  }, [currentFlowName]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetSession = () => {
    setMessages([]);
    setSession({
      sessionId: uid('sess-'),
      sessionName: 'Default Session',
      createdAt: nowFull(),
      flowName: currentFlowName,
      status: 'idle',
    });
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: uid('msg-'),
      role: 'user',
      content: text,
      timestamp: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setSession((prev) => ({ ...prev, status: 'active' }));

    // Placeholder response — replace with real API call once endpoint is shared
    try {
      await new Promise((r) => setTimeout(r, 800));
      const assistantMsg: ChatMessage = {
        id: uid('msg-'),
        role: 'assistant',
        content: `[Playground] Received: "${text}"\n\nThis is a placeholder response. Connect the playground to your flow execution endpoint to get real results.`,
        timestamp: nowTime(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSession((prev) => ({ ...prev, status: 'idle' }));
    } catch {
      setSession((prev) => ({ ...prev, status: 'error' }));
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

  const statusColor: Record<SessionInfo['status'], string> = {
    active: 'bg-green-500',
    idle: 'bg-yellow-400',
    error: 'bg-red-500',
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
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={resetSession}
            >
              <RefreshCw className="w-3 h-3" />
              New Session
            </Button>
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
              Session Details
            </span>
            {showSessionDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showSessionDetails && (
            <div className="px-5 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Session ID */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Session ID</span>
                <span className="text-xs font-mono text-foreground truncate">{session.sessionId}</span>
              </div>
              {/* Session Name */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Session Name</span>
                <span className="text-xs font-medium text-foreground">{session.sessionName}</span>
              </div>
              {/* Flow */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Flow</span>
                <span className="text-xs font-medium text-foreground truncate">{session.flowName}</span>
              </div>
              {/* Created / Status */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', statusColor[session.status])} />
                  <span className="text-xs font-medium capitalize">{session.status}</span>
                </div>
              </div>
              {/* Created At */}
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Created At
                </span>
                <span className="text-xs text-foreground">{session.createdAt}</span>
              </div>
              {/* Flow ID */}
              {currentFlowId && (
                <div className="flex flex-col gap-0.5 col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Flow ID</span>
                  <span className="text-xs font-mono text-foreground truncate">{currentFlowId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Config Row ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-border bg-muted/20">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Input Type</span>
          <Select value={inputType} onValueChange={(v) => setInputType(v as typeof inputType)}>
            <SelectTrigger className="h-7 text-xs w-28 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
            {messages.length} msg{messages.length !== 1 ? 's' : ''}
          </Badge>
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
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press <kbd className="px-1 rounded border border-border text-[9px]">Enter</kbd> to send · Input: <strong>{inputType}</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
