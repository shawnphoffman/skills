---
name: land-branch
description: Rebase a branch on local main, reauthor every commit to the repo's configured git identity, strip Claude Code session info from messages, fix Conventional Commits formatting, then land it on main. Use when the user names a branch and asks to clean it up, rebase it, reauthor commits, remove Claude/session info from commit messages, or land/merge a Claude Code session branch into main.
---

# land-branch

Clean up a (usually `claude/*`) session branch and land it on `main`. The user gives a branch name; you do the rest with two approval gates.

## Context

- **Author identity** comes from the repo's configured git identity. Resolve it once up front:
  ```
  git config user.name && git config user.email
  ```
  Reauthor every rewritten commit to `"<name> <email>"`. If either is unset, stop and ask the user which identity to use.
- **Signing**: preserve the user's setup. If they sign commits (`git config commit.gpgsign` is true, or they ask for it), keep signing every rewritten commit with `-S`. Never bypass signing with `--no-gpg-sign`.
- No `Co-Authored-By` trailers unless the user wants them.
- **Commit format**: Conventional Commits. `<type>(<scope>): <subject>`, imperative mood, no trailing period, subject ≤72 chars. Also honor any additional commit conventions the repo already documents (CONTRIBUTING, `CLAUDE.md`/`AGENTS.md`, commitlint config).
- "Rebase on **local** main" means use local `main` as-is. Do NOT pull/fetch unless the user asks.
- In a monorepo whose root is not itself a git repo but whose subdirectories each are (each defaulting to `main`), locate the right subrepo first (see step 1).

## Workflow

### 1. Locate the repo
If cwd is a git repo with the branch, use it. Otherwise find it (check local heads AND remotes - a Claude session branch often exists only on `origin`):
```
for d in */; do git -C "$d" for-each-ref --format='%(refname)' | grep -iq "<branch>" && echo "$d"; done
```
`cd` into that subrepo (use absolute paths; cwd persists between Bash calls so don't re-`cd`). If the branch exists only as `origin/<branch>` with no local head, that's fine - work from the remote ref (the cherry-pick loop reads `main..origin/<branch>`). If not found anywhere, stop and ask.

### 2. Safety checks
- `git status --porcelain` must be empty. If dirty, stop and report.
- Record the original branch tip for recovery: `git rev-parse <branch>` (mention this SHA to the user so they can `git reset --hard` if needed).
- Confirm `main` exists.

### 3. Gather commits
Read every commit on `main..<branch>`, oldest first, with full bodies and authors:
```
git log --reverse --format='%H%n%an <%ae>%n%B%n==END==' main..<branch>
```
If `main..<branch>` is empty, the branch is already merged/behind: stop and report.

### 4. Build the plan (GATE 1 - wait for approval)
For each commit, propose:
- **Author** → the configured git identity (`<name> <email>` resolved above).
- **Cleaned message**. Strip: Claude Code session URLs (e.g. `https://claude.ai/code/...`, `claude.com/...`), `Co-Authored-By: Claude ...` trailers, `🤖 Generated with Claude Code` footers, and stray session/run IDs or branch-suffix hashes that leaked into the body.
- **Format fixes**: enforce Conventional Commits (type/scope/imperative/≤72/no trailing period) and match the repo's documented commit style.

Present a before→after for each commit (subject + author, plus body changes). Wait for explicit approval before touching history.

### 5. Rewrite + rebase via cherry-pick loop
This rebases onto `main`, reauthors, and rewrites messages in one pass:
```
git checkout -B land-tmp main
# for each commit SHA in order (read from main..origin/<branch> or main..<branch>):
git cherry-pick <sha>
git commit --amend [-S] \
  --author="<name> <email>" -F <tmp-msg-file>
```
- Include `-S` only if the user signs commits (see Context).
- Use `--author=` ONLY. Do NOT add `--reset-author` - the two are mutually exclusive and git errors out. `--author=` sets the author and keeps the original author date.
- Write each cleaned message to a temp file and pass with `-F` (safe for multiline; avoids shell-quoting bugs).
- **Respect the repo's own commit hooks.** If the repo runs hooks (e.g. husky + commitlint on `commit-msg`) that enforce `body-max-line-length` or header rules, keep body paragraphs hard-wrapped (~72-80 cols) so the hook passes, even if you'd otherwise prefer single-line paragraphs. If an amend fails the hook, read the error, fix the message, and retry - never bypass with `--no-verify`.
- On a cherry-pick conflict: stop, show the conflict, let the user resolve or abort (`git cherry-pick --abort` then `git checkout <branch> && git branch -D land-tmp`).
- Verify the result has no content drift: `git diff <branch> land-tmp` should be empty (rebase may legitimately differ; if so, explain why).
- Point the branch at the cleaned tip and drop the temp branch:
  `git branch -f <branch> land-tmp && git checkout <branch> && git branch -D land-tmp`

### 6. Land on main
```
git checkout main && git merge --ff-only <branch>
```
If `--ff-only` fails, local `main` moved; stop and ask before any non-ff merge.

### 7. Remote cleanup (GATE 2 - prompt)
Ask: "Push local main to origin main?"
- If yes: `git push origin main`.
- Then delete the now-unneeded session branch (it lived as a Claude Code remote branch):
  `git push origin --delete <branch>` (ignore if no such remote branch) and `git branch -d <branch>` locally.
- If no: leave everything local; report final state and the original-tip SHA.

## Report
Summarize: repo, # commits rewritten, new main SHA, what was pushed/deleted, and the original branch tip SHA for recovery.
