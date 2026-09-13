*Research & recommendation · 12 September 2026*

# Four gates between a good idea and *your clean-up*

<!-- copy-note:start -->

> **This is the committed copy of the guide *Estiva's Four Gates*.** It is the
> source of truth for the UI Guardrails project. If `docs/GATES.md` and this file
> disagree, this file wins.
>
> Copied on 13 September 2026 by UIG-2 from
> https://claude.ai/code/artifact/200f8d2f-51aa-4170-ab37-1aed1d549cbd (version
> `1789170129-badc`, written 12 September 2026). The HTML was converted to
> Markdown by a script, so the words are the guide's own.
>
> **What was changed, with Katerina's approval:** facts about our code that were
> wrong, one design point she ruled on, and the word "rules" split into *lint
> rules*, *usage rules* and *instructions*. Every change and its evidence is in
> `docs/GATES.md` §18 and §19. Nothing else was changed.

<!-- copy-note:end -->

Every time someone builds something new in Peek or Ship, it works — and it looks like nothing else. You find it. You fix it. That is a gap in the machine, not a gap in anyone's care. Here is what the gap is, what the industry does about it, and three plans at three sizes.

`estiva-ui 0.12.3` · `Peek · Ship · estiva-ui` · `11 sources` · `3 plans · 23 tactics` · `Peek · Ship · and Leaf next`

## 01 · Why it keeps happening

Not a list of complaints — the actual chain. Every link is a place where something could have stopped it, and today almost none of them do.

- **1** · Someone needs a panel header.
  A person, or a Claude session. Same behaviour either way.
- **2** · They don't know `ContainerHeader` exists.
  There is no list of what exists. 44 components in the package, more in each app, spread over three Storybooks on three ports.
- **3** · Nothing asks them to look before they write.
  The usage rules live in prose, in documents nobody opens mid-task.
- **4** · They write a `div` with `px-3 py-2`. It compiles.
  No lint objects. No hook blocks it. This is literally what happened in Peek PR #192 — a working `<ContainerHeader>` was replaced by a hand-made row.
- **5** · Every gate passes it: 1,219 tests, two typechecks, two lints, 323 stories.
  Because none of them asks "is this the right component?" — and Peek's 5 pages have 3 stories between them, none for Folders and none empty or loading.
- **6** · You open the app and find eight things.
  Then you spend a session and a lot of tokens putting them back.

> **In plain words**
>
> Nobody is being careless. There is simply nothing between "I need a thing" and "it's merged" that knows what we already own. You are that thing right now.

## 02 · The four gates

Everything in the research sorts into four jobs, in order. Each one catches what the one before it missed. You are currently gate four.

### Gate 0 · Know

One machine-made list of every component we own — package *and* both apps — saying what each is for, and when not to use it.

- Today · does not exist
- After · generated, in CI

### Gate 1 · Find

The list gets read *before* anything is written — by a Claude skill, by `llms.txt`, by an MCP lookup.

- Today · does not exist
- After · step 1 of every UI task

### Gate 2 · Refuse

Code that reaches past the system is blocked — at the keyboard by a hook, in the editor by a lint, at the merge by a required check.

- Today · colours & sizes only
- After · components & behaviour too

### Gate 3 · See

What no rule can judge — the look. Pictures of every state, and you approve only what changed.

- Today · components, not pages
- After · pages, states, per PR

**Today** · Everything that isn't a colour reaches you.
Eight defects on one page passed every automated gate. What found them was you opening the app.

**After** · Only the look reaches you.
"Is this the right component?" is answered by a machine. "Is this beautiful?" stays yours — it always should.

> **In plain words**
>
> Gate 0 is a catalogue. Gate 1 makes people read it. Gate 2 is a locked door. Gate 3 is a photo album you flick through. Right now we have a bit of gate 2 and a bit of gate 3 — so everything else lands on your desk.

## 03 · What the field actually says

Eleven sources, read today. The useful ones disagree with each other in places — which is how you know they're worth reading.

### ~95% compliance

An agent that reads from a **live component registry** follows the design system far better than one working from memory or prose docs.

**For us:** this is gate 0 + gate 1, and it is the single biggest lever on the problem you described.

*Into Design Systems, citing a 2026 benchmark · secondhand, unverified at source*

### Advisory vs deterministic

Anthropic's own guidance: *"a prompt instruction is advisory; a PreToolUse hook blocking a call is a real guardrail."* And: *"every time X, always do Y" belongs in hooks, not CLAUDE.md.*

**For us:** the answer to "is this a CLAUDE.md thing?" is **no, not on its own.** Documents persuade. Hooks stop.

*Anthropic · Steering Claude Code*

### 53–60% real adoption

Mews measure adoption from **production**: a build step marks every DOM element a design-system component created, then a script counts marked ÷ total, every 10 seconds, live.

**For us:** one honest number per app, per page. Peek's would be low today and would climb in public.

*Mews Developers · design system adoption metric*

### 74% is the healthy ceiling

Enforcing **100% adoption is an anti-pattern**. Effective systems land near 74%. Custom components live about 1.5 months before being absorbed or dropped.

**For us:** build an escape hatch on purpose, or people will disable the lint rules. See §06.

*W. G. Corrêa · DEV Community*

### 3 layers of AI instruction

The field has split agent instructions into `AGENTS.md` (always-on instructions), `SKILL.md` (the procedure, loaded on demand), `DESIGN.md` (the visual identity, machine-readable). Google open-sourced DESIGN.md in April; 11k stars.

**For us:** three files, three jobs. Don't cram all of it into CLAUDE.md — that's the mistake everyone makes.

*Google Labs · design.md · DEV Community*

### 80% fewer tokens

Indeed benchmarked component docs as **JSON versus Markdown** for agent consumption: 80% fewer tokens, 5× lower annual cost, same result.

**For us:** directly answers your token complaint. A generated `registry.json` is cheaper to read than prose, every single session.

*Into Design Systems · agent-ready design systems*

### llms.txt is now standard

Ant Design and Nuxt UI both publish `/llms.txt` (a ~5k-token index) and `/llms-full.txt` (everything) so any AI tool can read the library correctly.

**For us:** if estiva-ui goes open source, this is table stakes. It's how strangers' agents will learn it.

*Ant Design · Nuxt UI · llmstxt.org*

### Skill = the how, MCP = the what

Figma's guidance: MCP gives an agent *access*; the skill gives it *the usage rules*. A skill's first instruction should be **"always search the library before creating anything new."** Include a *Gotchas* section for where agents repeatedly get it wrong.

**For us:** our gotchas list writes itself — the hand-made header, the `div` that should scroll, the raw `<button>`.

*Figma · Resource Library*

### Designer approves, CI goes green

With visual regression on PRs, the **designer** reviews only the canvases that changed and accepts or rejects each. Approval turns the pipeline green; rejection fails it.

**For us:** this is your review, minus everything you shouldn't have had to look at. We already own half the machinery.

*Chromatic · design systems*

### Lints put rules in their face

The consistent theme across the ESLint literature: a rule in a document is a memory; a rule in a lint is an error **at the moment of typing**, with a message that names the right component.

**For us:** Peek already proves this works — `lint:tokens` has been a CI gate since D55 and colours stopped drifting.

*Backlight · eslint-plugin-design-system · Daylight*

## 04 · Each gate, technically

What each one is made of, what it catches, and — the part most write-ups skip — what it cannot catch.

### GATE 0 · Know — the registry

*One generated file. Three repos. Never out of date, because no human writes it.*

A script reads the source of estiva-ui, Peek and Ship and emits `registry.json`: for every component — name, repo, import path, purpose, the variants from its props, **the behaviours it owns** (focus trap, anchored positioning, scrolling, the slide — derived from which Base UI parts it imports), its status, and a link to its live story.

Two CI checks make it honest. Every entry must answer *When* and *When not* — naming the alternative — or CI fails. And a near-duplicate scan flags a new component whose name, props or class list already match something that exists.

Covering all three repos is the part that matters for your case: `PendingAttachmentChip` lives in Peek, not the package, and today nothing points anyone at it.

> **In plain words**
>
> A catalogue of every building block we own, written by a machine so it can't go stale — and it includes the ones that live inside Peek and Ship, not just the package.

**Catches**

- "I didn't know that existed"
- The same thing built twice
- A component with no story and no explanation
- Docs that quietly drift from the code

**Cannot catch**

- Anything on its own — a list nobody opens changes nothing
- It only works paired with gate 1

### GATE 1 · Find — read before writing

*The answer to "should this be a skill, or CLAUDE.md?" — it's both, doing different jobs.*

**A Claude Skill**, committed to each app repo. It triggers on any UI task. Step 1 is *search the registry before creating anything new*. It carries a *Gotchas* section listing exactly where sessions keep erring here — the hand-made header, the column that should scroll, the raw element. Anthropic's guidance is to move procedure out of CLAUDE.md and into skills once CLAUDE.md passes ~200 lines.

**CLAUDE.md becomes a thin index** pointing at the skill, plus *path-scoped instructions* (`paths:` frontmatter; Claude Code calls them rules) so page-specific instructions only load when someone touches `src/pages/**`. Fewer tokens per session, not more.

**`llms.txt` and an MCP server** extend the same facts to every other tool — Cursor, Copilot, whatever Jan or a stranger uses. The MCP version lets an agent ask *"what do I use for a floating panel?"* and get `Popover`, with the import line, instead of inventing one.

> **In plain words**
>
> A checklist Claude opens by itself whenever anyone asks it to build screen work here — and its first line is "go look at the catalogue". CLAUDE.md stops being a lecture and becomes a signpost.

**Catches**

- An agent inventing what already exists
- A stranger's agent, once the package is public
- Usage rules being forgotten mid-task
- Token waste from re-reading long prose

**Cannot catch**

- A human in VS Code who doesn't use an agent
- An agent that decides to skip a step — instructions stay advisory
- That's what gate 2 is for

### GATE 2 · Refuse — the locked door

*The only layer that works on people who never read anything. We already own the machinery.*

ESLint rules whose error message **names the component to use**. Not "don't write a div" — *"use ContainerHeader"*. Four families: forbid the raw element (`<button>`, `<input>`, `<a>`, `<dialog>`, with no folder exempt: an exception is one marked line); forbid the reach (a direct Base UI import, `createPortal`, a keydown listener, `role="dialog"`, `tabIndex` on a div, `overflow-auto`); fingerprint rules for hand-made headers and hand-made empty states; and a `className` allow-list so only placement classes pass through a package component.

A **PreToolUse hook** in each repo's `.claude/settings.json` runs the same lint rules on the content of an Edit or Write and exits 2 to block it — *before the file lands*, in every Claude session, mine or anyone's.

The trick that makes this land in days rather than weeks: give the new lint rules **their own config and their own script**, exactly as `lint:tokens` has, so the gate is green on day one and Peek's 80-odd existing lint errors don't block a single deploy.

> **In plain words**
>
> A wall. It goes up in the editor as someone types, it blocks Claude before it writes the file, and it stops the merge button. And it always says what to use instead, so it teaches rather than just nags.

**Catches**

- Everyone — Jan, me, you, a stranger
- Hand-rolled dropdowns, dialogs, tooltips
- A hand-rolled scrolling box (`overflow-auto`)
- PR #192's hand-made header
- Colours and sizes — already live

**Cannot catch**

- Real components composed into a layout that just looks wrong
- Spacing, rhythm, hierarchy, taste
- The Folders scroll bug: a column with no scroll container has no class for a lint rule to find
- That is gate 3, and then you

### GATE 3 · See — pictures, not pages

*The backstop for everything a lint rule can't judge. Also the layer that shrinks your job to its proper size.*

**Page stories built from generators** — `makeFolders(81)`, `makeFolders(0)`, `loading` — so the states that actually break get drawn. Peek has 5 pages and 3 page stories, none for Folders and none empty or loading; every one of your eight Folders defects was on a page.

**Visual regression per PR.** Every story shot in both themes, diffed against the baseline, and you see only the canvases that changed, with accept or reject on each. Your approval turns CI green. Either Chromatic (paid, purpose-built, designer-friendly UI) or Playwright screenshots taken in the Linux CI container — we already have `shots-themed.mjs` and `diff.mjs` doing this by hand.

**A route probe** opens every route with tall, empty and loading data and asserts the invariants: every scroll container is a package viewport, every empty is an `EmptyState`, no native tooltip, every control reachable by Tab.

> **In plain words**
>
> Photographs of every screen in every state, taken automatically. You flick through only what changed and tap yes or no. That's your whole review.

**Catches**

- "It follows every rule and still looks wrong"
- Empty, loading and overflowing states
- Anything a rule can't describe
- Regressions in code nobody touched

**Cannot catch**

- It catches things *after* they're written
- On its own it doesn't reduce the clean-up — it only finds it sooner and cheaper

## 05 · The menu — 23 tactics

Every idea worth having, sized. S is half a day to a day · M is two to three days · L is a week or more. The last column is new since you told me estiva-ui goes open source: does this ship *inside the package*, or stay ours?

|  | Tactic | What it does | Effort | Ships? |
|---|---|---|---|---|
| | **Gate 0 — Know what exists** | | | |
| T1 | **The registry** · registry.json | Every component in all three repos, generated from source. Purpose, props, behaviours owned, story link. | M | ships |
| T2 | **The "when not" contract** | A component whose page lacks *When*, *When not* or *How* fails CI. Turns your docs template into a CI check. | S | ships |
| T3 | **Near-duplicate scan** | Flags a new component whose name, props or class list already match one that exists. Stops the third MessageCard. | M | ships |
| T4 | **DESIGN.md** · Google Labs spec | Tokens machine-readable, the reasoning in prose. Has an official linter. Any agent, any tool, reads our identity correctly. | S | ships |
| | **Gate 1 — Read before writing** | | | |
| T5 | **A Claude Skill** · SKILL.md, committed | Triggers on any UI task. Step 1: search the registry. Carries a Gotchas list of where sessions keep erring here. | S | ships |
| T6 | **CLAUDE.md as an index** | Procedures move out to skills; instructions get `paths:` scoping so they load only when relevant. Fewer tokens, more obedience. | S | ours |
| T7 | **llms.txt + llms-full.txt** | What Ant Design and Nuxt UI publish. Any AI tool learns estiva-ui correctly without us doing anything. | S | ships |
| T8 | **An MCP server** | An agent asks "what do I use for a floating panel?" and gets `Popover` with the import line. Works for Cursor, Copilot, anyone. | M | ships |
| T9 | **Storybook as the doc surface** | Every registry row links to a live story. One place to look, not three ports. | S | ships |
| | **Gate 2 — Refuse** | | | |
| T10 | **Forbid the raw element** | No `<button>`, `<input>`, `<a>`, `<dialog>` in an app, and no folder is exempt: an exception is one marked line. Error names the component. | S | ships |
| T11 | **Forbid the reach** | No direct Base UI import in an app, no `createPortal`, no keydown listener, no `role="dialog"`, no `overflow-auto`. | S | ships |
| T12 | **Fingerprint rules** | The hand-made header (#192), the hand-made "Nothing here", a native `title=`, a class list copied out of a component. | M | ships |
| T13 | **className allow-list** | Only placement classes through a package component. Stops a colour or a size being smuggled in. | S | ships |
| T14 | **PreToolUse hook** | Blocks the write *before the file lands*, in every Claude session in the repo. The deterministic layer. | S | ships |
| T15 | **Its own config & script** · lint:rules | Green on day one, old backlog skipped — the same trick that let `lint:tokens` become a gate immediately. | S | ours |
| T16 | **Branch protection** | Required check on every PR in both apps. Nothing merges broken, whoever wrote it. **You already said yes.** | XS | ours |
| | **Gate 3 — See** | | | |
| T17 | **Page stories from generators** | 81 folders, 0 folders, loading. The states that break, drawn. Peek has 5 pages and 3 page stories, none for Folders and none empty or loading. | M | ours |
| T18 | **Visual regression per PR** | You accept or reject only what changed; your approval turns CI green. Chromatic, or Playwright in the CI container. | M | ours |
| T19 | **Route probe** | Every route, tall / empty / loading, asserting the invariants a story can't. Prints violations; must print nothing. | M | ours |
| | **Underneath — Measure & govern** | | | |
| T20 | **Adoption %, from production** | Mews' method: mark every element a package component made, count marked ÷ total. One honest number per app, per page. | M | ships |
| T21 | **The ratchet** | The violation count is committed; CI fails if it grows. Migration becomes a number that only falls. | S | ours |
| T22 | **The escape hatch** | `// @estiva-escape: reason` — sanctioned, listed in a report, reviewed. Without it, people switch the lint rules off. | S | ships |
| T23 | **The app starter** · the paved road | A template a new app is created from, carrying every gate already switched on. Leaf starts at zero violations instead of inheriting a backlog. See §07. | M | ships |

> **In plain words**
>
> Sixteen of these twenty-three would ship inside estiva-ui itself. They are not chores — they're what makes an open-source design system worth adopting, and what lets Leaf start clean.

## 06 · Three plans

Each one contains the one before it. Nothing is wasted if you start small and go further — A is the first third of B, and B is the first half of C.

### Plan A · Two Walls

**≈ 3 days · both apps**

- The lint rules, their own config, green from day one
- The PreToolUse hook in both repos
- Branch protection turned on

`T10 T11 T14 T15 T16`

**Stops the bleeding fastest.** But it refuses the wrong thing without teaching the right one — whoever hits the wall still has to go hunting for the component themselves.

### Plan B · recommended · Know, then Refuse

**≈ 2–3 weeks · + a Leaf starter**

- Everything in Plan A
- The registry across all three repos, with the "when not" contract
- The Claude Skill, and CLAUDE.md cut down to an index
- llms.txt, DESIGN.md, the escape hatch
- Fingerprint rules and the className allow-list
- The app starter, so Leaf is born at zero violations

`+ T1 T2 T4 T5 T6 T7 T12 T13 T22 T23`

**This is the one that matches what you asked for.** Know how components are used · docs that are always read · lint rules that enforce it · Peek's and Ship's own components covered, not only the package · and Leaf starts clean instead of being fixed later.

### Plan C · Agent-ready, open source

**≈ 5–6 weeks · the package becomes a product**

- Everything in Plan B
- The MCP server — any agent, any tool, any stranger
- The lint rules published as `@estiva-app/eslint-plugin-ui`
- Near-duplicate scan, the ratchet, adoption % from production
- Visual regression, page stories, the route probe

`+ T3 T8 T9 T17 T18 T19 T20 T21`

**The full 2026 answer.** Only worth it because estiva-ui is going public — this is what separates a component library people try from one they stay on.

> **In plain words**
>
> A is a wall. B is a wall plus a map plus someone handing you the map at the door. C is all of that, packaged so strangers get it too. Start at B — A alone leaves people stuck, and C is too much to do before you see anything work.

## 07 · Leaf is the real argument

Peek and Ship were both fixed *afterwards*. That is the expensive way, and we have now done it twice. Leaf does not have to pay it — but only if the gates exist before Leaf's first commit.

- **Ship** · Retrofitted. PRs #78, #92, #99, #108, #113, #130, #132 and #133.
  Eight pull requests to reach a package it could have started on.
- **Peek** · Retrofitted. PR #193 — 29 commits, 0.9.0 to 0.12.3, over two days.
  And eight defects still reached you afterwards, on the one page the sweeps couldn't see.
- **Leaf** · Retrofitted too — unless the gates are built first.
  A third clean-up, at the same price, for the same reason.

### T23 · Born compliant — the app starter

*The "paved road" pattern: make the correct road the only easy one to drive.*

Leaf is created from a template that already carries every gate switched on: the lint rules and their config, the PreToolUse hook in `.claude/settings.json`, the skill, CLAUDE.md as an index, the token import, `AppShell`, the page contract, the CI workflow with all the gates wired, and branch protection.

The decisive difference is the **ratchet's starting number**. Peek's starts at whatever it is today and has to fall. **Leaf's starts at zero and may never rise.** "Never any violations" is a far easier rule to hold than "reduce the violations" — there is no backlog to argue about and no exception anyone can point at.

The contribution path comes with it: anything Leaf needs that doesn't exist goes into estiva-ui *first*, or sits in Leaf behind an escape marker with a review date. That's how the package learns from the third app instead of drifting from it.

> **In plain words**
>
> Leaf gets handed a finished workshop instead of an empty room. Nothing to clean up later, because nothing wrong can be built in the first place.

**What this changes about the cost**

- Two weeks is not two weeks for Peek
- It is two weeks Leaf gets free on day one
- And every app after Leaf
- And every stranger who installs the package

**The one real risk**

- A template rots. If Leaf is scaffolded in six months from something nobody maintained, it starts wrong anyway
- Fix: the template is generated from the live repos, not copied once

### The timing point, and it is the sharpest thing on this page

If Leaf starts before the gates exist, we retrofit a third time — and we will already know we're doing it. Everything above is worth building on its own merits, but **the deadline is Leaf's first commit**, not some abstract "soon".

Two weeks spent now is cheaper than one more adoption PR. We have the receipts for what an adoption PR costs: twenty-nine commits, and you still found eight things by hand.

## 08 · What changes now the package goes public

You told me mid-way through this research, and it changed the recommendation. Here is how.

#### The tooling stops being housekeeping

A registry, a skill, `llms.txt`, a DESIGN.md and a lint plugin are internal hygiene when you have two apps. The moment strangers install the package, they become **the reason people adopt it**. Ant Design and Nuxt UI both ship llms.txt precisely because agents now choose libraries.

So the lint rules should ship *as part of the package* — `@estiva-app/eslint-plugin-ui`, a skill in the tarball, a registry served from the docs. A stranger installs estiva-ui and gets the guardrails free. That is what mature systems do, and it is the cheapest distribution advantage available.

#### Peek and Ship become the proof

Their adoption number stops being an internal metric and becomes the package's credibility — the thing on the README. A Nostr business app built entirely on estiva-ui, measurable, in public.

> **In plain words**
>
> The work that stops you cleaning up is the same work that makes the package worth downloading. You're not choosing between fixing your problem and building the product — they're the same job.

**New things worth doing**

- Publish the lint rules as a plugin others install
- Ship the Claude Skill inside the package
- Serve `llms.txt` from the docs site
- An MCP server so any agent can query it
- Put the adoption % on the README
- A public "when not to use this" for every component — rare, and a genuine differentiator

**New things to be careful about**

- Strangers need escape hatches more than we do — a lint rule with no exit gets forked or disabled
- Nostr-specific components (identity, relays, signing) need their own clear line between "the system" and "your app"
- Every internal name becomes public API. Naming now costs later.

## 09 · Where I'd push back on all of this

### 100% adoption is a documented anti-pattern

The strongest dissent in the research: enforcing complete adoption stops teams evolving the product. Effective design systems sit near **74%**, not 100 — and custom components have a natural life of about a month and a half before they're either absorbed into the system or abandoned. That's healthy, not a failure.

So the escape hatch (T22) isn't a compromise, it's part of the design. A sanctioned marker — `// @estiva-escape: reason` — turns one lint rule off for one line, lists it in a report, and gets reviewed. Without one, the first time a lint rule blocks something genuinely new, someone deletes the rule. Then you have nothing.

**And the honest limit of everything above:** not one of these gates can tell you a layout is ugly. They stop the wrong *component* being used and the wrong *behaviour* being re-written. Taste stays yours. The goal isn't to remove you from review — it's to make sure that when you look, the only thing left to judge is the thing only you can judge.

> **In plain words**
>
> Don't lock every door. Leave one marked exit, write down who used it and why, and check it monthly. People respect a rule that has an honest way out.

## 10 · What I need from you

Five answers and I can start. Nothing below needs code knowledge.

#### Q1 · A, B or C?

My recommendation is **B**. A is too thin to teach anyone; C is too long to wait before you see it working. B is two to three weeks, it matches your four requirements exactly, and it ends with a starter Leaf can be born from.

#### Q2 · Should I show you the lint rule list with counts before building it?

I can run every proposed lint rule over Peek and Ship first and show you one table — rule, how many places break it today, what the error would say. Half a day, and you decide on real numbers instead of my list.

#### Q3 · Chromatic, or the free version?

Chromatic is a paid service built for exactly your review, with accept/reject per canvas. The free version is Playwright screenshots in CI — we already own half of it, but the review interface would be a diff page, not a product. Only matters for Plan C.

#### Q4 · How public is public?

If estiva-ui is going open source soon, I'd name things and structure the registry for strangers from the start. If it's a year away, we build for ourselves and generalise later. It changes real decisions.

#### Q5 · Does Jan get a say in the lint rule list?

You've said the lint blocks his PRs. That will land on him first — most likely on his next new page. Worth him seeing the lint rules before they're a gate, or not?

#### Q6 · When does Leaf start?

This is the one that sets the deadline. If Leaf's first commit is months away, we build carefully. If it's weeks away, we build the gates first and Leaf second — because the alternative is a third clean-up we can see coming.

## Sources

Read on 12 September 2026. Where a claim is secondhand, it's marked as such above.

- 01 · [Anthropic — Steering Claude Code: CLAUDE.md, skills, hooks, subagents](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- 02 · [Figma — How to turn your design system into a Claude Skill](https://www.figma.com/resource-library/claude-skill-design-system/)
- 03 · [Mews — Building a design system adoption metric from production data](https://developers.mews.com/design-system-adoption-metric-building/)
- 04 · [Into Design Systems — Your design system is not ready for AI agents](https://www.intodesignsystems.com/blog/design-system-not-ready-for-ai-agents)
- 05 · [W. G. Corrêa — Enforcing 100% adoption is an anti-pattern](https://dev.to/wgcorrea/enforcing-100-adoption-of-a-design-system-is-an-anti-pattern-and-a-high-risk-factor-for-the-organization-1faf)
- 06 · [Google Labs — design.md specification](https://github.com/google-labs-code/design.md)
- 07 · [Nuxt UI — llms.txt](https://ui.nuxt.com/docs/getting-started/ai/llms-txt) · [Ant Design — llms.txt](https://ant.design/docs/react/llms/)
- 08 · [Chromatic — Visual testing and review for design systems](https://www.chromatic.com/solutions/design-systems)
- 09 · [eslint-plugin-design-system](https://github.com/dslounge/eslint-plugin-design-system) · [Backlight — Translating design system practices to ESLint](https://backlight.dev/blog/best-practices-w-eslint-part-1)
- 10 · [James Ives — Your design system needs an MCP server](https://jamesiv.es/blog/your-design-system-needs-an-mcp-server/)
- 11 · [Design Systems Collective — Measuring adoption: a visual coverage analyzer](https://www.designsystemscollective.com/measuring-design-system-adoption-building-a-visual-coverage-analyzer-b5d9ae410d42)

---
*Numbers about Estiva in this page were measured today, not recalled: Peek has 5 pages and 3 page stories, 58 story files across 115 components; the merged adoption branch passed 1,219 tests, two typechecks and two lints; eight defects were found afterwards by looking at the running app.*
