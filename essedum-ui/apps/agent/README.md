# @essedum/agent

> Path: `apps/agent/` (renamed from `agent-mfe/` 2026-05-22 when MFE folders moved under `apps/`).

Module 1 of the Essedum MFE platform. Owns: **AI Agent (Langflow embed), Agent Pipeline, Agent Directory**.

- Dev port: `8085`
- Mount path in host: `/agent/**`
- Federation name: `agent` — exposes `./Module` (the `EntryModule`)

## Routes (mounted at `/agent`)

| Path                              | Component                          |
|-----------------------------------|------------------------------------|
| `/agent` → redirect → `/agent/pipeline` | —                            |
| `/agent/studio`                   | `AgentComponent` (Langflow iframe) |
| `/agent/pipeline`                 | `AgentPipelineDashboardComponent`  |
| `/agent/pipeline/view/:cname`     | `AgentPipelineComponent`           |
| `/agent/directory`                | `AgentDirectoryComponent`          |
| `/agent/directory/view/:name`     | `AgentDirectoryViewComponent`      |
| `/agent/directory/edit/:name`     | `AgentDirectoryEditComponent`      |
| `/agent/directory/add`            | `AgentDirectoryEditComponent`      |
