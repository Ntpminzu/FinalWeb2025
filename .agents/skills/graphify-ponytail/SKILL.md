---
name: graphify-ponytail
description: Clarify the requested change before editing FinalWeb2025, use Graphify to locate relevant code, apply Ponytail while coding, and refresh the graph after changes. Use for features, fixes, refactors, and codebase investigations in this repository.
---

# Graphify and Ponytail workflow

Apply only inside FinalWeb2025. Greetings and unrelated text questions do not activate this workflow.

## Clarify before editing

- Before starting a new coding task, ask the user in Vietnamese to clarify the intended behavior, scope, or acceptance criteria. Use a concise question with a recommended default when helpful. Even for an apparently complete request, briefly confirm your understanding before editing.
- Wait for the user's answer before changing code. Read-only discovery may continue while waiting, using the graph first.
- Treat an answer already given for the current task as clarification; do not ask again for each file, tool call, or continuation. A later instruction to proceed also satisfies the gate. Explicit later instructions to skip questions take precedence.
- For explanation-only requests, ask only when needed to understand the question; do not edit code without authorization.

## Read the graph first

- Before browsing source, run `graphify query "<specific symbol or feature>" --budget 1500` from the repository root. Use `graphify explain "<symbol>"` or `graphify path "<A>" "<B>"` to trace relationships as needed.
- Open the returned files and relevant callers to verify the actual behavior. The graph is a navigation aid, not proof of source behavior or runtime correctness.
- Avoid loading the whole codebase or the entire graph JSON/report into context. Narrow queries and read only the code needed for the task; expand when the observed flow requires it.
- Graphify may omit `.handlebars`, SQL, and other unsupported files. Inspect those directly with targeted searches when the task touches them. Use targeted `rg` if a query misses a known symbol.
- If the graph is missing or stale, try `graphify update .`. If the CLI fails or is unavailable, report the limitation and continue focused source inspection; do not silently claim graph coverage.

## Apply Ponytail to every coding task

- Read and apply [Ponytail](../ponytail/SKILL.md) before editing code. The upstream source is https://github.com/DietrichGebert/ponytail/tree/main/skills/ponytail.
- Use its default full level unless the user chooses otherwise. Reuse existing project code and conventions, choose the smallest complete change, and avoid speculative abstractions or dependencies.
- Use graph results to find affected callers, then verify them in source. Preserve validation, error handling, security, and accessibility. Run checks appropriate to the actual change.
- If the local Ponytail skill is missing or unreadable, disclose that dependency failure and resolve it before claiming Ponytail was applied.

## Refresh after the final change

- After the final code edit and appropriate checks, run `graphify update .` without waiting for the user to request it. If later fixes change code, refresh again after those fixes.
- This is an agent workflow requirement, not a background watcher or Git hook. Do not claim that edits made outside the agent refresh automatically.
- Check the command result. Report a refresh failure explicitly and distinguish it from build/test results.
- End with the change made, checks actually run, graph refresh status, and any material unchecked behavior. Do not invent test or runtime evidence.
