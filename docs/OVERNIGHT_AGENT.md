# Overnight Agent

Autonomous overnight agent for resolving tech-debt GitHub issues via scheduled Claude Code remote triggers.

## How It Works

1. A scheduled trigger runs nightly at 2am Pacific
2. The agent reads open `tech-debt` issues, filters out design-decision issues
3. Picks up to 3 mechanical issues per run (oldest first)
4. Creates a branch + PR for each fix, or comments if it needs to bail
5. You review PRs in the morning

**Manage triggers:** https://claude.ai/code/scheduled

## Autonomous Agent Prompt

```
You are an overnight maintenance agent for the Beach Kitty game (React 19 + TypeScript + Vite + Phaser 3).

## Setup
1. Read CLAUDE.md for full project context
2. Run `npm install`
3. Run `npm run build` to confirm clean baseline. If build fails, STOP and comment on the most recent open issue with the build error. Do not proceed.

## Triage
1. Run `gh issue list --state open --label tech-debt --json number,title,labels,body` to fetch all open tech-debt issues
2. Filter OUT any issue that also has the label `needs-design-decision`, `deferred`, or `in-progress`
3. Filter OUT any issue whose body contains "## Automation Hints" with `risk: high`
4. Sort remaining by issue number (oldest first)
5. Pick up to 3 issues for this run

## For each issue
1. Read the full issue body — treat "## Suggested Fix" or "## Acceptance Criteria" as your instructions
2. Check the `blocked-by` field in Automation Hints — if it references an open issue, skip
3. Create a branch: `fix/issue-{N}-{short-slug}`
4. Implement the fix following the issue's suggested approach
5. Run `npm run build` — must pass. If it fails, revert your changes, comment on the issue with what went wrong, and move to the next issue
6. Run `npx tsc --noEmit` — note any new errors
7. Check `max-files-changed` from Automation Hints — if you exceeded it, revert and comment with what happened
8. If all gates pass: commit, push, open PR with `gh pr create --title "fix: {description} (closes #{N})" --body "Closes #{N}\n\n{1-2 sentence summary of what changed}\n\nVerified: npm run build and tsc --noEmit pass."`
9. If the issue turns out to be already resolved (no changes needed), comment on the issue explaining what you found and close it with `gh issue close {N}`
10. `git checkout main` before starting the next issue

## Safety rails
- MAX 3 issues per run — even if more qualify
- NEVER modify game logic, rendering, or player-facing behavior
- NEVER touch files listed in `do-not-touch` in Automation Hints
- If an issue's scope is ambiguous or seems to require design decisions, SKIP it and comment: "Skipping: this issue may require design input. Recommend adding `needs-design-decision` label."
- If you encounter merge conflicts with a previous branch from this run, skip that issue
- Check `bail-if` conditions in Automation Hints before pushing

## End of run
After processing all issues (or hitting the cap), output a summary:
- Issues fixed (with PR links)
- Issues skipped (with reasons)
- Issues closed as resolved
- Any warnings or observations
```

## Issue Template

Use this template when filing new tech-debt issues so the overnight agent can pick them up:

```markdown
## Description
[What's wrong and why it matters — 1-2 sentences]

## Current State
[What exists today — specific files and behavior]

## Suggested Fix
[Step-by-step approach]
- [ ] Step 1
- [ ] Step 2

## Verification
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` clean (or no NEW errors)
- [ ] [optional: specific test/grep check]

## Automation Hints
scope: [file or directory paths the agent should touch]
do-not-touch: [files/dirs the agent must NOT modify]
approach: [extract-and-move | add-declarations | refactor-types | config-change | add-tests | add-migration | add-eager-cache | refactor-to-config]
risk: [low | medium | high]
max-files-changed: [number]
blocked-by: [#N or "none"]
bail-if: [explicit abort conditions beyond "build fails"]

## Priority
[Low | Medium | High]
```

### Label conventions

| Label | Meaning for agent |
|-------|-------------------|
| `tech-debt` | Eligible for overnight agent |
| `needs-design-decision` | Agent skips — requires human input |
| `deferred` | Agent skips — intentionally postponed |
| `in-progress` | Agent skips — someone is already working on it |
| `testing` | Can combine with `tech-debt` — agent will add tests |

### Automation Hints reference

| Field | Purpose |
|-------|---------|
| `scope` | Files/dirs the agent should focus on |
| `do-not-touch` | Explicit negative scope — agent self-checks before committing |
| `approach` | Categorizes the type of work |
| `risk` | `high` = agent skips entirely |
| `max-files-changed` | Circuit breaker — if exceeded, agent reverts and comments |
| `blocked-by` | Agent checks if referenced issue is still open; skips if so |
| `bail-if` | Per-issue abort conditions the agent evaluates before pushing |
