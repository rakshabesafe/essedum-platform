import { useCallback, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  BackgroundVariant, useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { NodeTypes, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '../../store/flowStore';
import type { AgentFlowNode, FlowNodeData, NodeDefinition } from '../../types/flow';
import { FlowNode } from './FlowNode';
import { CATEGORY_META } from '../../data/nodeDefinitions';

const nodeTypes: NodeTypes = { agentNode: FlowNode };

let dropCounter = 0;

function Canvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, selectNode,
  } = useFlowStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/agentflow-node');
    if (!raw) return;

    try {
      const def: NodeDefinition = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Build default config
      const config: Record<string, unknown> = {};
      def.fields.forEach((f) => { if (f.default !== undefined) config[f.id] = f.default; });

      const id = `node_${Date.now()}_${dropCounter++}`;
      const newNode: AgentFlowNode = {
        id,
        type: 'agentNode',
        position,
        data: {
          definition: def,
          label: def.label,
          config,
          status: 'idle',
        },
      };
      addNode(newNode);
      selectNode(id);
    } catch (err) {
      console.error('Drop failed', err);
    }
  }, [screenToFlowPosition, addNode, selectNode]);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const data = node.data as unknown as FlowNodeData;
            return CATEGORY_META[data?.definition?.category]?.color || 'hsl(220 15% 35%)';
          }}
          maskColor="hsl(222 20% 8% / 0.7)"
          style={{ width: 140, height: 80 }}
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-3 animate-fade-in">
            <div className="text-5xl">⚡</div>
            <h3 className="text-lg font-semibold text-foreground">Start Building Your Flow</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Drag nodes from the left panel onto this canvas,<br />
              then connect them to build your agent workflow
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {['🤖 LLMs', '🔍 Tools', '🔌 MCP', '🧠 Agents', '💾 Memory', '📝 Prompts'].map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full bg-muted border border-border text-[11px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
