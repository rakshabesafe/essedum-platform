# GitHub Actions Workflows – Setup & Reference Guide

This document explains every workflow in this folder, how to configure the required
runner, branches, secrets, and environments, and how each workflow is triggered.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Branch Strategy](#branch-strategy)
3. [Self-Hosted Runner Setup](#self-hosted-runner-setup)
4. [Required Secrets](#required-secrets)
5. [Required Environments](#required-environments)
6. [Workflow Details](#workflow-details)
   - [ci-k8s.yml – CI Build & Test](#ci-k8syml--ci-build--test)
   - [cd-deploy-k8s.yml – CD Deploy](#cd-deploy-k8syml--cd-deploy)
   - [cd-rollback-k8s.yml – CD Rollback](#cd-rollback-k8syml--cd-rollback)
   - [manual-code-analysis.yml – Claude Commit Analysis](#manual-code-analysisyml--claude-commit-analysis)
7. [End-to-End Flow Diagram](#end-to-end-flow-diagram)
8. [Troubleshooting](#troubleshooting)

---

## Workflow Overview

| File | Purpose | Trigger |
|---|---|---|
| `ci-k8s.yml` | Build, lint, test all services; call CD on success | Push to `gh_actions`, PR to `essedum-lfn-v13.0` |
| `cd-deploy-k8s.yml` | Apply Kubernetes manifests; roll out changed services | Called by CI (`workflow_call`) or manual (`workflow_dispatch`) |
| `cd-rollback-k8s.yml` | Roll back the cluster to a previous commit SHA | Manual (`workflow_dispatch`) |
| `manual-code-analysis.yml` | AI-assisted commit summary or security review via Claude | Manual (`workflow_dispatch`) |

---

## Branch Strategy

```
essedum-lfn-v13.0   ← protected main branch; receives PRs
        │
        └── merge via PR
                │
gh_actions        ← development / integration branch
                       CI triggers on every push here
                       CD deploys only from this branch
```

| Branch | Role |
|---|---|
| `gh_actions` | Active development branch. CI runs on every push. CD deploys from this branch after CI passes. |
| `essedum-lfn-v13.0` | Protected main/release branch. CI runs on every PR opened, synchronized, or reopened against it. |

> **Tip:** Protect `essedum-lfn-v13.0` in **Settings → Branches** with  
> *Require status checks to pass* and select the `ci-summary` check.

---

## Self-Hosted Runner Setup

All Kubernetes workflows (`ci-k8s`, `cd-deploy-k8s`, `cd-rollback-k8s`) require a
self-hosted runner labeled `essedum-runner` that has direct access to the cluster.

### Step 1 – Register the runner

1. Go to **Repository → Settings → Actions → Runners → New self-hosted runner**.
2. Follow the on-screen download/config commands for your OS (Linux recommended).
3. When prompted for **labels**, add: `self-hosted,essedum-runner`

```bash
# Example registration (replace TOKEN with the value shown in GitHub UI)
./config.sh \
  --url https://github.com/<org>/<repo> \
  --token <TOKEN> \
  --labels "self-hosted,essedum-runner" \
  --name  "essedum-k8s-runner" \
  --unattended
```

### Step 2 – Install required tooling on the runner host

```bash
# Docker (for image builds)
sudo apt-get update && sudo apt-get install -y docker.io
sudo usermod -aG docker $USER   # allow runner user to run docker

# kubectl (adjust version as needed)
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Snap-based tools expected by workflows
sudo snap install kubectl --classic   # alternative via snap

# Verify
kubectl version --client
docker --version
```

### Step 3 – Kubeconfig

The runner must have a valid `KUBECONFIG` pointing to the target cluster.

```bash
# Option A – file on disk
mkdir -p ~/.kube
cp /path/to/cluster-kubeconfig ~/.kube/config
export KUBECONFIG=~/.kube/config   # add to ~/.bashrc or runner service env

# Option B – set KUBECONFIG in the runner's service environment file
# (path varies; on systemd: /etc/systemd/system/actions.runner.*.service)
```

> The workflows verify `KUBECONFIG` at runtime and will fail fast with a clear error
> message if it is missing.

### Step 4 – Start the runner as a service

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status   # should show "active (running)"
```

---

## Required Secrets

Configure these in **Repository → Settings → Secrets and variables → Actions**.

| Secret | Used by | Description |
|---|---|---|
| `CONTAINER_REGISTRY` | `ci-k8s`, `cd-deploy-k8s`, `cd-rollback-k8s` | Hostname of the container registry (e.g. `myregistry.azurecr.io`) |
| `REGISTRY_USERNAME` | `ci-k8s`, `cd-deploy-k8s`, `cd-rollback-k8s` | Registry login username |
| `REGISTRY_PASSWORD` | `ci-k8s`, `cd-deploy-k8s`, `cd-rollback-k8s` | Registry login password or token |
| `K8S_NAMESPACE` | `cd-deploy-k8s`, `cd-rollback-k8s` | *(Optional)* Target Kubernetes namespace. Defaults to `essedum` |
| `ANTHROPIC_API_KEY` | `manual-code-analysis` | Anthropic API key for Claude commit analysis |

> **Security note:** Secrets are never printed to logs. Workflow inputs that could
> contain user-controlled data are always passed via environment variables, not
> inline shell expansions, to prevent script injection.

---

## Required Environments

| Environment name | Used by | Purpose |
|---|---|---|
| `CONTAINER_REGISTRY` | `cd-deploy-k8s` | Adds a mandatory human approval gate before any image is pushed or Kubernetes manifests are applied |
| `production` | `cd-rollback-k8s` | Adds a mandatory human approval gate before a rollback is executed |

Create environments in **Repository → Settings → Environments**:

1. Click **New environment**, name it exactly as shown in the table above.
2. Enable **Required reviewers** and add the appropriate team or individuals.
3. Optionally restrict to the `gh_actions` branch for `CONTAINER_REGISTRY`.

---

## Workflow Details

### `ci-k8s.yml` – CI Build & Test

**Trigger:**
- Push to `gh_actions` (excluding `*.md`, `.gitignore`, `LICENSE`, `docker/**`)
- Pull request opened/synchronized/reopened against `essedum-lfn-v13.0`

**Runner:** `[self-hosted, essedum-runner]`

**What it does (in order):**

| Job | Description |
|---|---|
| `detect-changes` | Uses `dorny/paths-filter` to detect which service paths changed. Every downstream job reads these outputs and skips itself if nothing it owns changed. |
| Per-service build jobs | Build and push Docker images only for changed services (`sv`, `essedum-ui`, `py-job-*`, `proxy-service`, `adk-code-builder-deployer`, `vibe-code-builder-deployer`, `langflow`, `lite-llm`, `langfuse`). |
| `ci-summary` | Gate job — fails if any build job failed; required status check for PRs to `essedum-lfn-v13.0`. |
| `call-cd` | On push to `gh_actions` only: calls `cd-deploy-k8s.yml` via `workflow_call`, forwarding the image tag and `changed_*` flags. |

**Concurrency:** One run per branch; in-flight runs for the same branch are cancelled.

---

### `cd-deploy-k8s.yml` – CD Deploy

**Trigger:**
- `workflow_call` — invoked automatically by `ci-k8s.yml` after CI passes on `gh_actions`
- `workflow_dispatch` — emergency manual deploy from the GitHub UI (requires repo write access)

**Runner:** `[self-hosted, essedum-runner]`

**Inputs (when called from CI):**

| Input | Description |
|---|---|
| `image_tag` | Commit SHA of images built by CI — ensures the exact same artifact is deployed |
| `changed_<service>` | Boolean flags forwarded from CI; CD skips services that did not change |

**What it does (in order):**

1. Checks out `gh_actions` branch.
2. Verifies `KUBECONFIG` and prints cluster context.
3. Applies ConfigMap from `k8s/config/app-config.yaml` if present.
4. Creates/updates the `registry-credentials` pull secret in the target namespace.
5. Applies Kubernetes manifests for each changed service.
6. Waits for rollouts (`kubectl rollout status`) to confirm success.
7. Cleans up Docker credentials from the runner on completion.

**Concurrency:** Only one deploy at a time; in-flight runs are **not** cancelled
(i.e. a new dispatch queues behind the running one).

---

### `cd-rollback-k8s.yml` – CD Rollback

**Trigger:** Manual only (`workflow_dispatch`)

**Runner:** `[self-hosted, essedum-runner]`

**Inputs:**

| Input | Required | Description |
|---|---|---|
| `ref` | Yes | Git commit SHA or branch to roll back to |
| `confirmation` | Yes | Must type the exact string `ROLLBACK` to proceed |

**What it does (in order):**

1. **Safety check** — verifies confirmation text equals `ROLLBACK`; exits immediately otherwise.
2. Checks out the specified `ref`.
3. Verifies `KUBECONFIG` and cluster connectivity.
4. Rebuilds images from the historical ref and pushes them.
5. Re-applies Kubernetes manifests from that ref.
6. Waits for rollouts to stabilise.

> **Environment gate:** The `production` environment requires human approval before
> any step after the safety check runs.

---

### `manual-code-analysis.yml` – Claude Commit Analysis

**Trigger:** Manual only (`workflow_dispatch`)

**Runner:** `ubuntu-latest` (GitHub-hosted)

**Inputs:**

| Input | Options | Description |
|---|---|---|
| `analysis_type` | `summarize-commit`, `security-review` | Type of analysis to run against the latest commit |

**What it does:**

- Checks out the repository (last 2 commits for diff context).
- Calls the `anthropics/claude-code-action` with a prompt tailored to the chosen analysis type.
- Posts the result as a PR/issue comment (requires `pull-requests: write` and `issues: write` permissions).

**Secrets required:** `ANTHROPIC_API_KEY`

---

## End-to-End Flow Diagram

```
Developer pushes to gh_actions
          │
          ▼
  ┌──────────────────┐
  │  ci-k8s.yml      │
  │  detect-changes  │
  └────────┬─────────┘
           │ only changed services
           ▼
  ┌──────────────────┐
  │  Build & Push    │  (per-service jobs, skipped if unchanged)
  │  Docker images   │
  └────────┬─────────┘
           │ all builds pass
           ▼
  ┌──────────────────┐
  │   ci-summary     │  ← required PR status check
  └────────┬─────────┘
           │ push to gh_actions only
           ▼
  ┌──────────────────────────────┐
  │  cd-deploy-k8s.yml           │
  │  (workflow_call)             │
  │  Human approval gate         │
  │  Apply k8s manifests         │
  │  kubectl rollout status      │
  └──────────────────────────────┘

Emergency rollback:
  GitHub UI → workflow_dispatch → cd-rollback-k8s.yml
  (requires typing ROLLBACK + human approval on production env)
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| All jobs show "queued" but never start | Runner offline or label mismatch | Confirm runner is active (`sudo ./svc.sh status`); verify label is `essedum-runner` |
| `KUBECONFIG not found` error | Env var not set on runner | Set `KUBECONFIG` in the runner's service environment and restart the service |
| `registry-credentials` secret apply fails | Wrong registry URL/credentials | Verify `CONTAINER_REGISTRY`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` secrets in GitHub |
| CD skips all services | All `changed_*` inputs are `false` | Trigger via `workflow_dispatch` which bypasses change detection, or push a real source change |
| Rollback confirmation fails | Input text is not exactly `ROLLBACK` | Re-trigger and type `ROLLBACK` (all caps, no spaces) |
| Claude analysis step fails | Missing or expired API key | Rotate `ANTHROPIC_API_KEY` in repository secrets |
| CI cancels in-flight run unexpectedly | `concurrency: cancel-in-progress: true` | Expected behaviour — only the latest run per branch proceeds; prior runs are cancelled |
