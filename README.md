# skills

Shawn Hoffman's agent skills, packaged as a Claude Code plugin.

## Install

Add the marketplace, then install the plugin:

```
/plugin marketplace add shawnphoffman/skills
/plugin install shawnphoffman-skills@shawnphoffman-skills
```

Update later with `/plugin marketplace update shawnphoffman-skills`.

Skills are also installable via the [skills.sh](https://skills.sh) CLI:

```bash
npx skills@latest add shawnphoffman/skills
```

## Publishing a skill (the whole point)

Skills auto-discover from the `skills/` directory, so there is **no manifest to
edit**. To publish a new skill:

```bash
npm run new my-skill      # scaffolds skills/my-skill/SKILL.md
# edit skills/my-skill/SKILL.md
npm run validate          # check frontmatter
git add . && git commit && git push
```

That's it. Anyone who has the plugin installed gets it on the next
`/plugin marketplace update`.

## Skill format

Each skill is a folder under `skills/` containing a `SKILL.md` with YAML
frontmatter:

```markdown
---
name: my-skill
description: What it does and when to use it, with trigger phrases.
---

# My Skill

Instructions for the agent...
```

- `name` must be kebab-case and match the folder name.
- `description` is what the agent matches on to decide when to invoke the skill,
  so make the triggers concrete.
- A skill folder can include extra files (reference docs, `scripts/`) alongside
  `SKILL.md`.

## Local development

Test skills against your local Claude CLI without installing the plugin:

```bash
npm run link      # symlinks every skill into ~/.claude/skills
npm run list      # list all SKILL.md files
npm run validate  # lint frontmatter (also runs in CI)
```

## How it works

- `.claude-plugin/marketplace.json` — makes the repo an installable marketplace.
- `.claude-plugin/plugin.json` — declares the plugin; skills are auto-discovered
  from `skills/`, so this file rarely changes.
- `.github/workflows/validate.yml` — runs `validate-skills.mjs` on every push/PR.

## License

MIT
