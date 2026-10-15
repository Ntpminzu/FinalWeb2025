## Required project workflow

Project layout: Express/JavaScript lives in `backend/src/modules/<feature>/`, with routes, controllers, services, repositories, domain models, DTOs and input schemas owned by each feature. Shared infrastructure is in `backend/src/common/`; runtime configuration is in `backend/src/config/`. Controller → Service → Repository → PostgreSQL remains required. React/Vite lives in `client/src/features/`; HTTP/JWT is shared in `client/src/lib/http.js`. Run root `npm test` for backend and client unit/integration tests, `npm run build` for React, and `npm run test:e2e` for browser flows using disposable PostgreSQL (requires a current build and Chromium). Root `npm run dev` starts both apps; `npm run dev:demo` never connects to Supabase. See `docs/frontend.md`. Run Graphify commands from repository root. API contracts remain in root `docs/`. Supabase migrations are a separate deployment action; frontend implementation does not authorize running pending migrations on the live database.

For each coding task in FinalWeb2025, read and apply [.agents/skills/graphify-ponytail/SKILL.md](.agents/skills/graphify-ponytail/SKILL.md). Ask the user to clarify the task and wait for their answer before editing, unless the current task was already clarified or the user explicitly says to proceed without questions. Query Graphify before browsing source, apply [.agents/skills/ponytail/SKILL.md](.agents/skills/ponytail/SKILL.md) while coding, and run `graphify update .` after the final code changes and checks. This is an agent workflow, not a background file watcher. Skip this workflow for greetings and unrelated text tasks.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
