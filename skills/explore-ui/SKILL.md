---
name: explore-ui
description: Visually explore UI that is either bad or undefined. Take a screenshot of weak UI or a nebulous idea and produce several genuinely distinct takes in one self-contained HTML page, then iterate with the user to a single chosen direction and hand it off cleanly. Use whenever the user wants to rethink, redesign, lay out, mock up, explore options for, or visualize a screen, page, view, component, feature, or UI, even if they never say "mockup". Triggers on "how should this look", "this UI is bad", "redesign this", "explore options for", "lay out this", "mock up X", or any rough idea or weak screenshot handed over for visual exploration.
argument-hint: A screenshot, PRD, issue, or a rough description of the UI to explore.
---

# UI Mockup Explorer

Take something that is either bad UI (often a screenshot) or a nebulous idea, and explore it visually. Produce several structurally different takes, let the user steer to one, and hand the winner off without it being taken too literally.

This is a visual exploration tool. It does not create or maintain a design system. It borrows from existing patterns only when they help, and ignores them when the existing UI is the problem.

Works in Claude Code and Cursor. It is filesystem-based and tool-agnostic; nothing here assumes a specific agent.

## 1. Frame the brief

Normalize whatever you were given (prompt, screenshot, PRD, issue) into a one-paragraph brief: what is being designed, the core constraints, and the data or content it must show. Do this before exploring or drawing anything.

Data and content signals, in priority order:
- If screenshots are provided, treat their visible content, structure, and layout as the primary source of truth for data shape and content. Use the context clues in the image first.
- Reading the code to infer logic, data shape, and existing patterns is fine and encouraged, but inferred shapes are loose guidance, not a contract. Never lock the design to them, and when a screenshot is present, screenshot clues win.
- If neither is available, use realistic placeholder data drawn from the apparent domain. Never lorem ipsum.
- If the screen is part of a larger app, ask for or look at adjacent screens and the app's chrome (nav, sibling pages, related views). A screen designed blind to its container comes out generic; the surrounding app is what makes a take fit.

## 2. Explore the codebase if relevant (budgeted)

Exploration is optional and scaled to whether relevant code even exists. For a pure screenshot of someone else's product or a greenfield idea with no pointed code, keep this minimal or skip it. When there is relevant local code, the point is to take light cues so a take is grounded and shippable, not to reverse-engineer a system.

The budget is defined by answers, not file counts. Stop as soon as you can answer the three questions, or when you hit the ceiling below.

- Q1: Are there existing patterns or components nearby worth respecting so a take feels native and realistic to ship? (Whether to borrow or diverge is decided in step 3.)
- Q2: What does the nearest analogous screen, view, or component look like?
- Q3: What is the rendering paradigm, so the handoff names the right target?

Procedure:
1. Detect the stack from manifests (`package.json`, `Gemfile`, config files) and route to the matching recipe.
2. Prefer targeted search (grep/glob by config names and feature keywords) over directory walks. This is what keeps exploration cheap in a large repo.
3. Run the recipe, answer Q1 to Q3, stop.

Frontend (Next.js / React) recipe:
- `tailwind.config.*` and any theme/tokens file, `globals.css` or CSS custom properties.
- A component library: `components/ui` (shadcn), or deps like MUI, Chakra, Radix, Mantine in `package.json`.
- Storybook stories if present (treat as the component gallery).
- The route, page, or component nearest the feature (`app/` or `pages/`).

Rails recipe: `Gemfile` (ViewComponent, Phlex, `tailwindcss-rails`, CSS framework), `app/components` and `app/views/shared|layouts` for patterns, `app/assets/stylesheets` for tokens, Lookbook/Storybook if present, and the nearest feature's controller and views.

Ceiling: roughly 10 to 15 targeted reads, fewer if Q1 to Q3 clear sooner. In a large monolith, sample the token source plus the feature's neighborhood and note in the handoff that you sampled rather than surveyed. If no design system surfaces after a bounded search, declare "no detectable design system" and design from layout best practices instead of digging further.

## 3. Decide how much to borrow

Treat existing patterns as an input, never a mandate.

- Patterns worth keeping: borrow from them (component shapes, spacing rhythm, color) so a take feels native and shippable. Reference real components by name where you can.
- The existing UI is the problem: do not perpetuate it. Diverge deliberately, and say in the take's description what it departs from and why.
- No relevant context: design from clean layout, hierarchy, and UX principles. Restrained defaults over invented flourish.

## 4. Produce the takes

Generate at least four takes that differ structurally, not cosmetically. Color or spacing tweaks alone do not count as a distinct take. Each take must differ on at least one of these axes:
- Layout (e.g. table-dense vs card grid vs split-pane vs single-column flow).
- UX flow (e.g. everything on one screen vs progressive disclosure vs wizard/steps).
- Interaction model (e.g. inline edit vs modal vs side panel; filter-first vs browse-first).
- Information pattern (what is primary, what is secondary, what is hidden until needed).

Output format:
- One self-contained HTML file. Tailwind via CDN is fine. No build step, no dev server, no external assets it cannot reach. Never ASCII or plain-text wireframes.
- Storybook is an acceptable output target only if the project already uses it.
- All takes live on the same page, each clearly labeled with a title, a one to two sentence description of its organizing principle and main tradeoff, and the axis it explores, so the user can scan the differences at a glance.
- Use a switcher (tabs or buttons) to view each take full-size, with the description visible for the active take. A legend listing all takes up top helps scanning.
- Populate with realistic data per the brief.
- Account for empty, loading, and error states, at least noting them, since they affect layout.
- Always design for responsiveness and text overflow. These are the most-missed details and always matter. Every take must reflow sensibly to a narrow viewport, and long values (emails, names, URLs, addresses, IDs, free text) must wrap, truncate, or clamp, never overflow or break the layout. Decide the behavior per element rather than hoping it never happens.
- Wire light interactivity so the feel can be judged: the take switcher plus the one or two interactions central to each take (a tab toggle, a live-updating preview, a disclosure). Keep it minimal. This is for evaluation, not a working app.

Match fidelity to phase. The first round stays structural and lean: enough to read each take's layout and interaction, not pixel-polished. Invest real detail (refined states, final copy, micro-interactions) only in the direction the user chooses. Do not polish takes that may be discarded.

Write the file to a gitignored scratch dir such as `.mockups/`. Do not pollute the app or commit throwaways. Clean up or leave them ignored.

## 5. Interview loop

Present the page, then tell the user the rule explicitly each round:

> Pick a take to lock it. If you pick one with no other feedback, we stop there. Pick one and tell me what to change, and I will iterate on that direction. Say "done" anytime to stop.

Then:
- Ask one question at a time.
- Track the current working take as the base for iteration.
- "Pick with feedback" can mean refine the chosen take or merge parts of several (for example, drop take B's side panel into take D's layout). Merging is a distinct mode from refining one, support combining elements across takes, not just tweaking a single one. Only spin up fresh variants if the user asks for new directions.
- Iterate by editing the existing mock file in place, not by regenerating it. Once the first version exists, apply each change as a targeted edit. Full rewrites every round are slow and wasteful.
- Stop on a bare pick, on "done", or when the user signals consensus.

## 6. Handoff

When the loop ends, produce the finalized mock plus a short handoff summary written for another agent to implement against the real stack. The summary must separate two things clearly:

- Load-bearing decisions to honor: the layout, the interaction model, the information hierarchy, which existing components and tokens to reuse, and the rendering target (React component, ERB partial, ViewComponent, etc.).
- Mockup conveniences not to take literally: placeholder copy, fake data, exact pixel values, and any detail that was only there to make the mock render.

Goal: the next agent reproduces the intent without copying throwaway specifics or missing a critical decision.
