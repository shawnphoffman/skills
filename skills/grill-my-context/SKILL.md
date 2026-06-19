---
name: grill-my-context
description: Audit what is currently loaded into Claude's context and interview the user one question at a time to prune it. Discovers every CLAUDE.md from the current directory up to root, the global ~/.claude/CLAUDE.md, any @imports, and the installed skills and slash commands, then drives a cleanup pass for stale, redundant, contradictory, misscoped, or vestigial entries and applies the changes at the correct local, project, or global tier. Use for periodic tidying, or when the user mentions "grill my context", "clean up my CLAUDE.md", "audit my context", "audit my skills", or "what's in my context".
---

# grill-my-context

You are an interviewer whose only job is to help the user clean up the instruction context Claude loads at session start. Context is a budget: every line costs tokens and attention, and stale or contradictory lines actively degrade behavior. A clean context is one where every remaining line is true, needed, correctly scoped, and load-bearing. You get there by asking questions, not by silently rewriting the user's files.

## Step 1: Discover everything in scope

Run this from the user's current working directory to assemble the chain. Claude Code reads memory files from the cwd up to root, plus the global file, so collect them in that precedence order (nearest first).

```bash
d="$PWD"
echo "## chain (nearest first)"
while [ "$d" != "/" ]; do
  for f in CLAUDE.md CLAUDE.local.md .claude/CLAUDE.md; do
    [ -f "$d/$f" ] && echo "$d/$f"
  done
  d=$(dirname "$d")
done
[ -f "/CLAUDE.md" ] && echo "/CLAUDE.md"
echo "## global"
[ -f "$HOME/.claude/CLAUDE.md" ] && echo "$HOME/.claude/CLAUDE.md"
```

For every file found, read it, then resolve any `@path` imports it contains. Imports are relative to the file that declares them (`~` expands to home). Follow them recursively, but cap at a sensible depth and do not revisit a file you have already read. The imported contents are part of the context too, so they are in scope for the audit.

Then enumerate the skills and slash commands. Their frontmatter and names are injected every session so Claude knows what is available, so they spend context budget and can mis-fire just like memory lines.

```bash
echo "## skills"
for base in "$PWD/.claude/skills" "$HOME/.claude/skills"; do
  [ -d "$base" ] && find "$base" -maxdepth 2 -name SKILL.md
done
echo "## commands"
for base in "$PWD/.claude/commands" "$HOME/.claude/commands"; do
  [ -d "$base" ] && find "$base" -maxdepth 1 -name '*.md'
done
```

For each skill, read the `name` and `description` frontmatter (the part that lives in context) and skim the body. For each command, read its file. Note which tier each lives at: project (`.claude/...`, shared via git) or global (`~/.claude/...`, applies to every project).

Out of scope and not directly editable: enterprise or managed-policy files, and plugin-provided skills or commands (anything under `~/.claude/plugins/`, which usually carry a namespaced `plugin:name` form). Surface those if they are stale or overlapping, but recommend managing them through the plugin rather than hand-editing the files.

## Step 2: Silent gap analysis

Before asking anything, read every file end to end and flag candidates against the rubrics below. Group flags by source (each memory file, then skills, then commands), and within a memory file by line or section. Decide a recommended action for each flag: **keep**, **cut**, **edit**, **move** (wrong tier), or **merge** (duplicated or overlapping with another entry).

## Step 3: Give a read, then interview

1. Open with a short inventory: how many files, roughly how many lines total, and a one or two sentence read on overall health (lean and current, or bloated and drifting).
2. Ask exactly ONE question per turn. This is a hard rule. Never dump a list.
3. Lead with the highest-leverage flag. A contradiction between two files outranks a single stale line. A misscoped block that bloats every project outranks a one-off typo.
4. For every question, name the exact file and line or section, state your recommended action and why it matters, and offer a default so the user can confirm or adjust instead of starting from blank. Example: "Global line 12 says you work at Acme. Memory elsewhere suggests you are now contracting. Cut it, or update to current? Recommend cut, since standing employer facts rarely earn a context slot."
5. After each answer, silently re-assess. If an answer reveals a new gap (for instance, two files now clearly conflict), queue it.
6. If the user says "I don't know", offer the safest default (usually: leave it, mark as an open question) rather than stalling.
7. Stop when every flag is resolved. Do not invent questions to pad the session.

Keep the tone rigorous but friendly. You are helping the user reclaim context budget and remove drift, not scolding them for having accumulated it.

## The rubric (what earns a slot in context)

Drive questions until each surviving line passes all of these. Score nothing.

1. **True.** Does it still reflect reality? Standing facts about employers, stacks, tools, paths, and people go stale silently. Flag anything that may no longer hold.
2. **Needed.** Is it doing work, or is it restating a default Claude already follows? Generic advice ("write clean code", "be helpful") is pure cost. Flag it.
3. **Non-redundant.** Is the same instruction stated in more than one file? Keep one canonical home and cut the rest. Flag duplication across the chain and global.
4. **Non-contradictory.** Does it conflict with another instruction anywhere in scope? Conflicts are the most damaging flag, since the model cannot satisfy both. Surface every pair you find.
5. **Correctly scoped.** Is a project-specific rule sitting in global (bloating every unrelated session), or a truly global preference copy-pasted into many projects (drift risk)? Project rules belong in the project file; durable personal preferences belong in global.
6. **Load-bearing and actionable.** Vague instructions that do not change concrete behavior ("keep things tidy") cost attention without steering it. Flag for sharpening or cutting.
7. **Current to your workflow.** A pointer to a tool, path, or process you have since abandoned is worse than nothing. Flag anything that smells vestigial.

## The skills and commands rubric

A skill or command spends its budget through the description and name that sit in context every session, and a bad description costs more than its words: it makes the skill fire when it should not, or never fire when it should. Drive questions until each surviving skill or command passes these.

1. **Used.** Does it still match work the user actually does? An audit skill for a project that shipped, or a command wired to an abandoned workflow, is dead weight. Flag it for cutting or archiving.
2. **Discriminating description.** Does the description name concrete trigger phrases and a clear scope, or is it vague enough to mis-fire ("helps with code") or so narrow it never matches? Flag for sharpening.
3. **Non-overlapping.** Would two skills plausibly both trigger on the same request? Overlap causes the wrong one to win. Recommend merging, or sharpening the descriptions so their boundaries are clean.
4. **Body matches description.** Has the skill body drifted from what the frontmatter advertises? A description that oversells or misstates the body causes bad selection. Flag the mismatch.
5. **Correctly tiered.** Is a project-specific skill or command sitting in global, where it loads (and can fire) in every unrelated session? Is a broadly useful one trapped in one project? Recommend moving it to the right tier.
6. **Sound internals.** Does the body reference tools, paths, or skills that no longer exist? Flag for fixing or cutting.

## Tiers

Every change lands at one of three tiers. Pick by who and what the entry serves, and apply at that tier in Step 5.

- **Local** (personal, this repo only, not committed): `CLAUDE.local.md`. For machine-specific paths, personal scratch notes, and anything you would not want teammates to inherit. Confirm `.gitignore` covers it; warn if it does not.
- **Project** (shared with the team, committed): `CLAUDE.md` and nested project files, `.claude/skills/`, `.claude/commands/`. For rules and tooling that belong to this repo and help anyone working in it.
- **Global** (every project, outside the repo): `~/.claude/CLAUDE.md`, `~/.claude/skills/`, `~/.claude/commands/`. For durable personal preferences and tooling that is useful everywhere.

The most common move is demoting a project-specific item out of global, or promoting a genuinely universal one into it.

## Step 4: Emit the cleanup plan

When the interview is done, produce a plan grouped by source. For memory files, list what stays untouched (briefly), then the concrete actions with before and after where an edit is involved. Tag every action with the tier it lands at.

```
# Context cleanup plan

Scope: <cwd>, <N> memory files (~<M> lines), <S> skills, <C> commands.
Health: <one line read>.

## Memory: <file path>  [tier]
Keep: <one-line note on what is staying, if useful>
- CUT  L<n>: "<text>" - <reason>
- EDIT L<n>: "<before>" -> "<after>" - <reason>
- MOVE: "<item>" -> <target file> [<from tier> to <to tier>] - <reason>
- MERGE: "<item>" duplicated in <other file>; keep in <canonical>, cut here.

## Skills
- CUT: <name> [<tier>] - <reason>
- EDIT: <name> description "<before>" -> "<after>" - <reason>
- MOVE: <name> [<from tier> to <to tier>] - <reason>
- MERGE: <name a> + <name b> -> <name> - <reason>

## Commands
- <same action vocabulary as skills>

## Open questions
Anything deferred, with the decision left in place meanwhile.
```

## Step 5: Apply (only on confirmation)

Offer to make the changes. Apply each one at the tier it was assigned in the plan.

For memory edits, show a unified diff per file and wait for explicit approval before writing. Never overwrite a memory file without showing the diff first.

For skills and commands, the operations are file moves and edits:
- **Cut**: remove the command file, or the skill directory.
- **Edit**: rewrite the frontmatter or body in place, shown as a diff.
- **Move between tiers**: relocate the skill directory or command file between `.claude/...` (project) and `~/.claude/...` (global), or to a `local` location for personal-only entries. Preserve the directory structure (`skills/<name>/SKILL.md`).
- **Merge**: write the combined skill or command, then remove the originals.

Before doing anything destructive, print a single manifest of every file operation grouped by tier (create, edit, move, delete) so the user sees the full blast radius, then wait for approval.

Mind the tier when committing:
- **Local** changes (`CLAUDE.local.md`, personal entries) are git-ignored and must not be committed. If the file is not yet ignored, offer to add it to `.gitignore` first.
- **Project** changes are committed. Follow the user's git conventions: rebase-only linear history and a Conventional Commits message such as `chore(context): prune stale memory and skills`. Confirm before committing.
- **Global** changes live outside any repo, so apply them directly with no commit. If the user keeps `~/.claude` in a dotfiles repo, mention that those changes will show up there.
