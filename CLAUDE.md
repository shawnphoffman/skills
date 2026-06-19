# CLAUDE.md

This repo is a Claude Code plugin that distributes agent skills.

## Layout

- `skills/<name>/SKILL.md` — one folder per skill. Skills auto-discover from
  `skills/`; there is no skill list to maintain in `plugin.json`.
- `.claude-plugin/marketplace.json` + `plugin.json` — distribution manifests.
- `scripts/` — `new-skill.mjs`, `validate-skills.mjs`, `link-skills.sh`,
  `list-skills.sh`.

## Adding a skill

1. `npm run new <name>` (or create `skills/<name>/SKILL.md` by hand).
2. Frontmatter requires `name` (kebab-case, must equal the folder name) and
   `description` (capability + concrete "use when" triggers).
3. `npm run validate` before committing.

## Rules

- Keep each skill focused on a single capability.
- The `description` is the only thing the agent sees when deciding whether to
  invoke a skill, so front-load triggers and keep it specific.
- Do not hand-maintain a skills array in `plugin.json` — rely on auto-discovery.
