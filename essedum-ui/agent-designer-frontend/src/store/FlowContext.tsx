import { createContext, useCallback, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { AgentFlowNode, FlowNodeData, SavedFlow, ExecutionState, LogEntry } from '../types/flow';

let _idCounter = 1;
const uid = (p = 'x') => `${p}_${Date.now()}_${_idCounter++}`;

// ─── State ────────────────────────────────────────────────────────────────────
interface State {
  nodes: AgentFlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  currentFlowId: string | null;
  currentFlowName: string;
  savedFlows: SavedFlow[];
  execution: ExecutionState;
  showNodeLibrary: boolean;
  showInspector: boolean;
  showLogs: boolean;
  showFlowManager: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
type Action =
  | { type: 'NODES_CHANGE'; changes: NodeChange[] }
  | { type: 'EDGES_CHANGE'; changes: EdgeChange[] }
  | { type: 'CONNECT'; connection: Connection }
  | { type: 'ADD_NODE'; node: AgentFlowNode }
  | { type: 'UPDATE_NODE_CONFIG'; nodeId: string; config: Record<string, unknown> }
  | { type: 'UPDATE_NODE_LABEL'; nodeId: string; label: string }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'DUPLICATE_NODE'; nodeId: string }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'UPDATE_NODE_STATUS'; nodeId: string; status: FlowNodeData['status']; output?: unknown }
  | { type: 'NEW_FLOW' }
  | { type: 'SAVE_FLOW'; flow: SavedFlow }
  | { type: 'LOAD_FLOW'; flow: SavedFlow }
  | { type: 'DELETE_FLOW'; flowId: string }
  | { type: 'RENAME_FLOW'; name: string }
  | { type: 'SET_CURRENT_FLOW_ID'; id: string }
  | { type: 'IMPORT_FLOW'; nodes: AgentFlowNode[]; edges: Edge[]; id: string; name: string }
  | { type: 'EXEC_START' }
  | { type: 'EXEC_STOP' }
  | { type: 'EXEC_COMPLETE' }
  | { type: 'EXEC_SET_CURRENT'; nodeId: string | undefined }
  | { type: 'EXEC_ADD_LOG'; log: LogEntry }
  | { type: 'EXEC_CLEAR_LOGS' }
  | { type: 'TOGGLE_LIBRARY' }
  | { type: 'TOGGLE_INSPECTOR' }
  | { type: 'TOGGLE_LOGS' }
  | { type: 'SET_SHOW_LOGS'; show: boolean }
  | { type: 'SET_FLOW_MANAGER'; show: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadFlows(): SavedFlow[] {
  try { return JSON.parse(localStorage.getItem('agentflow_saved_flows') || '[]'); } catch { return []; }
}
function persistFlows(flows: SavedFlow[]) {
  localStorage.setItem('agentflow_saved_flows', JSON.stringify(flows));
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NODES_CHANGE':
      return { ...state, nodes: applyNodeChanges(action.changes, state.nodes) as AgentFlowNode[] };
    case 'EDGES_CHANGE':
      return { ...state, edges: applyEdgeChanges(action.changes, state.edges) };
    case 'CONNECT':
      return { ...state, edges: addEdge({ ...action.connection, type: 'smoothstep' }, state.edges) };
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.node] };
    case 'UPDATE_NODE_CONFIG':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...action.config } } } : n
        ),
      };
    case 'UPDATE_NODE_LABEL':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, data: { ...n.data, label: action.label } } : n
        ),
      };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.nodeId),
        edges: state.edges.filter((e) => e.source !== action.nodeId && e.target !== action.nodeId),
        selectedNodeId: state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
      };
    case 'DUPLICATE_NODE': {
      const src = state.nodes.find((n) => n.id === action.nodeId);
      if (!src) return state;
      const clone: AgentFlowNode = {
        ...src,
        id: uid('node'),
        position: { x: src.position.x + 40, y: src.position.y + 40 },
        data: { ...src.data, label: `${src.data.label} (copy)`, config: { ...src.data.config }, status: 'idle' },
        selected: false,
      };
      return { ...state, nodes: [...state.nodes, clone] };
    }
    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.nodeId };
    case 'UPDATE_NODE_STATUS':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, data: { ...n.data, status: action.status, output: action.output } } : n
        ),
      };
    case 'NEW_FLOW':
      return { ...state, nodes: [], edges: [], selectedNodeId: null, currentFlowId: null, currentFlowName: 'Untitled Flow', execution: { status: 'idle', logs: [] } };
    case 'SAVE_FLOW': {
      const idx = state.savedFlows.findIndex((f) => f.id === action.flow.id);
      const flows = idx >= 0 ? state.savedFlows.map((f, i) => (i === idx ? action.flow : f)) : [...state.savedFlows, action.flow];
      persistFlows(flows);
      return { ...state, savedFlows: flows, currentFlowId: action.flow.id };
    }
    case 'LOAD_FLOW':
      return { ...state, nodes: action.flow.nodes as AgentFlowNode[], edges: action.flow.edges as Edge[], currentFlowId: action.flow.id, currentFlowName: action.flow.name, selectedNodeId: null, execution: { status: 'idle', logs: [] }, showFlowManager: false };
    case 'DELETE_FLOW': {
      const flows = state.savedFlows.filter((f) => f.id !== action.flowId);
      persistFlows(flows);
      return { ...state, savedFlows: flows, currentFlowId: state.currentFlowId === action.flowId ? null : state.currentFlowId };
    }
    case 'RENAME_FLOW':
      return { ...state, currentFlowName: action.name };
    case 'SET_CURRENT_FLOW_ID':
      return { ...state, currentFlowId: action.id };
    case 'IMPORT_FLOW':
      return { ...state, nodes: action.nodes, edges: action.edges, currentFlowId: action.id, currentFlowName: action.name, selectedNodeId: null, execution: { status: 'idle', logs: [] } };
    case 'EXEC_START':
      return {
        ...state,
        execution: { status: 'running', logs: state.execution.logs, startedAt: new Date().toISOString() },
        nodes: state.nodes.map((n) => ({ ...n, data: { ...n.data, status: 'idle' as const, output: undefined, error: undefined } })),
        showLogs: true,
      };
    case 'EXEC_STOP':
      return {
        ...state,
        execution: { ...state.execution, status: 'idle' },
        nodes: state.nodes.map((n) => ({ ...n, data: { ...n.data, status: n.data.status === 'running' ? 'skipped' as const : n.data.status } })),
      };
    case 'EXEC_COMPLETE':
      return { ...state, execution: { ...state.execution, status: 'completed', currentNodeId: undefined, completedAt: new Date().toISOString() } };
    case 'EXEC_SET_CURRENT':
      return { ...state, execution: { ...state.execution, currentNodeId: action.nodeId } };
    case 'EXEC_ADD_LOG':
      return { ...state, execution: { ...state.execution, logs: [...state.execution.logs, action.log] } };
    case 'EXEC_CLEAR_LOGS':
      return { ...state, execution: { ...state.execution, logs: [] } };
    case 'TOGGLE_LIBRARY':
      return { ...state, showNodeLibrary: !state.showNodeLibrary };
    case 'TOGGLE_INSPECTOR':
      return { ...state, showInspector: !state.showInspector };
    case 'TOGGLE_LOGS':
      return { ...state, showLogs: !state.showLogs };
    case 'SET_SHOW_LOGS':
      return { ...state, showLogs: action.show };
    case 'SET_FLOW_MANAGER':
      return { ...state, showFlowManager: action.show };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface ContextValue extends State {
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: AgentFlowNode) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  newFlow: () => void;
  saveFlow: () => void;
  loadFlow: (flowId: string) => void;
  deleteFlow: (flowId: string) => void;
  renameFlow: (name: string) => void;
  exportFlow: () => void;
  importFlow: (json: string) => void;
  runFlow: () => Promise<void>;
  stopExecution: () => void;
  clearLogs: () => void;
  toggleNodeLibrary: () => void;
  toggleInspector: () => void;
  toggleLogs: () => void;
  setShowFlowManager: (show: boolean) => void;
}

export const FlowContext = createContext<ContextValue | null>(null);

const initialState: State = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  currentFlowId: null,
  currentFlowName: 'Untitled Flow',
  savedFlows: loadFlows(),
  execution: { status: 'idle', logs: [] },
  showNodeLibrary: true,
  showInspector: true,
  showLogs: false,
  showFlowManager: false,
};

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // We use a ref to access latest state in async runFlow
  const stateRef = useRef(state);
  stateRef.current = state;

  const onNodesChange = useCallback((changes: NodeChange[]) => dispatch({ type: 'NODES_CHANGE', changes }), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => dispatch({ type: 'EDGES_CHANGE', changes }), []);
  const onConnect = useCallback((connection: Connection) => dispatch({ type: 'CONNECT', connection }), []);
  const addNode = useCallback((node: AgentFlowNode) => dispatch({ type: 'ADD_NODE', node }), []);
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => dispatch({ type: 'UPDATE_NODE_CONFIG', nodeId, config }), []);
  const updateNodeLabel = useCallback((nodeId: string, label: string) => dispatch({ type: 'UPDATE_NODE_LABEL', nodeId, label }), []);
  const deleteNode = useCallback((nodeId: string) => dispatch({ type: 'DELETE_NODE', nodeId }), []);
  const duplicateNode = useCallback((nodeId: string) => dispatch({ type: 'DUPLICATE_NODE', nodeId }), []);
  const selectNode = useCallback((nodeId: string | null) => dispatch({ type: 'SELECT_NODE', nodeId }), []);

  const newFlow = useCallback(() => dispatch({ type: 'NEW_FLOW' }), []);
  const renameFlow = useCallback((name: string) => dispatch({ type: 'RENAME_FLOW', name }), []);

  const saveFlow = useCallback(() => {
    const s = stateRef.current;
    const id = s.currentFlowId || uid('flow');
    const now = new Date().toISOString();
    const flow: SavedFlow = {
      id, name: s.currentFlowName, nodes: s.nodes, edges: s.edges,
      createdAt: s.savedFlows.find((f) => f.id === id)?.createdAt || now,
      updatedAt: now,
    };
    dispatch({ type: 'SAVE_FLOW', flow });
  }, []);

  const loadFlow = useCallback((flowId: string) => {
    const flow = stateRef.current.savedFlows.find((f) => f.id === flowId);
    if (flow) dispatch({ type: 'LOAD_FLOW', flow });
  }, []);

  const deleteFlow = useCallback((flowId: string) => dispatch({ type: 'DELETE_FLOW', flowId }), []);

  const exportFlow = useCallback(() => {
    const s = stateRef.current;
    const flow: SavedFlow = {
      id: s.currentFlowId || uid('flow'), name: s.currentFlowName,
      nodes: s.nodes, edges: s.edges,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${s.currentFlowName.replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importFlow = useCallback((json: string) => {
    try {
      const flow: SavedFlow = JSON.parse(json);
      dispatch({ type: 'IMPORT_FLOW', nodes: (flow.nodes || []) as AgentFlowNode[], edges: (flow.edges || []) as Edge[], id: flow.id || uid('flow'), name: flow.name || 'Imported Flow' });
    } catch (e) { console.error('Import failed', e); }
  }, []);

  const runFlow = useCallback(async () => {
    const s = stateRef.current;
    if (s.nodes.length === 0) return;

    const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
      dispatch({ type: 'EXEC_ADD_LOG', log: { ...log, id: uid('log'), timestamp: new Date().toLocaleTimeString() } });
    };

    dispatch({ type: 'EXEC_START' });
    addLog({ level: 'info', message: '▶  Flow execution started' });

    // Topological sort
    const { nodes, edges } = stateRef.current;
    const inDeg: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach((n) => { inDeg[n.id] = 0; adj[n.id] = []; });
    edges.forEach((e) => { adj[e.source].push(e.target); inDeg[e.target] = (inDeg[e.target] || 0) + 1; });
    const queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
    const order: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      order.push(id);
      (adj[id] || []).forEach((nxt) => { inDeg[nxt]--; if (inDeg[nxt] === 0) queue.push(nxt); });
    }

    for (const nodeId of order) {
      if (stateRef.current.execution.status !== 'running') break;
      const node = stateRef.current.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      dispatch({ type: 'EXEC_SET_CURRENT', nodeId });
      dispatch({ type: 'UPDATE_NODE_STATUS', nodeId, status: 'running' });
      addLog({ level: 'info', nodeId, nodeLabel: node.data.label, message: `  Executing: ${node.data.label} (${node.data.definition.type})` });

      const delays: Record<string, number> = { llm: 1400, agent: 2000, tool: 600, mcp: 800, memory: 500, prompt: 300, input: 200, output: 200, condition: 250 };
      await new Promise((r) => setTimeout(r, (delays[node.data.definition.category] || 500) + Math.random() * 400));

      if (stateRef.current.execution.status !== 'running') break;

      const mockOutputs: Record<string, string> = {
        llm: `[${node.data.label}] Generated a detailed, context-aware response. The model analyzed the prompt thoroughly and produced well-reasoned output following the system instructions.`,
        tool: `[${node.data.label}] Tool executed successfully.\n{"status":"success","data":[{"id":1,"result":"Item A"},{"id":2,"result":"Item B"}],"count":2}`,
        agent: `[${node.data.label}] Agent completed in 3 reasoning steps:\n  Step 1: Analyzed task requirements\n  Step 2: Invoked search tool → 5 results retrieved\n  Step 3: Synthesized final answer from tool outputs`,
        memory: `[${node.data.label}] Memory operation complete. Stored 1 new entry. Retrieved 3 relevant memories (similarity > 0.82).`,
        prompt: `[${node.data.label}] Rendered prompt:\n"You are an expert AI assistant. The user has asked: What are the key principles of agent design?"`,
        mcp: `[${node.data.label}] MCP server connected.\nAvailable tools: read_file, write_file, list_directory, execute_command, get_env\nSelected tool: read_file → executed successfully`,
        input: String(node.data.config?.input_text || 'Hello, please help me with my task.'),
        output: 'Flow output captured and rendered to display.',
        condition: 'Condition evaluated → TRUE\nRouting execution to: true branch',
      };

      const output = mockOutputs[node.data.definition.category] || 'Execution completed.';
      dispatch({ type: 'UPDATE_NODE_STATUS', nodeId, status: 'success', output });
      addLog({ level: 'success', nodeId, nodeLabel: node.data.label, message: `  ✓ ${node.data.label} completed`, detail: output });
    }

    if (stateRef.current.execution.status === 'running') {
      dispatch({ type: 'EXEC_COMPLETE' });
      dispatch({ type: 'EXEC_ADD_LOG', log: { id: uid('log'), timestamp: new Date().toLocaleTimeString(), level: 'success', message: `✓ Flow completed — ${order.length} nodes executed` } });
    }
  }, []);

  const stopExecution = useCallback(() => dispatch({ type: 'EXEC_STOP' }), []);
  const clearLogs = useCallback(() => dispatch({ type: 'EXEC_CLEAR_LOGS' }), []);
  const toggleNodeLibrary = useCallback(() => dispatch({ type: 'TOGGLE_LIBRARY' }), []);
  const toggleInspector = useCallback(() => dispatch({ type: 'TOGGLE_INSPECTOR' }), []);
  const toggleLogs = useCallback(() => dispatch({ type: 'TOGGLE_LOGS' }), []);
  const setShowFlowManager = useCallback((show: boolean) => dispatch({ type: 'SET_FLOW_MANAGER', show }), []);

  return (
    <FlowContext.Provider value={{
      ...state,
      onNodesChange, onEdgesChange, onConnect,
      addNode, updateNodeConfig, updateNodeLabel,
      deleteNode, duplicateNode, selectNode,
      newFlow, saveFlow, loadFlow, deleteFlow, renameFlow, exportFlow, importFlow,
      runFlow, stopExecution, clearLogs,
      toggleNodeLibrary, toggleInspector, toggleLogs, setShowFlowManager,
    }}>
      {children}
    </FlowContext.Provider>
  );
}
