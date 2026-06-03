# AgentFlow Designer

AgentFlow Designer is a visual, drag-and-drop tool for building AI agent workflows. You connect nodes together on a canvas to design pipelines — no coding required to build and run flows.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **React Flow**.

---

## Table of Contents

- [What Does This App Do?](#what-does-this-app-do)
- [How the App Works (User Flow)](#how-the-app-works-user-flow)
- [App Structure](#app-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [Option A — Dev Server (recommended for development)](#option-a--dev-server-recommended-for-development)
  - [Option B — Docker (run without Node.js)](#option-b--docker-run-without-nodejs)
- [Environment Variables](#environment-variables)
- [Deploy to Kubernetes](#deploy-to-kubernetes)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tech Stack](#tech-stack)

---

## What Does This App Do?

AgentFlow Designer lets you:

- **Drag nodes** from a left-side panel onto the canvas (e.g. LLM, Tool, Agent, Input, Output nodes)
- **Connect nodes** by drawing edges between them to define data flow
- **Configure each node** using the right-side inspector panel (set prompts, API endpoints, model names, etc.)
- **Run the flow** and watch execution logs stream in real time at the bottom
- **Save and load flows** — stored in the browser's local storage
- **Export / import flows** as JSON files for sharing

---

## How the App Works (User Flow)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                         Top Bar                                 │
 │  [New Flow]  [Save]  [Load]  [Export JSON]  [Import JSON]  [Run]│
 └─────────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────┐    ┌───────────────────────────────┐    ┌────────────────┐
 │  Node Library│    │         Flow Canvas           │    │ Node Inspector │
 │  (Left side) │───▶│  Drag & drop nodes here       │───▶│ (Right side)   │
 │              │    │  Connect nodes with edges     │    │ Edit selected  │
 │  - LLM       │    │  Pan with mouse drag          │    │ node's config  │
 │  - Agent     │    │  Zoom with scroll wheel       │    │ fields         │
 │  - Tool      │    │                               │    │                │
 │  - Input     │    │                               │    │                │
 │  - Output    │    │                               │    │                │
 └──────────────┘    └───────────────────────────────┘    └────────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │      Logs Panel         │
                     │  (bottom of the screen) │
                     │  Live execution output  │
                     └─────────────────────────┘
```

**Typical workflow:**

1. Open the app in a browser
2. Drag an **Input** node onto the canvas → set your prompt or data
3. Drag an **LLM** node → configure the model name and system prompt
4. Drag an **Output** node → connect it to the LLM's output
5. Draw connections: Input → LLM → Output
6. Click **Run** (`Ctrl + Enter`) — watch the logs panel
7. Click **Save** (`Ctrl + S`) to keep the flow for later

---

## App Structure

```
agent-designer-frontend/
│
├── src/
│   ├── pages/
│   │   ├── Index.tsx              ← Landing / welcome page
│   │   └── Designer.tsx           ← Main page with all panels
│   │
│   ├── components/
│   │   ├── flow/
│   │   │   ├── TopBar.tsx         ← Header: save, load, run buttons
│   │   │   ├── NodeLibrary.tsx    ← Left panel: list of available nodes
│   │   │   ├── FlowCanvas.tsx     ← Centre: the drag-and-drop canvas
│   │   │   ├── FlowNode.tsx       ← How each node looks on the canvas
│   │   │   ├── NodeInspector.tsx  ← Right panel: edit selected node
│   │   │   ├── LogsPanel.tsx      ← Bottom: execution log viewer
│   │   │   ├── FlowManager.tsx    ← Save / load / delete flow dialogs
│   │   │   └── KeyboardShortcuts.tsx
│   │   └── ui/                    ← Reusable UI components (buttons, dialogs, etc.)
│   │
│   ├── data/
│   │   └── nodeDefinitions.ts     ← All node types, their icons, fields, connections
│   │
│   ├── store/
│   │   └── FlowContext.tsx        ← App-wide state (nodes, edges, logs, run status)
│   │
│   └── types/
│       └── flow.ts                ← TypeScript types for nodes, edges, fields
│
├── Dockerfile                     ← Container build (Node build → Nginx serve)
├── vite.config.ts                 ← Build config (outputs single index.html)
├── tailwind.config.js             ← Styling theme
├── package.json                   ← Dependencies and scripts
└── index.html                     ← App entry point
```

**Key concept:** The build produces a **single `dist/index.html`** file with all JavaScript and CSS inlined. This one file is the entire app — easy to share, host, or drop into any web server.

---

## Prerequisites

| Tool | Version | Why you need it |
|------|---------|-----------------|
| Node.js | v18 or higher | To run the dev server and build the app |
| npm | v9 or higher | To install packages |
| Docker | v20 or higher | To build and run as a container |
| kubectl | v1.25 or higher | To deploy to Kubernetes |

---

## Local Setup

### Option A — Dev Server (recommended for development)

This gives you live hot-reload as you edit code.

**1. Install dependencies**

```bash
cd agent-designer-frontend
npm install
```

**2. Create your local environment file from the example**

```bash
cp .env.example .env.local
```

Then open `.env.local` and set your values (see [Environment Variables](#environment-variables) for full details). At minimum, set:

```env
VITE_PORT=4000
VITE_API_BASE_URL=http://localhost:4545
```

> If you skip this step, the app uses the defaults: port `4000`, backend at `http://localhost:4545`.

**3. Start the app**

```bash
npm run dev
```

Open your browser at **http://localhost:4000**

> The port comes from `VITE_PORT` in your `.env.local`. Change it there if `4000` is already in use.

**Other useful commands:**

```bash
npm run build       # Create a production build in dist/
npm run preview     # Serve the production build locally to test it
npm run typecheck   # Check for TypeScript errors without building
npm run lint        # Check for code style issues
```

---

### Option B — Docker (run without Node.js)

Use this if you want to run the app as a container, or you don't have Node.js installed.

**1. Build the Docker image**

```bash
cd agent-designer-frontend
docker build -t agent-designer-frontend:latest .
```

What happens inside:
- Stage 1: Node.js installs packages and builds the app
- Stage 2: Nginx serves the built `index.html` on port 80

**2. Run the container**

```bash
docker run -d \
  --name agent-designer-frontend \
  -p 3000:80 \
  agent-designer-frontend:latest
```

Open your browser at **http://localhost:3000**

**3. Useful container commands**

```bash
# See live logs
docker logs -f agent-designer-frontend

# Stop the container
docker stop agent-designer-frontend

# Remove the container
docker rm agent-designer-frontend

# Rebuild and restart after changes
docker build -t agent-designer-frontend:latest . \
  && docker stop agent-designer-frontend \
  && docker rm agent-designer-frontend \
  && docker run -d --name agent-designer-frontend -p 3000:80 agent-designer-frontend:latest
```

---

## Environment Variables

The `.env.example` file in the project root contains every supported variable with descriptions and defaults. Use it as the template:

```bash
cp .env.example .env.local   # create your local config (never commit this file)
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PORT` | `4000` | Port the dev server (`npm run dev`) listens on |
| `VITE_API_BASE_URL` | `http://localhost:4545` | Backend API base URL. All `/api/*` and `/health` calls are proxied here during dev |
| `VITE_LOGIN_IMAGE_URL` | _(popsy illustration)_ | Image displayed on the login page. Use an `https://` URL or a `/public/` path |
| `VITE_APP_TITLE` | `AgentFlow Designer` | Browser tab title |
| `VITE_ENVIRONMENT` | `development` | Environment label — `development`, `staging`, or `production` |

> All variables must start with `VITE_` to be exposed in the browser. Access them in code with `import.meta.env.VITE_VARIABLE_NAME`.

---

## Deploy to Kubernetes

### Overview

```
Developer Machine
      │
      ▼
 docker build          ← builds the image
      │
      ▼
 docker push           ← pushes to a container registry (e.g. Docker Hub, ACR, ECR)
      │
      ▼
 kubectl apply         ← tells Kubernetes to pull and run the image
      │
      ▼
 Kubernetes Cluster
 ┌──────────────────────────────────┐
 │  Namespace: essedum              │
 │  ┌───────────┐                   │
 │  │   Pod     │ ← runs the Nginx  │
 │  │ (Nginx)   │   container       │
 │  └─────┬─────┘                   │
 │        │                         │
 │  ┌─────▼─────┐                   │
 │  │  Service  │ ← internal access │
 │  └─────┬─────┘                   │
 │        │                         │
 │  ┌─────▼─────┐                   │
 │  │  Ingress  │ ← external URL    │
 │  └───────────┘                   │
 └──────────────────────────────────┘
```

---

### Step 1 — Build the production image

```bash
cd agent-designer-frontend
docker build -t agent-designer-frontend:latest .
```

---

### Step 2 — Push to your container registry

```bash
# Tag the image for your registry
docker tag agent-designer-frontend:latest <your-registry>/agent-designer-frontend:v1.0.0

# Push it
docker push <your-registry>/agent-designer-frontend:v1.0.0
```

Replace `<your-registry>` with your actual registry address (e.g. `myregistry.azurecr.io`, `docker.io/myusername`).

---

### Step 3 — Make sure the Kubernetes namespace exists

```bash
kubectl create namespace essedum --dry-run=client -o yaml | kubectl apply -f -
```

---

### Step 4 — Apply the Kubernetes manifests

The manifest files are in `essedum-platform/k8s/frontend/`:

```bash
kubectl apply -f essedum-platform/k8s/frontend/deployment.yaml
kubectl apply -f essedum-platform/k8s/frontend/service.yaml
kubectl apply -f essedum-platform/k8s/frontend/ingress.yaml
```

> Before applying, open `deployment.yaml` and update the `image:` field to point to the image you pushed in Step 2.

---

### Step 5 — Check that everything is running

```bash
# Are the pods running?
kubectl get pods -n essedum -l app=frontend

# See pod logs
kubectl logs -n essedum -l app=frontend --tail=50

# Is the service created?
kubectl get svc -n essedum

# What is the ingress address?
kubectl get ingress -n essedum
```

Wait until the pod shows `Running` status. The ingress will show an `ADDRESS` once the load balancer is ready.

---

### Step 6 — Open the app

Once the ingress has an address, open it in your browser:

```
http://<INGRESS-ADDRESS>
```

For local testing with a custom hostname, add a line to your `/etc/hosts` file:

```
<INGRESS-ADDRESS>   agent-designer.yourdomain.com
```

Then open `http://agent-designer.yourdomain.com`.

---

### Step 7 — Deploy a new version

```bash
# 1. Build and push the new image
docker build -t <your-registry>/agent-designer-frontend:v1.0.1 .
docker push <your-registry>/agent-designer-frontend:v1.0.1

# 2. Update the running deployment
kubectl set image deployment/frontend \
  frontend=<your-registry>/agent-designer-frontend:v1.0.1 \
  -n essedum

# 3. Watch the rollout complete
kubectl rollout status deployment/frontend -n essedum

# 4. Roll back if something goes wrong
kubectl rollout undo deployment/frontend -n essedum
```

---

### Tear down

```bash
kubectl delete -f essedum-platform/k8s/frontend/ingress.yaml
kubectl delete -f essedum-platform/k8s/frontend/service.yaml
kubectl delete -f essedum-platform/k8s/frontend/deployment.yaml
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current flow |
| `Ctrl + N` | New flow |
| `Ctrl + Enter` | Run / Stop execution |
| `Delete` | Delete selected node |
| `Shift + Click` | Select multiple nodes |
| `Scroll` | Zoom in / out |
| `Click + Drag` on canvas | Pan the canvas |

---

## Tech Stack

| Library | Version | What it does |
|---------|---------|--------------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type-safe JavaScript |
| Vite | 7 | Fast build tool and dev server |
| @xyflow/react | 12 | The drag-and-drop flow canvas |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | — | Pre-built accessible UI components |
| React Router | 7 | Page navigation |
| Lucide React | 0.554 | Icons |
| Sonner | 2 | Toast / notification messages |
| React Hook Form | 7 | Form handling |
| Zod | 4 | Data validation |
| TanStack Query | 5 | Server data fetching (ready to use) |

---

## License

MIT License — see [LICENSE](LICENSE) for details.
