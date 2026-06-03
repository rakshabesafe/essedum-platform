# AgentFlow Designer — Context

## Project
LangFlow-style visual agent flow designer (frontend-only SPA). Dark theme, production grade.

## Architecture
- State: React Context + useReducer (FlowContext.tsx / useFlowStore.ts)
- Canvas: @xyflow/react (ReactFlow)
- Routing: HashRouter, single route `/` → Designer page

## Pages
- `/` → Designer (full-screen canvas layout)

## Components (src/components/flow/)
- `FlowCanvas.tsx` — ReactFlow canvas with drag-drop, empty state
- `FlowNode.tsx` — Custom node card with ports, status indicator, output preview
- `TopBar.tsx` — Save, run, export/import, panel toggles, rename
- `NodeLibrary.tsx` — Searchable categorized left panel, draggable node cards
- `NodeInspector.tsx` — Right panel: field editor per selected node
- `LogsPanel.tsx` — Bottom panel: real-time execution logs with expand/collapse
- `FlowManager.tsx` — Dialog: list/load/delete/export saved flows
- `KeyboardShortcuts.tsx` — Ctrl+S, Ctrl+N, Ctrl+Enter

## Data (src/data/)
- `nodeDefinitions.ts` — 25+ node definitions across 9 categories (llm, tool, mcp, agent, memory, prompt, input, output, condition)
  - LLMs: OpenAI, Anthropic Claude, Google Gemini, Mistral, Ollama (local), Cohere, Groq, HuggingFace
  - Tools: Web Search, Calculator, Code Executor, HTTP Request, File Reader, Vector Search
  - MCP: MCP Server, MCP Filesystem, MCP GitHub
  - Agents: ReAct, Planner, Router
  - Memory: Buffer, Vector, Redis
  - Prompts: Template, Few-Shot, Chat
  - IO: Text Input, Text Output, Condition

## Store (src/store/)
- `FlowContext.tsx` — Provider + reducer + all actions
- `useFlowStore.ts` — Hook to consume context
- `flowStore.ts` — Re-export barrel

## Types (src/types/flow.ts)
- NodeDefinition, FlowNodeData, SavedFlow, LogEntry, ExecutionState

## Design System
- Dark theme: background 222 20% 8%, primary cyan 195 100% 50%, accent purple 262 83% 68%
- Fonts: Syne (display), JetBrains Mono (code)
- Node category colors as CSS vars: --node-llm through --node-condition

## Persistence
- Flows saved to localStorage key: `agentflow_saved_flows`
- Export/import as JSON files

## Execution
- Mock runner: topological sort → step through nodes with delays → dispatch status updates
- Logs panel auto-opens on run

## Known Limitations / TODOs
- No real LLM API calls (mock only)
- No real backend integration
- No undo/redo history
- No multi-selection drag
