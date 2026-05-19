# AgentFlow Designer

A visual drag-and-drop workflow designer for building AI agent pipelines. Built with React 19, TypeScript, Vite, Tailwind CSS, and React Flow (@xyflow/react).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Build & Deploy](#build--deploy)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Enterprise Readiness Checklist](#enterprise-readiness-checklist)
- [Known Limitations](#known-limitations)
- [Tech Stack](#tech-stack)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ (tested on v23.11.1) |
| npm | v9+ (tested on v10.9.2) |

> **Corporate network note:** A `.npmrc` is included that points npm to the internal Artifactory registry (`infyartifactory.jfrog.io`) with SSL verification disabled. Remove or replace `.npmrc` if installing from the public npm registry.

---

## Installation

```bash
# Navigate to the project folder
cd agentflow_designer_f8024fd0

# Standard install
npm install

# External / open-source (public npm registry — remove .npmrc first):
# rm .npmrc && npm install
```

---

## Running Locally

```bash
# Start the development server with hot-reload
npm run dev
```

App will be available at: **http://localhost:5173**

> If port 5173 is in use, Vite automatically tries the next available port (e.g. 5174). Check terminal output for the exact URL.

---

## Build & Deploy

### Production build
```bash
npm run build
```

Output is placed in the `dist/` folder as a **single self-contained `index.html`** file (via `vite-plugin-singlefile`). All JS, CSS, and assets are inlined — no separate asset files needed.

### Preview production build locally
```bash
npm run preview
```

### Type check only (no emit)
```bash
npm run typecheck
```

### Lint
```bash
npm run lint
```

### Deploying

Since the build output is a single `dist/index.html`, deploy by:

| Method | Steps |
|--------|-------|
| Static server (Nginx/Apache) | Copy `dist/index.html` to the web root |
| Azure Static Web Apps | Point build output to `dist/` |
| AWS S3 + CloudFront | Upload `dist/index.html`, set index document |
| SharePoint / internal portal | Embed or link `dist/index.html` directly |
| Docker | Serve `dist/index.html` via any Nginx container |

---

## Project Structure

```
agentflow_designer_f8024fd0/
├── public/                    # Static public assets
├── src/
│   ├── assets/                # Images, logos (SVG)
│   ├── components/
│   │   ├── flow/              # Core flow editor components
│   │   │   ├── FlowCanvas.tsx       # React Flow canvas (drag-and-drop)
│   │   │   ├── FlowNode.tsx         # Custom node renderer
│   │   │   ├── FlowManager.tsx      # Save/load/delete flow dialogs
│   │   │   ├── KeyboardShortcuts.tsx
│   │   │   ├── LogsPanel.tsx        # Execution log viewer
│   │   │   ├── NodeInspector.tsx    # Node config panel (right sidebar)
│   │   │   ├── NodeLibrary.tsx      # Node palette (left sidebar)
│   │   │   └── TopBar.tsx           # Header bar with all actions
│   │   └── ui/                # shadcn/ui component library (40+ components)
│   ├── data/
│   │   └── nodeDefinitions.ts # All available node types and their config fields
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── storeFactory.ts    # Zustand store factory wrapper
│   │   └── utils.ts           # cn() class merge utility (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── Designer.tsx       # Main designer page layout
│   │   └── Index.tsx          # Landing/entry page
│   ├── store/
│   │   ├── FlowContext.tsx    # Central state (useReducer + React Context)
│   │   ├── flowStore.ts       # Re-exports FlowProvider + useFlowStore
│   │   └── useFlowStore.ts    # useFlowStore hook
│   └── types/
│       └── flow.ts            # All TypeScript types and interfaces
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Configuration

### Environment Variables

Currently the app has no `.env` configuration. For enterprise use, create `.env.local` in the root:

```env
VITE_APP_TITLE=AgentFlow Designer
VITE_API_BASE_URL=https://your-backend-api.company.com
VITE_AUTH_PROVIDER=azure-ad
VITE_ENVIRONMENT=production
```

Access in code via `import.meta.env.VITE_APP_TITLE`. Variables must be prefixed with `VITE_` to be exposed to the browser.

### Vite Config (`vite.config.ts`)

| Setting | Value | Purpose |
|---------|-------|---------|
| `viteSingleFile` plugin | enabled | Produces one self-contained `index.html` |
| `assetsInlineLimit` | very high | Inlines all assets into the single HTML |
| `cssCodeSplit` | `false` | Single CSS bundle |
| `minify` | `esbuild` | Fast minification |

### Tailwind Theming (`src/index.css`)

All design tokens are CSS custom properties under `:root`. To retheme:

```css
:root {
  --primary: 195 100% 50%;      /* cyan accent */
  --accent: 262 83% 68%;        /* purple accent */
  --background: 222 20% 8%;     /* dark background */
  /* Node type colors */
  --node-llm: 195 100% 50%;
  --node-agent: 262 83% 68%;
  --node-tool: 142 70% 50%;
}
```

### Adding New Node Types (`src/data/nodeDefinitions.ts`)

1. Add the category to `NodeCategory` type in `src/types/flow.ts`
2. Add category metadata to `CATEGORY_META` in `nodeDefinitions.ts`
3. Add one or more node definitions to `NODE_DEFINITIONS` array

```typescript
{
  type: 'my_custom_node',
  category: 'tool',
  label: 'My Custom Node',
  description: 'Does something useful',
  icon: '🔧',
  color: 'hsl(142 70% 50%)',
  inputs: [{ id: 'in', label: 'Input', type: 'any' }],
  outputs: [{ id: 'out', label: 'Output', type: 'any' }],
  fields: [
    { id: 'endpoint', label: 'API Endpoint', type: 'text', required: true },
  ],
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current flow |
| `Ctrl + N` | New flow |
| `Ctrl + Enter` | Run / Stop execution |
| `Delete` | Delete selected node |
| `Shift + Click` | Multi-select nodes |
| `Scroll` | Zoom canvas in/out |
| `Click + Drag` (canvas) | Pan canvas |

---

## Enterprise Readiness Checklist

Items to address before production enterprise deployment:

### Security
- [ ] **Authentication** — Integrate SSO/OAuth2 (Azure AD, Okta, SAML). App currently has no auth layer.
- [ ] **Authorization** — Implement role-based access control (viewer / editor / admin) per flow
- [ ] **JSON import validation** — The flow import in TopBar has no schema validation. Add JSON schema validation (e.g. with `zod`) to reject malformed or malicious payloads
- [ ] **Content Security Policy** — Add CSP headers on the server hosting the built app
- [ ] **Corporate SSL** — Replace `--strict-ssl false` workaround by installing your corporate Root CA certificate into Node.js's trusted certificate store

### Stability & Error Handling
- [ ] **Error Boundaries** — Add React `ErrorBoundary` wrappers at page level and panel level to prevent full-app white screen crashes
- [ ] **Null safety** — `document.getElementById('root')!` in `main.tsx` should have a graceful fallback
- [ ] **Log size cap** — Execution logs are unbounded in memory. Add a maximum entries limit (e.g. 500 entries) to prevent memory exhaustion on long-running flows
- [ ] **File input validation** — Add MIME type + extension validation on JSON import, not just `.json` extension check

### State & Persistence
- [ ] **Backend persistence** — Flows are currently saved only to browser `localStorage`. For enterprise, sync to a REST API / database (PostgreSQL, MongoDB, Azure Cosmos DB)
- [ ] **Multi-user / collaboration** — No concurrent edit support. Consider WebSocket-based real-time collaboration (e.g. Liveblocks, PartyKit, or custom)
- [ ] **Export versioning** — Add `schemaVersion` field to exported flow JSON for forward/backward compatibility
- [ ] **Undo / Redo** — No undo history. Add command-pattern undo stack for node operations

### Performance
- [ ] **Code splitting** — Currently builds as a single ~2MB+ bundle. Split vendor / app chunks for teams serving via CDN
- [ ] **Node library virtualization** — NodeLibrary renders all nodes at once. Add virtual scrolling for large catalogs (react-virtual)
- [ ] **Self-hosted fonts** — App loads Google Fonts (JetBrains Mono, Syne) from the internet. Self-host for air-gapped / intranet environments

### Testing
- [ ] **Unit tests** — No test suite. Add Vitest + React Testing Library
- [ ] **E2E tests** — Add Playwright for critical paths: create flow → add nodes → connect → run → export
- [ ] **Type coverage** — Enable `strict: true` in tsconfig for stricter type checking

### Observability
- [ ] **Error tracking** — Integrate Sentry or Azure Application Insights for runtime error capture
- [ ] **Usage analytics** — Track which node types are used, flow run success/failure rates
- [ ] **Structured logging** — Replace `console.error` with a structured logger (e.g. `pino`)

### CI/CD
- [ ] **Pipeline** — Add GitHub Actions or Azure DevOps pipeline: `lint → typecheck → build → test → deploy`
- [ ] **Environment promotion** — Separate `dev`, `staging`, `production` build configs via `.env.development` / `.env.production`
- [ ] **`.env.example`** — Document required environment variables for new developers

### Accessibility (WCAG 2.1 AA)
- [ ] **ARIA labels** — Flow canvas nodes need `aria-label` and `role` attributes for screen readers
- [ ] **Focus management** — Keyboard focus should be trapped in modals (dialogs are using Radix which handles this, but verify canvas focus)
- [ ] **Color contrast** — Verify all text/background pairs meet 4.5:1 contrast ratio
- [ ] **Reduced motion** — Respect `prefers-reduced-motion` for node animations

---

## Known Limitations

| Area | Current State | Recommended Fix |
|------|--------------|----------------|
| Execution | Simulated (mock delays + fake outputs) | Connect to real agent execution backend API |
| Persistence | Browser `localStorage` only | Backend API + database |
| Authentication | None | Azure AD SSO / OAuth2 |
| Collaboration | Single user only | WebSocket real-time sync |
| Mobile | Desktop-optimized only | Responsive layout or dedicated mobile view |
| Fonts | Loaded from Google CDN | Self-host font files for intranet/air-gapped |
| Flow validation | None | Add graph validation before execution (cycle detection, required fields check) |

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7 | Build tool & dev server |
| @xyflow/react | 12 | Flow canvas — drag, drop, connect nodes |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | — | Accessible UI component library (Radix primitives) |
| React Router | 7 | Client-side routing |
| Lucide React | 0.554 | Icon library |
| Sonner | 2 | Toast notifications |
| React Hook Form | 7 | Form state management |
| Zod | 4 | Schema validation (available, not yet wired to import) |
| TanStack Query | 5 | Server state management (available, not yet used) |

---

## License

MIT License — Open source. See [LICENSE](LICENSE) for details.
