import { useRef, useEffect, useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Trash2, Download, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LABELS } from '../../lib/labels';

export function LogsPanel() {
  const { execution, clearLogs, toggleLogs } = useFlowStore();
  const { logs, status } = execution;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleDownloadLogs = () => {
    const text = logs.map((l) =>
      `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.nodeLabel ? `[${l.nodeLabel}] ` : ''}${l.message}${l.detail ? '\n  ' + l.detail : ''}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentflow_logs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = { idle: 'bg-muted-foreground', running: 'bg-primary animate-pulse', completed: 'bg-green-400', error: 'bg-destructive' }[status];
  const statusText = { idle: LABELS.LOGS_STATUS_IDLE, running: LABELS.LOGS_STATUS_RUNNING, completed: LABELS.LOGS_STATUS_COMPLETED, error: LABELS.LOGS_STATUS_ERROR }[status];

  return (
    <div className="h-52 flex flex-col bg-card border-t border-border flex-shrink-0 animate-slide-in-top">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColor)} />
        <span className="text-xs font-bold text-foreground">{LABELS.LOGS_PANEL_TITLE}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{logs.length}</Badge>
        <span className="text-[11px] text-muted-foreground">{statusText}</span>
        {execution.startedAt && execution.completedAt && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 100) / 10}s
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="w-3 h-3" />
            {LABELS.LOGS_AUTO_SCROLL}
          </label>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDownloadLogs} title={LABELS.LOGS_DOWNLOAD_TITLE}>
            <Download className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clearLogs} title={LABELS.LOGS_CLEAR_TITLE}>
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={toggleLogs}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-3 py-2 font-mono text-[11px] space-y-0.5"
        style={{ background: 'hsl(222 25% 5%)' }}
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-[11px]">{LABELS.LOGS_PANEL_EMPTY}</p>
          </div>
        ) : (
          logs.map((log) => {
            const hasDetail = Boolean(log.detail);
            const isExpanded = expandedLogs[log.id];
            return (
              <div key={log.id} className="leading-relaxed">
                <div
                  className={cn(
                    'flex items-start gap-2 group',
                    hasDetail && 'cursor-pointer hover:bg-white/5 -mx-1 px-1 rounded'
                  )}
                  onClick={() => hasDetail && setExpandedLogs((p) => ({ ...p, [log.id]: !p[log.id] }))}
                >
                  {hasDetail && (
                    <span className="mt-0.5 flex-shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                    </span>
                  )}
                  <span className="log-time flex-shrink-0">[{log.timestamp}]</span>
                  {log.nodeLabel && <span className="log-node flex-shrink-0">[{log.nodeLabel}]</span>}
                  <span className={cn(
                    log.level === 'info' && 'text-foreground/80',
                    log.level === 'success' && 'log-success',
                    log.level === 'warning' && 'log-warning',
                    log.level === 'error' && 'log-error',
                  )}>
                    {log.message}
                  </span>
                </div>
                {hasDetail && isExpanded && (
                  <div className="ml-4 mt-0.5 mb-1 p-2 rounded bg-white/5 text-muted-foreground text-[10px] leading-relaxed whitespace-pre-wrap border-l-2 border-primary/30">
                    {log.detail}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
