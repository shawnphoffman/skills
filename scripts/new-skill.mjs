#!/usr/bin/env node
// Scaffold a new skill: creates skills/<name>/SKILL.md with starter frontmatter.
// Usage: npm run new <skill-name>   (or: node scripts/new-skill.mjs <skill-name>)

import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const raw = process.argv[2];
if (!raw) {
  console.error("usage: npm run new <skill-name>");
  process.exit(1);
}

const name = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
if (!name) {
  console.error(`error: "${raw}" is not a valid skill name (use letters, numbers, hyphens).`);
  process.exit(1);
}

const dir = join(repoRoot, "skills", name);
const file = join(dir, "SKILL.md");

const exists = await access(file).then(() => true).catch(() => false);
if (exists) {
  console.error(`error: ${file} already exists.`);
  process.exit(1);
}

const template = `---
name: ${name}
description: One sentence on what this does and when to use it. Start with the capability, then "Use when..." with concrete trigger phrases the agent should match.
---

# ${name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}

Write the skill instructions here. Keep it focused on one capability.

## When to use

- ...

## Steps

1. ...
`;

await mkdir(dir, { recursive: true });
await writeFile(file, template);
console.log(`Created skills/${name}/SKILL.md`);
console.log("Edit the frontmatter description, then run: npm run validate");
