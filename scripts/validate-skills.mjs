#!/usr/bin/env node
// Validate every skills/**/SKILL.md: required frontmatter, name matches folder,
// names are unique, description is present and not too long.
// Usage: npm run validate   (exits non-zero on any error; used by CI)

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = join(repoRoot, "skills");

// Recursively find all SKILL.md files under skills/.
async function findSkillFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      out.push(...(await findSkillFiles(p)));
    } else if (e.name === "SKILL.md") {
      out.push(p);
    }
  }
  return out;
}

// Minimal YAML frontmatter parser: only top-level "key: value" lines.
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (mm) data[mm[1]] = mm[2].replace(/^["']|["']$/g, "").trim();
  }
  return data;
}

// Everything after the closing "---" of the frontmatter block.
function frontmatterBody(content) {
  const m = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return m ? m[1] : "";
}

const files = await findSkillFiles(skillsRoot);
const errors = [];
const seen = new Map();

if (files.length === 0) {
  console.log("No skills found under skills/. Create one with: npm run new <name>");
}

for (const file of files) {
  const rel = file.slice(repoRoot.length + 1);
  const folder = basename(dirname(file));
  const content = await readFile(file, "utf8");
  const fm = parseFrontmatter(content);

  if (!fm) {
    errors.push(`${rel}: missing or malformed YAML frontmatter (--- ... ---).`);
    continue;
  }
  if (!frontmatterBody(content).trim()) {
    errors.push(`${rel}: no skill instructions after the frontmatter (body is empty).`);
  }
  if (!fm.name) errors.push(`${rel}: frontmatter is missing "name".`);
  if (!fm.description) errors.push(`${rel}: frontmatter is missing "description".`);

  if (fm.name) {
    if (fm.name !== folder) {
      errors.push(`${rel}: name "${fm.name}" must match folder name "${folder}".`);
    }
    if (!/^[a-z0-9-]+$/.test(fm.name)) {
      errors.push(`${rel}: name "${fm.name}" must be kebab-case (a-z, 0-9, hyphens).`);
    }
    if (seen.has(fm.name)) {
      errors.push(`${rel}: duplicate skill name "${fm.name}" (also in ${seen.get(fm.name)}).`);
    } else {
      seen.set(fm.name, rel);
    }
  }
  if (fm.description && fm.description.length > 1024) {
    errors.push(`${rel}: description is ${fm.description.length} chars (keep it under 1024).`);
  }
}

// Keep package.json and plugin.json versions in lockstep (release-please bumps
// both; a hand-edit to one without the other would silently diverge).
async function readJson(rel) {
  try {
    return JSON.parse(await readFile(join(repoRoot, rel), "utf8"));
  } catch (e) {
    errors.push(`${rel}: could not read or parse (${e.message}).`);
    return null;
  }
}
const pkg = await readJson("package.json");
const plugin = await readJson(".claude-plugin/plugin.json");
if (pkg && plugin && pkg.version !== plugin.version) {
  errors.push(
    `version mismatch: package.json is "${pkg.version}" but .claude-plugin/plugin.json is "${plugin.version}".`,
  );
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK: ${files.length} skill(s) validated.`);
