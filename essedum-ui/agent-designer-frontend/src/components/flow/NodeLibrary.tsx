import { useState } from 'react';
import { NODE_DEFINITIONS, CATEGORY_META } from '../../data/nodeDefinitions';
import type { NodeDefinition } from '../../types/flow';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Search, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LABELS } from '../../lib/labels';

const CATEGORIES = ['input', 'output', 'llm', 'tool', 'mcp', 'agent', 'memory', 'prompt', 'condition'] as const;

interface DraggableNodeCardProps {
  def: NodeDefinition;
}

function DraggableNodeCard({ def }: DraggableNodeCardProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/agentflow-node', JSON.stringify(def));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-transparent',
        'cursor-grab active:cursor-grabbing',
        'hover:bg-muted/70 hover:border-border/60 transition-all duration-150',
      )}
    >
      <span className="text-base leading-none mt-0.5 flex-shrink-0">{def.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-foreground leading-tight">{def.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{def.description}</p>
      </div>
      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-60 flex-shrink-0 mt-0.5" />
    </div>
  );
}

export function NodeLibrary() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filtered = search.trim()
    ? NODE_DEFINITIONS.filter(
        (d) =>
          d.label.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase()) ||
          d.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : null;

  const groupedFiltered = filtered
    ? CATEGORIES.reduce((acc, cat) => {
        const nodes = filtered.filter((n) => n.category === cat);
        if (nodes.length) acc[cat] = nodes;
        return acc;
      }, {} as Record<string, NodeDefinition[]>)
    : null;

  return (
    <aside className="w-64 flex flex-col bg-card border-r border-border h-full animate-slide-in-left flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">{LABELS.LIBRARY_TITLE}</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={LABELS.LIBRARY_SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {CATEGORIES.map((cat) => {
            const nodes = groupedFiltered ? groupedFiltered[cat] || [] : NODE_DEFINITIONS.filter((d) => d.category === cat);
            if (!nodes.length) return null;
            const meta = CATEGORY_META[cat];
            const isCollapsed = collapsed[cat];

            return (
              <div key={cat} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(cat)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors group"
                >
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                    {meta.label}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-[9px] h-4 px-1.5 font-mono border-border"
                  >
                    {nodes.length}
                  </Badge>
                </button>

                {/* Nodes */}
                {!isCollapsed && (
                  <div className="px-1 pb-1">
                    {nodes.map((def) => (
                      <DraggableNodeCard key={def.type} def={def} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filtered && Object.keys(groupedFiltered || {}).length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">No nodes matching "{search}"</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Drag hint */}
      <div className="px-3 py-2 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          {LABELS.LIBRARY_DRAG_HINT}
        </p>
      </div>
    </aside>
  );
}
