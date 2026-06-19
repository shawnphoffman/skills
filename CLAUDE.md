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

## Commit conventions

Releases are automated by release-please, which only bumps the version on
`feat:`, `fix:`, and breaking-change commits. A skill's `SKILL.md` and its
bundled files **are** the shipped product, so changes to them must ship — never
commit them as `docs:` (that type never triggers a release, so installed users
would never get the update).

- `feat(<skill>):` — a new skill, or a new capability added to an existing one.
  Bumps the minor version.
- `fix(<skill>):` — correcting or refining how an existing skill behaves, including
  wording changes that change what the agent does. Bumps the patch version.
- Scope is the skill's folder name (e.g. `fix(land-branch): ...`).
- `docs:` is reserved for repo meta-docs that are **not** distributed in the
  plugin — `README.md`, this `CLAUDE.md`, code comments. These do not release.
- `chore:`/`build:`/`ci:` — scripts, manifests, workflows, deps. These do not
  release.
