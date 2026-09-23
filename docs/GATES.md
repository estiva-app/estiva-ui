# GATES.md — UI Guardrails

The working record for the UI Guardrails project. Counts, decisions, and what is
left to do.

The reasoning lives in `docs/GATES-GUIDE.md`. If this file and the guide
disagree, the guide wins.

UIG-1 wrote §1 to §14. UIG-2 added §15 to §22: the route, the five seams,
`gates:status`, the guide's corrections, the three words for "rules", the
decisions it took, the debt lists, and what it found in other tickets. §0 is kept
current by every ticket.

Status key: ✅ done · 🚧 in progress · ⬜ not started · ⛔ blocked · ⚠️ needs your
answer

---

## §0 Where we are

**23 September 2026, night. UIG-20 is built: in any repository, Claude searches every catalogue by itself before it builds.** This is Katerina's condition for having no shared Storybook (UIG-19). Branch `gates/20-skill` in estiva-ui, peek and ship; **in review, not merged.** It ships in **one 0.28.0 with UIG-37** (below), by Katerina's call, so each app takes one release in one PR. The same PR stops the accessibility job running on pull requests: it runs on main only (her ruling, 23 September). The ticket was rewritten in Ship first with her six rulings and what had gone stale. **Estiva ID is left out by her ruling** ("isn't properly done yet"). It joins the search and the skill when it installs the package, with nothing to change here, and Leaf joins with UIG-11 in the same way.

**What was built.**
- **One search, from anywhere.** `estiva-ui find <words>` with nothing else typed searches the package, the app it runs in, and every app beside it (`src/registry/siblings.ts`): found, not named, so every repository's `ui:find` loses its `--also`, and Ship's top folder gets one. It searches each app once: a worktree or `ship-notion` is skipped. The ranking now puts a package part whose *name* carries a word first: "panel header" answered Peek's `Header` above `ContainerHeader`. The blunter rule (any package part first) buried Ship's `Composer`, so it was narrowed. Of twenty real questions, four changed, each moving the package's part up.
- **The skill, once, in the package** (`skill/estiva-ui.md`): when it applies, five steps (search first, read When / When not, ask if nothing fits, never hand-roll, escapes), and 24 Gotchas. `docs/GATES-SKILL.md` reconciles them against **542 recorded defects** from `PEEK-ADOPTION.md` §17, `PLAN.md` §14, the three `GATES-DEBT.md` lists and this file: **111 are Gotchas, and 431 are excluded with a reason** (tooling 260, ruled 79, a gate already refuses it 41, removed 19, the steps cover it 18, accessibility 14). `src/registry/skill.test.ts`, run by the `gate` job as `skill:check`, fails when the skill names a part or prop the package lacks, names an app, loses a regression, or stops adding up. On its first run it caught `Skeleton`, which is not a part.
- **A loader per repository**, written by `estiva-ui skill`: `.claude/skills/estiva-ui/SKILL.md` holds the trigger and one line, `` !`cat "${CLAUDE_PROJECT_DIR}/…/skill/estiva-ui.md"` ``, and `.claude/settings.json` allows `npm run ui:find`. `estiva-ui check` fails when either is missing or differs, so every app's `gate` holds it. `create-estiva-app` writes both.
- **The hook searches first.** The editor gate's hook stops the first Write of a new file that draws a new part, and hands back what `find` has for the part's name. The second Write goes through.

**What Claude Code allowed, measured with fresh `claude -p` sessions (2.1.215).** An injected command runs only when Claude Code can read it as read-only. A path with `..`, a `$(…)` and a `node -e` were each refused, and a refused command stops the skill from opening. So the loader's path starts at `${CLAUDE_PROJECT_DIR}`, like the hook's, and **both need a session started at the repository's top folder**. An `allowed-tools` line made opening the skill itself ask for permission, so the search is allowed in settings instead. **Claude Code applies a repository's allow rules only after its "trust this folder" question is answered once**, and never in `claude -p`. So the proofs ran in auto mode, as Katerina works.

**Proved, fresh sessions, transcripts in `K:\Estiva\reviews\uig20-proofs\`.** Each was asked in plain words, with no mention of the skill or the search. In estiva-ui, Peek and Ship, each session opened the skill by itself and ran the search by itself:
- a panel header → `ContainerHeader`, twice (estiva-ui, Peek);
- a long list → `ListColumn`, with `Sidebar` and `ScrollArea` ruled out from their *When not*;
- a date divider in Ship → it **found Peek's `DateDivider`**, read that its page keeps it in Peek, and chose the package's `Divider label`;
- "create StatusPill.tsx" → the hook stopped the first write with the search, and the second went through.

`gates:status` UIG-20: estiva-ui 9 of 9; Peek and Ship turn green when they take 0.28.0.
**23 September 2026, night. UIG-37 is built, in review: the token lint and the gate stop refusing TypeScript's own `eslint-disable` comments.** Peek PR #324 added a script with `// eslint-disable-line @typescript-eslint/no-explicit-any`. The line is right; Peek's token lint failed on it anyway: *Definition for rule '@typescript-eslint/no-explicit-any' was not found.* ESLint refuses a comment that names a rule it does not know, and the checks that run on their own had only ever been taught `react-hooks`' names. The same gap sat in the gate in Peek and Ship, in Ship's lint, and in the files `create-estiva-app` writes. **What changes here:** `gateConfig` registers TypeScript's plugin, every rule off; a new `tokenConfig()` is the token lint on its own, the same shape, so Peek's hand-built `eslint.tokens.config.js` becomes one line (§23: a gate piece lives in the package); a made app gets that line; and every app's `gates:status` gains UIG-37, which lints the comment through the gate and each token config. The plugin goes only into the checks that run alone: a full lint that loads TypeScript's rules from its own copy would refuse a second plugin under the same name. **Proved:** the new tests failed first with the exact CI message, then passed. Release 0.28.0, then Peek and Ship take it (Ship's lint learns TypeScript's names too). PR #324 itself is left to its author, by Katerina's ruling.

**23 September 2026, late. UIG-19 is done: the usage-page rules are enforced, not just written, in all three repos.** estiva-ui PR #77 (0.27.0, merge `f4c973b`, tag `v0.27.0`, npm latest), peek PR #321 (`50e39d6`), ship PR #174 (`9b69e2d`), and this record's PR, which also makes the package's own `gate` job run the contract. **What `estiva-ui check` now refuses**, in every repo's `gate` job, the only check merging requires: a reusable part with no usage page, or one missing its opening line or When / When not / How / What it owns in order, or code under How; a reusable part drawn nowhere (no story of its own, no `**Seen in**` line); a catalogue story or docs link its Storybook does not have, or a page it cannot compile (`storybook index`: no server, seconds); and something a part draws only behind a prop that no story passes. **"A new component arrives unclassified"**, the ticket's second example, cannot happen: the builder gives every part a class. What can go wrong, a part with no description line, CI already refused (UIG-13).

**Proved in CI, on throwaway draft PRs, closed and deleted:** peek #322 (Avatar's "When not" removed, and a reusable part with no page and no story) and ship #175 (Attachment's "When not" removed) failed `gate` and were **BLOCKED**, each naming the part and the file to write. **estiva-ui #78 found a hole:** the page test failed `check`, but `check` is not required to merge, so the PR read UNSTABLE, mergeable. The package ran its own contract only outside `gate`. This PR adds the page test and `registry:check` to `gate`, and the status check now asks for that, not for "somewhere in CI".

**Her rulings, 23 September, all built:** no shared Storybook (the search is `estiva-ui find`; her condition, that Claude runs it unasked in any repo across every Storybook, is on UIG-20 as a test); "Seen in" counts as a story; local only; Leaf joins when UIG-11 makes it; the missing-button check **strict**, a part's own stories show everything it can draw, including what it hands to a smaller part; props that only reach a dialog skipped; SelectionToolbar's line marked "Seen in"; Header's dead `tabs` row deleted; the gaps fixed inside the ticket. **UIG-36 ran first** (Estiva ID's own Storybook).

**What it found, all fixed:** 11 things a story never showed (package 7: SectionHeader's chevron, CollapsibleSection's trailing slot, ListColumn's chevron, MenuItem's hover hint, EnterHint's target, a face in Person and PersonTrigger; Peek 4: Header's tabs, dead since tabs left Peek, and three rows of PersonRow's file menu), and a part drawn nowhere that was not: the catalogue missed FilesPanel's and TopicDetailsDialog's ten stories each, because they draw the `…View` half. **And it caught a live one on its first day:** FOL-4 gave `StartTopicDialog` a second caller, making it reusable, with no page. Katerina reviewed the page drafted from its code.

**The story numbers, after:** Peek 48 reusable, 29 with a story of their own and 19 with a "Seen in"; Ship 12 reusable, 9 and 3; the package, every component. Story links: package 172, Peek 122, Ship 46, none dead. The ticket's own "122 stories for 233 components" (12 September) counted differently and is superseded by these.

**Traps worth keeping.** The prop scan reads a story's `args`, attributes on the part's tag, and spreads of objects in the same file, including `...Topic.args`. A spread it cannot open, such as a helper's `{...props}`, counts as passing everything, so it stays quiet rather than wrong. That is how Peek's Menus sheet draws TopicMoreMenu, which the scan therefore cannot judge. **npm serves a new version's metadata minutes before its tarball:** both app PRs failed `npm ci` with E404 four minutes after the publish, and passed on a re-run. **Renaming a story cannot make a dead link in an app**, since the catalogue is rebuilt from the same code; what does is a page Storybook cannot compile (`{a long title}` in MDX prose does, `{time}` does not). **A lockfile was bumped by hand from the registry's own tarball and integrity**, since the dependencies were unchanged, so no Windows `npm install` pruned the Linux-only packages; `npm ci --dry-run` confirmed it.

**23 September 2026, evening. UIG-36 is done: Estiva ID runs its own Storybook, and Peek's shows Peek only. UIG-19 was re-scoped before it started. UIG-17 is merged** (peek `f13834f`, #307; this file's record `1e33935`, #75), so the paragraph below that calls it "in review" is history.

**UIG-36 is a new ticket, made and done the same day, by Katerina's ruling that it runs before UIG-19.** Estiva ID's 70 stories live in `estiva-id/web/src` but could only be seen inside Peek's Storybook, which reached into the sibling checkout. estiva-id PR [#67](https://github.com/estiva-app/estiva-id/pull/67) (merge `1ece1f3`) gives it `.storybook/` and `pnpm storybook` on **:6009**: the same 9 files, 70 stories and 9 docs pages. The packages were already in its `devDependencies`; only the setup was missing. peek PR [#314](https://github.com/estiva-app/peek/pull/314) (merge `1654fa0`) removes everything Peek kept only for it: the stories entry, the one-React alias, the `server.fs.allow` path, the `estiva-id` theme branch (after which `forceTheme` had no user, so the per-story theme decorator went too), the closed heading, and the Introduction row. **All 310 Peek stories were photographed on main and on the branch: 297 pixel-identical.** The other 13 are shimmers, a spinner and a caret, and they differ between two photos of unchanged main too.

**Moving it found three real bugs in the live account UI, hidden by Peek's reset.** Every story was photographed in both Storybooks: 50 of 70 identical, 20 not. The real app loads only `styles.css` (`web/src/main.tsx:4`), and Peek's Tailwind preflight had been covering what it lacks. The invite **email** (`type="email"`), the **bot name** and the **role name** (no `type`) matched no field rule, because only `text` and `url` were styled. They drew as the browser's own small box, beside styled neighbours in the same form. `.hint` set only its top margin, so every hint written as a `<p>` carried 12px below it. The bots list's `plain` class had **no rule at all**. She ruled on each from photos: fix all three in UIG-36, leave "No such person." (a bare `<p>`, 16px lower). After the fix, 63 of 70 match Peek's photos; the 7 that don't are the three fields (Peek drew them with no box at all), that one line, and a hidden file picker. **Merging estiva-id publishes the image the production box pulls**, so the fix is live. **Lesson worth keeping: a story rendered inside another app's Storybook inherits that app's reset, and can look better than the product.**

**`gates:status` reads UIG-36 3 of 3** with the three checks pointed at the branches, and 0 of 3 against the unchanged main checkouts, so the checks can go red. They read Estiva ID from `GATES_ESTIVA_ID` (default `../estiva-id`), because estiva-id is not a gated repo and has no status of its own.

**UIG-19 lost half its text, on purpose.** Katerina asked why a shared Storybook was needed at all. The answer was that it isn't: `estiva-ui find <word> --also peek=../peek --also ship=../ship/web` already searches every catalogue and prints a direct Storybook link per match. UIG-12 and UIG-13 built that after UIG-19 was written on 12 September. So composition is dropped, and the ticket is now **"Lock the contract in CI"**, rewritten in Ship with her six rulings: no shared Storybook; a **Seen in** list counts as a story; local only; Leaf joins when UIG-11 makes it (reminder on UIG-11); the prop-no-story-passes check from UIG-17 joins; UIG-36 first. **Her condition for dropping it is on UIG-20 as an acceptance test:** in any repo, Claude runs that search by itself, across every Storybook, with nothing typed. The check that looked for `refs:` in `.storybook/main.ts` is replaced by one that fails while Peek or Ship still keep their own copy of the section check. That is the pasted copy UIG-19 exists to remove, so it is red today, as a check for unbuilt work should be. **Measured before starting:** CI in all three repos already refuses a part with no class or no description (`estiva-ui check`), and estiva-ui's `pages.test.ts` already fails a missing *When not*. Peek's and Ship's section checks run only in `gates:status`, not in CI. The ticket's 233 entries are now 87 in the package, 145 in Peek and 91 in Ship.

**23 September 2026. UIG-17 is built and in review: every reusable part of Peek carries a written rule beside it, and its Storybook was rebuilt to one principle.** peek PR [#307](https://github.com/estiva-app/peek/pull/307), `check` and `gate` green, MERGEABLE/CLEAN — **not merged, Katerina merges.** `gates:status` in peek reads UIG-17 **4 of 4**. estiva-04 reviewed it at `ce1c9b1` and its four findings are folded in below. **No commit count is written here on purpose** — it was wrong within an hour of being written, twice, and a number that changes every time Katerina asks for one more thing does not belong in a record. The PR is the count.

**The numbers were eleven days old here too.** The ticket says 115 parts; `GATES.md` said 53 reusable. Rebuilt from the branch's own code, after `main` merged in **twice**: **145 parts in 118 files — 20 re-export, 48 reusable, 76 one-off, 0 promote-candidates, 1 unused.** All 48 have a page. The one candidate the app had, `EditedMarker`, **she ruled stays Peek's**, so the promote list closes with her word rather than an inference; the classification is written into the component's own comment.

**Stories are UIG-19's, and this ticket's own text still says otherwise.** §15 already recorded that ("not in this ticket, on purpose") and she ruled the same way on 21 September: a story repeating the package's is not worth writing, and each page carries a **Seen in** list instead. 27 of the 48 have a story of their own; the rest are drawn inside another story and say where. Two comments on UIG-17 state this and the other scope corrections, rather than a silent edit of the ticket.

**The Storybook itself was the bigger half, and it came from her review.** Peek's sidebar had been using three ideas of what a heading means at once — a kind of thing (Primitives, Overlays, Views), a part of the product (Messages, Topics), and a job (Navigation, Entry, Diagnostics). That is what "it's a mess" was. **Her six rules**, now on Peek's Introduction and worth copying into Ship: one principle per Storybook, stated on its first page — an app groups by *the place in the product*, the package by *the kind of part*, never both; three levels, never four; an entry is its component's name; headings in a written order and everything inside them alphabetical; Docs, then whole screens, then the parts; a status group is allowed and carries a ticket and a date.

Applied: twelve headings, down from a heading count that hid four holding one entry each. `Navigation` and `Entry` folded into **Frame** — `AppShell` *is* the frame and had been filed away from it. **Folders** became a heading, holding the seven file parts that had been split across three. **Every dialog is its own entry now, placed by the place in the app it opens from** — reversing her 20 September "one sheet", because `Overlays` had ended up half split and half grouped, with two dialogs showing as rule pages three rows above the sheet that drew them. `Overlays/Menus` stays one entry, and says why in its own header. **43 entries / 268 stories → 80 entries / 309 stories.**

**Sorting was four words of config and the single biggest change.** `storySort.order` named the headings, so what sat inside them fell in indexer order. It is a sort function rather than `method: 'alphabetical'`, because that setting also sorts the stories *inside* a component and those are ordered on purpose. **Trap: `storySort` as a function must be plain JavaScript** — Storybook hands it to the manager as a string, so a TypeScript annotation inside the body reaches the browser as TypeScript and the whole sidebar dies with "Unexpected token ':'".

**Her second ask was the stories themselves: that they show what the app shows, and write no markup.** The example she gave was the Screener's hover card, and it was worse than the one story she had noticed — **three of the four places that draw a Screener row showed nothing at all on hover**, because the card reads the conversation through a backend and a story has to bring its own rows. The same fixture had been hand-written four separate times, four different conversations. One fixture now, on the meta, so every story opens it.

**That fault has a shape, and it is worth a check in UIG-19: an element behind `{someProp && …}` that no story anywhere passes.** It works in the app, so nothing fails; it is simply invisible here, and reads as a broken behaviour rather than a missing fixture. A scan over every Peek component found four more, all real: `ConversationCard` had no **Reply** in its hover strip; `ReplyCard` never drew **Edit message** or **Delete**, because every reply story was somebody else's and the card decides that from the author's name; `TopicMoreMenu` was missing **Rename** and **Copy link**, two of its five rows; `ThreadPanel` never drew **Open original**, the jump from a huddle to its DM. Each checked by opening it in Chrome and reading the labels back.

**UIG-17's own checks replaced two that could not work**, and the failures are the lesson: one named `PendingAttachmentChip.mdx`, which UIG-35 had deleted — a check can name a file that no longer exists and fail for ever — and the other read `e.class` when the class lives at `e.app.class`, so it failed on a registry that was entirely correct. **A check that reads the wrong field is worse than no check: it reports a fault in the thing it is checking rather than in itself.** The four now: every reusable part has a page with the four sections (the contract is an opening line plus `When` / `When not` / `How` / `What it owns` — four headings, not five, so the old five-heading helper would have failed every page in the repo); a page sits beside its component; the classification reconciles; and **the Introduction names exactly the headings the sidebar has**. That last one is new and is hers: the page had been wrong twice in three days, once naming three headings that had gone and once missing four that had arrived, and nothing noticed either time. It was proved by breaking it, not by watching it pass.

**Main was merged in twice, rather than left for PR day.** First 19 commits, whose one conflict was in the file the branch had restructured — `FoldersPage.tsx`, where FOL-41 rewrote the Folders header while the branch was splitting the page into a view and a page. FOL-41 was built into the split, and the page's stories followed it. A near miss: `main` edited `FolderTree.stories.tsx` while the branch had renamed it; git followed the rename.

**Then three more, found only by pushing — and the way they announced themselves is worth knowing. GitHub reported the pull request CONFLICTING with no checks at all**, because a conflicting PR has no merge commit for `pull_request` to run against. Absent CI means look for a conflict first, not for a broken workflow. Four conflicts, two of them judgement calls. **`ScreenerItem`:** FOL-34 says a file row opens no hover card, and UIG-17 had added a `preview` escape so a story could draw the card at all — resolved so a file row never opens one whatever the caller passes, because the other way round would have grown a card on main's own `FileItem` story, whose comment says it has none. **`DeskPage`:** main added a file branch to the inline Open work markup that this branch had replaced with a presentational view, so FOL-34 was built into the split — `DeskRow` gained `'file'` and `isBareFile`, and the container maps it, never selected, because a file opens on its own page. Also `ConversationCard.readOnly.test.tsx`, which main wrote against `ThreadReplyCard` and which is `ReplyCard` now.

**⚠️ `JoinTopicBanner` is unused as of CON-8**, whose `ReadOnlyTopicBanner` took its place. **Not deleted** — §15 records that deleting an unused part is Katerina's call once she has seen it. It keeps its story; it never had a usage page, because it was a one-off before CON-8.

**The interop failures, settled.** Locally two type errors and two test failures (`pastedUrl`, `fileConversation`) come from the shared `node_modules` holding `@estiva-app/interop` 0.24.0 while `main` asks ^0.28.0. Proved twice: the same two tests fail identically on an unmodified `origin/main` worktree against the same modules, and then peek's `check` job — `npm ci`, typecheck, `test:run` — passed in CI. No local install was needed, and none was run: that folder is a junction shared with Katerina's main checkout.

**estiva-04's four findings, all confirmed and all folded in.** Two of the four checks could not fail — "a page sits beside its component" is true by construction, because the builder derives `docPage` from the source file's own directory (`src/registry/app.ts:735`), and "the classification reconciles" asserted that a group-by sums to the length of the list it grouped. They are now **every heading is named in `preview.tsx`'s order** — the bug the gate was written after and did not cover — and **the count the Introduction states is the count the registry builds**, which is the thing that actually rots. Both were proved by breaking them. Two unnamed headings also compared equal and interleaved; they sort alphabetically among themselves now. And `EditedMarker`'s classification reason was cut off mid-sentence, because the builder reads one line and it had been written over two.

**Left for Katerina:** the two merges, `JoinTopicBanner`, and three entries that carry their file's name rather than their part's — `Primitives/PeekLogo` (the part is `PeekLogoMark`), `Primitives/ShipLogo` (`ShipLogoMark`), `Screener & Desk/ScreenerPreviewCard` (`ScreenerPreviewCardView`) — which is her own rule 3 unapplied in three places. Next: UIG-19.

**22 September 2026. UIG-18 is done: every part of Ship worth reusing carries a written rule beside it, and the four that were drawn nowhere have a story.** Ship PR #170, merged `643823e` and deployed. **The ticket's numbers were eleven days old:** it said 74 components and 18 stories; the catalogue reads **91 parts in 73 files — 40 re-export, 12 reusable, 39 one-off, 0 candidates** (a file is not a part: `ConversationThread.tsx` exports two). **Fourteen pages, not twelve.** `DescriptionEditor` and `BlockAnchorNote` are one-offs, and she ruled them out until she asked what they were — `BlockAnchorNote` turned out to be drawn by **no story in Ship at all**, because no fixture carries an anchor, so its two failure sentences, whose whole job is to be told apart, had never been read side by side. It is in, with a story; `DescriptionEditor` is in with a page only. **Stories: 20 files and 105 stories before, 25 and 126 after**; parts linked to a story, 18 before and 23 after. Three of the twelve keep a "Seen in" list instead of a story that would repeat one she already has (her rule, 21 September). **The seven Ship/Peek pairs are recorded** — she ruled: record all seven, promote none yet; the strongest is `Reference`, the same file name in the same folder in both repos, which §11 G3 called out on 13 September. **Three things it found, none fixed** (she ruled "not yet" on filing them): a foreign status loses its shape *and* the colour the manifest published, in every app; a "muted" mention card differs by eight to twelve levels, which D70's own method calls noise; and four dialogs' ten stories link to nothing. **Then she reviewed it**, and eight points came back. Five were right and are built: a foreign status had the wrong icon (finding 1, which she found independently — fixed rather than filed), the conversation count floated 2.6px above the app chip, a card drew a rule above its children, `BlockAnchorNote` and `ConversationThread` needed stories where the part is actually seen, and `ConversationCount` needed one fewer. **And tables**, read and written, in this PR rather than a ticket of its own by her ruling — which found a bug that would have deleted them: a round trip read a cell’s paragraphs as inline runs, so a table survived being opened and vanished on save. Marker text keeps `| a | b |` literal; §13.2 makes it a MUST and the dialect is not Ship’s. `gates:status` reads UIG-18 **6 of 6** — its guessed evidence was wrong twice and is corrected here and in §15. Next: UIG-17. See **UIG-18: building it**, below.

**21 September 2026. UIG-35 is done: one part opens a picture full screen, for both apps — recorded here on 22 September, because it closed with no record at all.** 0.26.0 released and taken by both apps, all three merged and deployed the same day: estiva-ui PR #73 (merge `0866e64`, tag v0.26.0, npm latest 0.26.0), Peek PR #273 (`93a167c`), Ship PR #166 (`75de177`). **`Lightbox`** is a picture on a scrim on Base UI's `Dialog` — Escape, a focus trap, focus returned — which neither hand-built viewer had; **`AttachmentCard`** now fetches a file the reader needs permission for, opens it, and saves it, so the apps stopped keeping two copies of that job. A new token `--scrim-strong` (80%, all four themes): a picture dims harder than a dialog. **Peek** deleted `ui/FileAttachmentCard.tsx` and its `ImageLightbox` with it — the last overlay in Peek built by hand (P4, B22 closed). **Ship**'s `Attachment` is 91 lines from 181, and **Ship gained full-screen pictures, which it had never had**. `no-rebuilt-behaviour.ts` names `Lightbox` as an owner, so a hand-rolled viewer is a lint error from now on. **The ticket was missing from the status script entirely**, not merely unchecked; it is in it now and reads **8 of 8**, and the project counts 35 tickets rather than 34. See **UIG-35: building it**, below.

**19 September 2026, night. UIG-14 is done, and UIG-15 and UIG-16 close with it: 0.25.0 is released and in both apps.** estiva-ui PR #70 (0.24.1, merge `233c9cc`) and PR #71 (0.25.0, merge `b8b22be`), tagged and published; npm's latest is 0.25.0. Peek PR #264 (merge `5c4bb45`) and Ship PR #165 (merge `14bb501`) took it, merged and deployed. **Peek:** its five list columns are the package's `ListColumn` and its own wrapper is gone (a small context, `railClosed.ts`, passes on whether the rail is closed); its own `ErrorBoundary` is deleted, the package's in its place; Desk's "Urgent" is a `SectionHeader` (measured the same, 4px higher from the 2px spacing); every line between a menu's groups is a `MenuSeparator` — six in three menus, and two in the `/` menu, which took its room from an 8px gap (a fourth way, missed in round 8's count; measured 8px before, 4px after). One change not asked for: Peek's crash screen no longer passes `bg-bg-base`, because the gate refuses a colour passed into a package part; `body` paints the same token under it. **Ship** took 0.25.0 with nothing of its own to change: no list column, no crash catcher, and its one menu has no line. `gates:status` on the merged code reads UIG-14 **2 of 2**, UIG-15 **3 of 3**, UIG-16 **3 of 3**; 19 done. Next: UIG-17 and UIG-18. See **UIG-14: building it**, below.

**19 September 2026. UIG-14, with UIG-15 and UIG-16, is built: 0.24.0 is released and in both apps, and 0.24.1 finishes the three tickets (PR open, not merged).** Peek PR #263 and Ship PR #164 took 0.24.0 and every app fix Katerina ruled on, merged and deployed. Two more rounds on the review page — every point of UIG-15 and UIG-16, then the three tickets read again against the code — gave 28 more cards; she ruled on all of them. 0.24.1 carries them: F1–F3, seven parts that keep their height in a scrolling column, RailItem at a set 48px, a new part `ListColumn` (Peek's list column, moved in), and the page words: no app names, no credits, the numbers, the planned lines. Two new tickets: UIG-33 (a whole row that is one link) and UIG-34 (a tree part). **UIG-14: building it**, below.

**18 September 2026, late night. UIG-14 is being built, with UIG-15 and UIG-16 folded into it (Katerina): all 55 component pages keep one contract, and every fix it found in Peek and Ship is made in it.** Every page already had its opening line, When, When not and How; the new section is What it owns, read back against the checker by a test. Katerina ruled on 88 findings from a page of photos; the pages carry her lines. Three PRs: estiva-ui (branch `gates/14-usage-rules`), Peek and Ship (their own branches). None merged. **UIG-14: building it**, below.

**18 September 2026, late night. UIG-13 is done: released as 0.23.0 and taken by both apps.** estiva-ui PR #67 (merge `d480b3c`), tagged `v0.23.0` and published by the release job (run 35370213014); npm's latest is 0.23.0, and it carries UIG-10's relay work and PR #66 too. Peek PR #259 (merge `e962b96`) and Ship PR #163 (merge `427f558`) took it, merged and deployed. Katerina ruled on every one of the 21 parts the count offered, from photos and Storybook, and added four pieces of work to the ticket, all in this release: **A** — `ContainerHeader` is a package part, and Peek's six screens use it; **B** — `EmptyState` takes a button (outlined, 16px icons), and Peek's three empty states with a button beside them use it; **C** — `Banner` takes an icon and a button, and Peek's composer strip is a Banner in the `info` tone; **D** — what Peek no longer needs is gone: its own ContainerHeader and composer strip, `HighlightsCard`, `SkeletonHuddleGrid`, `SkeletonHuddleCard` and the `PeekLogo` wordmark, with their stories. **The count on the merged code:** Peek **138 parts in 117 files** (6 more hold none): 20 handed on, 50 reusable, 67 one-off, 0 candidates, 1 unused (`PeekApp`, which runs the app in Storybook). Ship **91 in 73** (1 more holds none): 41, 12, 38, 0, 0. The package **82**. Every part is described, and `estiva-ui check` refuses one that is not in each app's `gate` job — on its first run it passed `DmVisibilityProvider`, which Peek's main added the same day for hiding a DM. `gates:status` on the merged code reads UIG-13 **14 of 14**, 16 tickets done. Next: UIG-14. See **UIG-13: building it**, below.

**18 September 2026, night. UIG-13 is built: the catalogue covers Peek's and Ship's parts too, and `estiva-ui find` searches all three.** Every part an app's `.tsx` files export is listed with its one-line purpose, where the app uses it, what ties it to the app, and one of four kinds — handed on from the package, used in one place, used in several, a candidate to move into the package — or unused. **Peek: 143 parts in 125 files** (19 handed on, 46 reusable, 67 one-off, 7 candidates, 4 unused; 6 files hold none). **Ship: 91 in 74** (41, 10, 38, 2, 0; 1 holds none). Katerina ruled on 18 September: the apps' lists stay private — the package is public — so an app's catalogue is built from its code every time and never committed; a part with no one-line description cannot merge, Jan's included; Claude releases and merges; she picks the promote list from photos. 53 parts had no description and 15 had one that said nothing: all written, all read by hand. Two counters written separately agree on every part, use and tie; react-docgen agrees on the props; the apps build byte for byte as before. Four /code-review passes found 18 faults, all fixed and tested. See **UIG-13: building it**, below.

**18 September 2026, evening. UIG-10's relay half is built and merged (estiva-ui PR #65), to be released as 0.23.0 (0.22.0 went to UIG-12 that morning).** A made app now depends on `protocol`, `platform` and `interop`, has `VITE_RELAY_URL` empty by default, and holds the tab's one relay client in `src/relay/client.ts`, the way Peek and Ship hold theirs. It reads the sign-in on every connect, signs with the wrong-person check, reconnects when the network returns, and names the app in the relay's logs. There is no client without a relay or without sign-in. `KINDS` is exported and empty: the app's one blank. The home page shows the connection (three stories), and the made app's own test proves one socket however often the client is asked. A new shared check holds every app to one client and no socket of its own; it passes on Peek's and Ship's main today, and fails the broken controls. Commit zero is green in a clean container, and with no relay set the app says it runs alone and opens no socket. **Found by Katerina after it merged: the home page's empty state was not in the middle.** A box around it had pinned it 64px from the top since UIG-10's first page, and no gate reads a box around a part. It is fixed before the release, and measured centred both ways. **Not proved: connected and signed in.** On this machine no app can sign in at all (the local Estiva ID answers 500), and it allows no relay for the handshake; Katerina chose to prove the connection on Leaf instead. What Leaf needs from Jan is in UIG-11's line of "What is ready". See **UIG-10: building it**, "Reopened, 18 September: the relay half".

**18 September 2026, later. UIG-10 is reopened: a made app is not connected to the relay.** What UIG-10 built stays and works: `create-estiva-app` makes an app that runs, signs in and passes every gate on its first commit. But a made app gets two Estiva packages, `ui` and `identity`, and not `protocol`, `platform` or `interop`, so it talks to nothing, and whoever starts it wires the relay by hand. The ticket as first written (12 September) listed `protocol` and `interop` as dependencies. The 17 September rewrite changed that line to "they arrive when an app first uses them", and the acceptance criteria followed, so the ticket passed while its goal did not. Jan ruled all three baked in. Katerina ruled a boilerplate, `interop` included, the relay empty by default, and the home page showing the connection. She also ruled out a helper in `@estiva-app/platform`. The command writes the wiring into each new app and uses `platform` as it is, because ADR 0002 §10 says functionality lands in a real app first and is packaged afterwards. A helper only a new app calls would have one caller, and there would be three copies of the wiring instead of two. Peek and Ship already work and are not touched. It finishes as one pull request here. **Leaf (UIG-11) waits for that release, and is never made from 0.21.x**: the files that wire the relay are written once, and a later version would not reach them. The full scope is in the UIG-10 ticket.

**18 September 2026. UIG-12 is done: the package has a catalogue, `registry.json`, that a machine writes by reading the code.** One entry per exported name — what it is, what it is for in one line, **what it can do (all 374 props it declares, with what each takes and its own note)**, which behaviours it owns, where to look at it, and the line to import it with. It is **generated, never written**: `npm run registry` builds it and CI runs `npm run registry:check`, which rebuilds it and fails if the committed file is not what the code produces, so it cannot drift from what it describes. It ships in the package (§23) — `estiva-ui find "floating panel"`, the `./registry` export, and `registry.json` in the tarball — so an app can ask the question without a checkout of this repo. **The ticket's counts were from 12 September and were stale: 45 / 44 / 46 / 46 then, 81 / 52 / 54 / 54 now.** The whole difference is that **a file is not a component** — eleven files export more than one name, `Menu.tsx` alone exports seven — and it is reconciled name by name under **UIG-12: building it**, below. Nothing is unexported, undocumented or without a story. The 81 are **74 components, 6 helpers and 1 hook**, which is UIG-9's count of 74 parts reached a second way. **Ten things it found**, each now a test: 11 story ids resolved nowhere until the builder learnt Storybook's `startCase` (`--with-counts`, not `--withcounts`); "scrolling" found `Avatar`, because `person's` puts the word "s" in its text and every query starts with some letter; `SkeletonBar` was given its file's header paragraph, which describes the whole Skeleton family; two components' options were missed because of how they are written (`SectionLabel` inline, `TextInput` a `forwardRef`); **the catalogue first carried 33 of 336 props** — Katerina asked why not all of them, and she was right: the field list said `variants`, the ticket's own plain words say *what it can do*, and the narrow reading was built; and then, when a second parser was run against it, **13 props dropped for having quoted names** (`aria-label` and its kind, two of them required) and **`ToolbarButton` carrying one prop where it takes nine**, because it extends a type in another file. Then `/code-review high` on the branch found three more, each verified against the committed data before being fixed: an inherited prop was resolved with the **wrong file's text**, so `ToolbarButton` carried `variant: "ats over what it a"` — real names, prose for types, which is exactly why every name-based check had passed; `extends Omit<IdentityMenuProps, 'compact'>` was read as the name `Omit`, losing everything it wraps, so `IdentityPanel` was recorded without the `me` and `signedIn` it **requires**; and `estiva-ui find` pulled `typescript` into its own chunk, so it could not run in an app that has no TypeScript. **The two parsers now agree on all 74 components** bar four the registry means to exclude and twelve where it is right and `react-docgen` is not, all sixteen named in the test. **All 81 purpose lines have been read by hand.** **13 one-line comments were written**, for the names documented on a sibling's page. **`migrationStage` is carried and always null** — the migration's plan is not in this repo and not in CI, and a copy kept here by hand is the drifting list this project exists to remove. **Released as 0.22.0** (estiva-ui PR #63) **and taken by both apps** (peek PR #251, ship PR #162, merged and deployed), where `npx estiva-ui find` now answers from the catalogue inside the installed package. Next: **UIG-13**, which widens this registry to Peek's and Ship's components. See **UIG-12: building it**, below.

**17 September 2026, night. UIG-32 is done: Peek and Ship run on the package's gate pieces, and no gate text sits in two repos any more.** Each app deleted its editor hook, its count writer, its copy of the status engine, its "where the rules apply" file and its size-and-colour settings — **967 lines out of Peek, 957 out of Ship**, 135 and 118 in — and imports the package's instead (peek PR #245, ship PR #161, both on 0.21.1). Nothing moved: each app's `gates:status` reads the same, check by check (Peek 62 checks before and 64 after, Ship 58 and 59, the additions being the new "no copy is left" check and, in Peek, the debt list); neither `.gates-count.json` changed by a byte; and both apps' lint reads exactly as before (Peek 92 errors and 102 warnings, Ship 0 and 21). The size-and-colour settings were held to the package's, character for character, before they were deleted. A raw `<button>` is still refused in both by the editor hook and by CI. **Two things it found:** Peek never had a debt list — Ship has carried one since UIG-4, and Peek's own check list never asked for it; and the status engine could only find a checks file in a repo's top folder, while Ship's app and its install are in `web/`, so the engine, and estiva-ui's reading of a sibling, learned the `--app` the hook already knew (estiva-ui PR #58, released as 0.21.1). `gates:status` reads 13 of 13, and 14 tickets are done. Next: UIG-11. See **UIG-32: building it**, below.

**17 September 2026, evening. UIG-10 is done: `create-estiva-app` makes a new Estiva app from the package alone, with every gate on from its first commit.** Every gate piece now ships in `@estiva-app/ui/gates`: the token lint, the gate config, the count, the editor hook, the status engine, and the checks every app runs. estiva-ui runs on them itself, and its own copies are deleted. A made app has the sidebar frame, one theme, sign-in with Estiva ID, Storybook, tests, and the CI job `gate`. It was proved on a private throwaway repo. It was made in a clean container from the package alone, with no Peek or Ship. It was green on its first commit, and it signed in against the local Estiva ID. A raw button was refused by the editor hook, by CI, and by GitHub, admins included. The checks every app runs were held to Peek's and Ship's by a comparison test, not by eye: 81 the same, 20 inside a check that does more, 19 about an app's own code, 0 with nowhere to go. Released as 0.21.0 (estiva-ui PR #53, #54 and #55). Peek and Ship do not change until UIG-32. **UIG-6 cannot be checked on an app that has no GitHub repo yet**, and real sign-in for Leaf needs Jan (see UIG-10: building it, below). Next: UIG-11 and UIG-32.

**17 September 2026, later. Before UIG-10 is built, Katerina ruled: one copy, in the package (§23).** The rules were always package code, but the files that switch them on — the editor hook, the problem count, the status script and its checks, which folders are checked, the size-and-colour settings — were copied into each repo from UIG-3 on. **Every gate piece now ships in `@estiva-app/ui`, and the same gate text pasted into two repos is a defect.** The starter reads only the package, never Peek or Ship, which are private; they are only the yardstick in a comparison test. A new app uses the sidebar frame and one theme. UIG-10 was rewritten to match, and UIG-32 is new: Peek and Ship take the pieces from the package. Next: UIG-10.

**17 September 2026. UIG-9 is done, and with it phase 1, the wall: a third lint rule, `estiva/no-restyled-part`, lets an app only place a part of the package — space, size, flex and grid, position — and refuses a colour, a text size, a border, a corner or a shadow passed in through `className` or an inner box's class prop, naming the part's look props or saying it has none yet. `EmptyState` takes no padding at all. Parts are found by where they come from, never by name, so every part is covered, and a part added later too (Katerina asked; the rule was built for it). At her word it also runs inside the package, on its own parts. It found Peek 23, Ship 13 and the package 34: 46 look exactly the same after, 10 use six new props that draw what the classes drew, 4 are her picks from photos (Ship's link fields plain like Peek's, its loading block with a bar's corners), and 10 keep a written reason. Released as 0.20.0 (estiva-ui PR #51); peek PR #237 and ship PR #160, merged and deployed. **A look-alike built from plain boxes passes nothing into a part, and this rule cannot see it** — UIG-25's copied part, still only a warning — see UIG-9: building it, below. Next: phase 2, UIG-10.**

**16 September 2026, late night. UIG-8 is done: a second lint rule, `estiva/no-rebuilt-behaviour`, refuses behaviour a package part already owns when an app writes it by hand — a Base UI import, a portal, a click or key listener on the whole page, arrow keys, a hand-written role, a Tab stop on a box, a scrolling box — and names the part. The list of behaviours comes from Base UI's own source and the parts each component imports (`OWNED_BEHAVIOURS`). It found 15 in Peek and 4 in Ship: Peek 2 fixed and 13 kept with reasons, Ship 3 fixed and 1 kept. Katerina picked from photos: Add to Open work's rows became the package `Checkbox`'s new row form, pixel for pixel; Ship's code blocks wrap, like Peek's; the package's scrollbar now sits above sticky rows. Both apps' gates read `.ts` too. Released as 0.19.0 (estiva-ui PR #49); peek PR #236 and ship PR #159, merged and deployed. **It cannot find a box that should scroll and does not** — see UIG-8: building it, below. UIG-31 is new: one shared part for the / @ [ menus, much later.**

**16 September 2026, night. UIG-7 is done: one lint rule, `estiva/no-raw-element`, refuses every raw interactive element in Peek and Ship and names the part to use — `Link`, `TextInput`, `Form`, `FilePicker`… — or, for an element the package has no part for yet, says to ask Katerina. It found 3 in Peek and 6 in Ship: all 9 replaced, none escaped. The package gained `Form`, `FilePicker`, `Checkbox`'s `label` and hover on the text fields (0.17.0, estiva-ui PR #45), and every form in both apps, the command palette's included, is the package `Form` with the same keys everywhere (0.18.0, estiva-ui PR #47; peek PR #234, ship PR #158, merged and deployed). See UIG-7: building it, below.**

**16 September 2026, evening. UIG-29 is built: Peek's launcher sits on a new package component, `CommandPalette` — Base UI's `Dialog` with an `Autocomplete` inside, the list inline — released as `@estiva-app/ui` 0.16.0 and 0.16.1 (estiva-ui PR #43, #44), taken by Peek in peek PR #233, merged and deployed. The move and a UX review happened together: every key does what Katerina ruled, checked key by key in Chrome, and she tried it on real data before it merged. Every count UIG-1 made in the file is replaced and none escaped; the 60 token escapes and 29 escape notes naming UIG-29 went with the old file. Two parts of ruling C5 are not built: a chip in the composer for a created issue, and a "created an issue" line in the thread. See UIG-29: building it, below.**

**16 September 2026, later again. UIG-6 is done: GitHub refuses a merge into `main` in all three repos unless the gate lint passes, and nobody can skip it, admins included. The gate is a CI job of its own, `gate`, because GitHub can require only a whole job (estiva-ui PR #40, peek PR #227, ship PR #155). Katerina set the rule in estiva-ui; Jan set it in Peek and Ship, where only he is admin. Proved in each repo: a pull request with one raw `<button>` was refused — "Required status check "gate" is failing" — and the three pull requests above merged under the rule, with Peek and Ship deploying after. Nothing was required before, and the typechecks and tests stay optional. `gates:status` reads 6 of 6 now that it reads rules the way anyone may (estiva-ui PR #42, peek PR #230, ship PR #157). Next: UIG-7. See UIG-6: building it, below.**

**16 September 2026, later still. UIG-5 is done: the package now runs the same chain on itself, with four rules of its own — a raw element buried inside a component, behaviour Base UI owns written by hand, a component with no page, a component with no story. The two it found are fixed, not escaped: a crumb is the package's `Link` and a toast's action is its `Button` (Katerina, from the two side by side). Nothing is escaped anywhere, `docs/GATES-DEBT.md` is empty, and `gates:status` reads 12 of 12. The apps are untouched: the inward rules live in a config of their own. Next: UIG-6, branch protection — read what UIG-4 found about it first. See UIG-5: building it, below.**

**16 September 2026, later. UIG-4 is done: a raw `<button>` is refused in Ship too, by the same rule — in the editor for a session started in Ship's top folder, in `npm --prefix web run lint:rules` and in CI. Ship had none, so the proof was a scratch commit, then dropped. ship PR #154, merged and deployed, on 0.15.0. Next: UIG-5, the same chain inside estiva-ui. See UIG-4: building it, below.**

**16 September 2026. UIG-3 is done: a raw `<button>` is refused in Peek by the package's first lint rule, in the editor, in `npm run lint:rules` and in CI. The plugin was released as `@estiva-app/ui` 0.15.0 (estiva-ui PR #36); Peek took it in peek PR #225, deployed. Next: UIG-4, the same chain in Ship. See UIG-3: building it, below.**

**15 September 2026. UIG-27 and UIG-28 are done. UIG-28's package part was released with migration stage 6 as `@estiva-app/ui` 0.14.0 (estiva-ui PR #34); its app part is peek PR #222 and ship PR #153. Next: phase 1, from UIG-3. UIG-30 is new.**

> **What UIG-27's app half did, and what it found**, is part 5 of **UIG-27: adopting it in Peek and Ship** below. The step-by-step handoff it followed stays above that, for the record.

| | |
|---|---|
| ✅ **UIG-1** | Done. Merged in estiva-ui PR #21. |
| ✅ **UIG-2** | Done. Merged in estiva-ui PR #24, #25 and #27, peek PR #204, ship PR #148. |
| ✅ **UIG-27** | Package half: estiva-ui PR #29 (0.13.0), PR #32 (0.13.1: `Card`'s `hovered`). App half: peek PR #218, ship PR #151 — both apps on 0.13.1, every link, chip, progress bar, card and attachment the package's, the code they replaced deleted, and no empty state padded. All 20 links fitted, none reasoned. `gates:status` reads Peek's part 6 of 6 and Ship's 5 of 5. |
| ✅ **UIG-28** | Package part: estiva-ui PR #34, released with stage 6 as 0.14.0. App part: peek PR #222, ship PR #153. The token lint stops hand-written type, corners, shadows and inline colours in all three repos and warns on hand-written heights and spacing; every error fixed or escaped with its reason. `gates:status` reads 23 of 23. See **UIG-28: building it**, below. |
| ✅ **UIG-3** | Package part: estiva-ui PR #36, released as 0.15.0 — `@estiva-app/ui/eslint`, `no-raw-button`, the escape marker, `countGates`, and `InputChip`'s `removeLabel` and `truncate`. Peek part: peek PR #225, deployed — the gate lint, its CI step, `.gates-count.json`, the editor hook. 16 raw buttons = 8 replaced + 7 gone with the Signal Theme page + 1 escaped. `gates:status` reads 11 of 11. See **UIG-3: building it**, below. |
| ✅ **UIG-4** | ship PR #154, on 0.15.0: the gate lint in `web/`, its CI step, `web/.gates-count.json`, the editor hook in Ship's top folder, the `CLAUDE.md` paragraph, and `docs/GATES-DEBT.md`, the first debt list (nothing owed). 0 raw buttons = 0 replaced + 0 escaped. `gates:status` reads 9 of 9. See **UIG-4: building it**, below. |
| ✅ **UIG-5** | estiva-ui PR #39: the package's own chain, with four inward rules in a config of its own (`configs.package`): a raw element buried inside a component, behaviour Base UI owns written by hand, a component with no page, a component with no story. 2 found, both fixed, 0 escaped. `gates:status` reads 12 of 12. See **UIG-5: building it**, below. |
| ✅ **UIG-6** | A ruleset, "gate on main", in each repo: a merge or push into `main` needs `gate` green, from GitHub Actions; nobody on the bypass list; `main` cannot be deleted or force-pushed. The gate lint is a CI job of its own, `gate`: estiva-ui PR #40, peek PR #227, ship PR #155. `gates:status` reads rulesets: estiva-ui PR #42, peek PR #230, ship PR #157. Refused 3 of 3, clean merges 3 of 3, deploys 2 of 2. `gates:status` reads 6 of 6. See **UIG-6: building it**, below. |
| ✅ **UIG-29** | Package: estiva-ui PR #43 (0.16.0, `CommandPalette` and its parts) and PR #44 (0.16.1, `notes`, and the late-row rule narrowed). Peek: peek PR #233 — the launcher on the palette, with Katerina's UX rulings, recents, and a message result opening at the message. UIG-1's count for the file: every row replaced, 0 escaped. `gates:status` reads Peek's part 2 of 2. Not built: C5's composer chip and thread line. See **UIG-29: building it**, below. |
| ✅ **UIG-7** | Package: estiva-ui PR #45 (0.17.0 — the rule `no-raw-element`, `Form`, `FilePicker`, `Checkbox`'s `label`, hover on text fields) and PR #47 (0.18.0 — `Form`'s keys, `CommandPaletteForm` on `Form`). Peek: peek PR #234. Ship: ship PR #158. Peek 3 = 3 replaced + 0 escaped; Ship 6 = 6 + 0; every form in both apps on `Form`. `gates:status` reads 18 of 18. See **UIG-7: building it**, below. |
| ✅ **UIG-8** | Package: estiva-ui PR #49 (0.19.0 — the rule `no-rebuilt-behaviour` and `OWNED_BEHAVIOURS`, `Checkbox` `row`, `ScrollArea`'s bar above sticky rows). Peek: peek PR #236. Ship: ship PR #159. Peek 15 = 2 fixed + 13 escaped; Ship 4 = 3 fixed + 1 escaped; both gates read `.ts`. `gates:status` reads 23 of 23. See **UIG-8: building it**, below. |
| ✅ **UIG-9** | Package: estiva-ui PR #51 (0.20.0 — the rule `no-restyled-part` for the apps and inward, `PART_LOOK_PROPS` and `PLACEMENT`; `IconButton` `current`, `resolve`, `pressed`, `glow`; `Button` `resolve`; `Card` `clip`; `SectionLabel` `tone`; `Link` `truncate`; the package's own 34 places). Peek: peek PR #237. Ship: ship PR #160. Peek 23 = 16 fixed + 5 new props + 2 escaped; Ship 13 = 7 fixed + 4 picked + 2 escaped; estiva-ui 34 = 23 + 5 + 6. `gates:status` reads 21 of 21. See **UIG-9: building it**, below. |
| 🚧 **UIG-10** | **Reopened 18 September (§0): a made app is not connected to the relay.** The relay half: estiva-ui PR #65, merged, released in 0.23.0: three packages, the relay client, one client per tab held by a shared check; connected-and-signed-in is proved on Leaf. Built before: estiva-ui PR #53 (§23, the ruling), PR #54 (0.21.0: `@estiva-app/ui/gates`, the commands `estiva-gates` and `create-estiva-app`, `gates:compare`) and PR #55 (`npm test` builds first, so the release could run). estiva-ui on its own pieces, its copies deleted. A made app is green on its first commit, signs in, and is refused a raw button by the hook, CI and GitHub. `gates:compare`: 81 + 20 + 19, 0 unplaced. `gates:status` reads 4 of 4. See **UIG-10: building it**, below. |
| ✅ **UIG-32** | estiva-ui PR #58 (0.21.1: `estiva-gates status --app`, a sibling read from its app's folder, and the shared check widened), peek PR #245 (967 lines out, 135 in) and ship PR #161 (957 out, 118 in). Every gate piece in both apps is one import now; Ship's checks file moved to `web/scripts/`, where the package resolves. Peek gained the debt list it never had. `gates:status` reads 13 of 13. See **UIG-32: building it**, below. |
| ✅ **UIG-13** | estiva-ui PR #67 (merge `d480b3c`), released as **0.23.0** with UIG-10's relay work and PR #66; peek PR #259 and ship PR #163 took it, merged and deployed. The app's catalogue (`buildAppRegistry`, schema 2), `estiva-ui find` over the package and every app beside it, `estiva-ui check` in each app's job `gate`, and a made app wired the same. Katerina's A to D: `ContainerHeader` in the package; `EmptyState` and `Banner` with a button, used by Peek; six parts Peek no longer needs removed. Peek 138 parts, Ship 91, the package 82, each described and sorted. `gates:status` reads 14 of 14. See **UIG-13: building it**, below. |
| ✅ **UIG-12** | estiva-ui PR #61 (merge `bbd4ecd`), released as **0.22.0** (PR #63); peek PR #251 and ship PR #162 took it, merged and deployed: `registry.json` (81 entries, **374 props**, schema 1), the builder and the schema in `src/registry/`, `estiva-ui find` as a bin of the package, and `registry:check` in CI. 81 names over 53 files = 74 components + 6 helpers + 1 hook; 53 take their line from their own page, 28 from the comment above them. Every docs and story id was checked against a real `storybook build`. `gates:status` reads 7 of 7. See **UIG-12: building it**, below. |
| ✅ **UIG-14** | With UIG-15 and UIG-16 (Katerina, 18 September). estiva-ui PR #69 (0.24.0), PR #70 (0.24.1) and PR #71 (0.25.0); peek PR #263 and #264, ship PR #164 and #165, all merged and deployed. Every page keeps one contract (table R, 57 pages); every fix she ruled on is made; three new parts — `ListColumn`, `ErrorBoundary`, `MenuSeparator` — are in the package and in use. `gates:status` 2 of 2. See **UIG-14: building it**, below. |
| ✅ **UIG-15** | Folded into UIG-14, closed with it. Every point done in 0.24.1: the numbers on the frame pages, the parts sized by where they sit, the heights, the eight Folders mistakes walked one by one. `gates:status` 3 of 3. |
| ✅ **UIG-16** | Folded into UIG-14, closed with it. Table R (57 pages at 0.25.0), the four numbers explained, the rule on exports that are not parts. `gates:status` 3 of 3. |
| ⬜ **UIG-30** | New, 13 September: `RichText`. Runs after UIG-27. All three repos' `gates-checks.mjs` now list it. |
| ⬜ **UIG-31** | New, 16 September: one shared part for the / @ !@ [ menus, which UIG-8 kept with reasons. "Much later" (Katerina): not before a second app needs an @ or / menu. Listed in estiva-ui's and Peek's `gates-checks.mjs`. |
| ⬜ **UIG-33** | New, 19 September: a whole row that is one link (UIG-14, finding C10). |
| ⬜ **UIG-34** | New, 19 September: a tree part on Base UI, for Peek's file tree and folder list (UIG-14, finding L). |
| 🚧 **UIG-37** | New, 23 September: the gates refused TypeScript's own `eslint-disable` comments (Peek PR #324). `gateConfig` knows TypeScript's names, `tokenConfig()` is new, a made app uses both; every app's `gates:status` checks it (§0). |

### What happened since UIG-2 closed

| | what | now |
|---|---|---|
| ✅ | **The flaky Peek test is fixed** (peek PR #205, merged and deployed). §22 blamed `0.12.8`; that was wrong. Focusing a Base UI Select's trigger mounts its list at once, closed: `hidden` and `pointer-events: none`. A mouse press opens it one animation frame later. The tests found an option by its text inside the closed list and clicked before that frame. It failed the same way on `0.12.3`, on 12 September. Slowing every frame by 100 ms found **9 tests in 4 files** in Peek, **0** in Ship and estiva-ui. They now find the option by its role, which waits for the open list. | closed |
| ✅ | **UIG-27 overlapped the migration plan.** PLAN §9 (stage 7) already held `Card`, with a link variant, and `ProgressBar`; the migration's D67 was building the inline chip in Peek. Katerina ruled: Card, rows, ProgressBar and EmptyState's padding are UIG-27's. The chip was D67's, and moves into the package here. The foreign-object card's inside layout (D66) stays with stage 7. The migration docs say the same. | ruled 13 September |
| ✅ | **UIG-30 created**: the half of Peek's `MessageBody` and Ship's `RichText` that draws the protocol's text tree becomes one package component, `RichText`. What a mention points at stays in each app. It goes against a written line in the protocol package ("one parse, one resolution, two designs"), so Jan is told before its PR. | created |

### Start here

1. Read this section.
2. Run `npm run gates:status` in estiva-ui. It reads every ticket from the code, in all three repos. §17 says how.
3. Read the ticket in Ship, in full.

On 15 September, with peek PR #222 and ship PR #153 merged (run with `GATES_PEEK` and `GATES_SHIP` pointing at checkouts of the new mains, since the main checkouts lag), it printed:

```
✅  UIG-27  The components the apps had to build themselves — Link, ProgressBar, EmptyState padding  estiva-ui 17 of 17
✅  UIG-28  Close the two holes in the token contract — arbitrary values, and inline style           estiva-ui 23 of 23
⬜  UIG-30  RichText — one component that draws a message's text, for both apps                      estiva-ui 0 of 3
✅ 4 done · 🚧 0 started · ⬜ 26 not started · ❔ 0 could not check
30 tickets. Owned by estiva-ui 25, peek 3, ship 2.
✅ Each ticket is owned by exactly one repo, and every repo agrees.
```

UIG-28's 23 checks: 7 in the package and 8 in each app (§15). UIG-27's 17 checks: 6 in the package, 6 in Peek (the two packages it needs installed, the hand-made bar gone, `inlineChip.ts` and `PendingAttachmentChip.tsx` gone, a posted file drawing `AttachmentCard`), 5 in Ship (the two installed, its bar's file gone, mentions on `InlineChip`, files on `AttachmentCard`). UIG-30's 3 are one per repo, all "not yet".

### UIG-27: Katerina's rulings, 13 September

1. The text links become a new **`Link`**. Cards and rows use the same Link with no look of its own (`plain`), and `Card` is built on it in this ticket.
2. Link has four looks. Link A (in text) is **`text`**. Links B and C, which differed only in their text, become one look, **`quiet`**. Links D and E, a dotted and a solid underline doing the same job, become one solid look, **`underlined`**.
3. Peek's chip moves into the package unchanged, as **`InlineChip`**, before Link. Its tone `mention` is renamed **`person`**. A chip that leads somewhere takes `href` and `onClick`, like `NavItem`.
4. Only the drawing part of rich text moves, and in its own ticket (UIG-30).

And on 14 September:

5. **ProgressBar's `quiet` look is 4px** (the `h-1` token). Peek's own bar is 3px until it takes the package's.
6. **EmptyState gets no padding prop.** A section's empty state goes inside the box its rows live in, and is never padded: the box is written once and holds the rows or the empty state, so its padding places both. 15 of the 17 callers that pad one today draw it *instead of* that box and copy its padding by hand. A lint rule refuses padding on `EmptyState` (UIG-9, or UIG-23) and names the rule. How much room an empty *page section* takes in Ship (`py-6`, `py-8`, `py-10`) is a separate ruling, taken when those callers are fixed.
7. **The cards are the 18 in the next table**, sorted by Katerina from photographs (`uig27-cards.png`, 38 bordered, rounded boxes in the two apps). A box is a card when it stands for one thing you could name, and there are many of it or you treat the whole box as that thing.
8. **Ship's files become the same card as Peek's.** Ship draws a file as a 28px line; Peek as a 50px card with a file-type tile, the name over the type and size.
9. **Card draws the frame only**, with four fills chosen by what it sits on — `surface`, `elevated`, `inset`, `none` — and no padding of its own.
10. **The hairline follows the fill** (default on `surface` and `elevated`, subtle on `inset` and `none`), and **every card has 8px corners**. Ship's board card moves from 6px.
11. **A clickable card's hairline goes one step stronger on hover**; Peek's conversation, reply and huddle cards keep lighting up. (Correction to the question as asked: the conversation and reply cards also have no hairline until pointed at. That is kept, as `quietUntilHover`, as part of lighting up.)
12. **A card that cannot be read has a dashed hairline**, in both apps.
13. **`AttachmentCard` joins the package in this same PR**, so the apps take one release. It is Peek's two attachment components moved in: the package draws; each app keeps what only it can do (fetching the bytes with the reader's permission, opening an image full screen, saving a file). Peek's `PendingAttachmentChip` has nothing of that and disappears; its `FileAttachmentCard` shrinks to that fetch-and-click part.
14. **Ship's images stay as they are** (the whole picture, in a 4px frame) until the package has a full-screen viewer (the migration's Lightbox, stage 7). Ship's files and its can't-load state become `AttachmentCard`.
15. **The adoption is full**: Peek and Ship adopt `Link`, `InlineChip`, `Card`, `ProgressBar` and `AttachmentCard` completely, and the code they replace is deleted.
16. **The ✕ on a waiting file is a button on Base UI's `Button`, like InputChip's ✕**, keeping Peek's 20px round badge. Not `IconButton`: its 24px square that fills on hover is a different control. The picture's preview button went on Base UI's `Button` too.
17. **Storybook has a Components group, right below Inputs**: `AttachmentCard`, `InlineChip`, `Person`, `PersonTrigger`, `Reaction`, `ReactionPicker`. No rule is written for what goes there; ask Katerina where a new component goes.
18. **An attachment card's name shows in full on hover only when it is cut off**, on every card, posted as well as waiting. A name that fits, and a size, show no tooltip ("i dont want tooltips on titles and size. only if title is too long"). Peek's posted cards had no way to read a cut-off name; its waiting card showed the name and the size on every hover. Measured like Breadcrumb's crumbs. Screenshots of every story are identical pixel for pixel before and after 16 and 18, but for 3 pixels: Peek clipped the last letter of the warning's note, and the package draws it whole.

And during the app half, 14 and 15 September:

19. **Peek's two router links are the package's `Link`**, followed through the router in `onClick` as `NavItem` does (Peek's `RouterLink`), not react-router's `Link` kept with a reason.
20. **Ship's empty sections lose their own room** (`py-6`, `py-8`, `py-10` on Conversations, Activity, History, the project's Issues and the new-issue dialog): the line sits where a first row would.
21. **An empty line in a list whose rows pad themselves stays level with the rows** ("keep them level"): Starred, the file tree and a project's tickets. The row's inset goes on a wrapper, never on `EmptyState`.
22. **Ship's files open in a new tab and download, like Peek's**, fetched the way an image is — so a file is read when it is drawn, once, and cached. As its own commit in Ship's PR.
23. **`Card` holds its hover look while its own menu is open, as 0.13.1, in UIG-27** (not in the migration's stage 6): `hovered`, and a selected clickable card keeps its pointer.
24. **A selected huddle has the conversation card's softer hairline.**

### UIG-27: the cards, sorted

| | Peek | Ship |
|---|---|---|
| a conversation, a reply, a huddle | `ConversationCard.tsx:487` · `ThreadReplyCard.tsx:415` · `HuddleCard.tsx:127` | `ConversationThread.tsx:543` |
| a project | `TopicDetailsDialog.tsx:254` · `TopicProjectPanel.tsx:238` — the same project, drawn two ways | `ProjectCard.tsx:58` |
| an issue | | `Board.tsx:26` |
| a file | `ui/FileAttachmentCard.tsx:216` · `:246` · `:291` · `ui/PendingAttachmentChip.tsx:87` | `ui/Attachment.tsx:45` · `:88` |
| an object from another app | `ui/ForeignObjectWidget.tsx:385` · `:607` | `ui/ForeignObject.tsx:89` · `:212` |
| **total** | **11** | **7** — **18** |

Three of them are a card that **cannot be read** (`ForeignObjectWidget.tsx:607`, `ForeignObject.tsx:89`, `Attachment.tsx:45`): a state of the card, not an empty state — the package's EmptyState page says an empty state never stands in for a failure. Peek drew that state with a solid hairline and caption text, Ship with a dashed border and body text. Ruled since: dashed, in both apps (ruling 12).

Not cards: 6 fields (the compose box, the edit boxes, a text input), 3 panels (the launcher, a board column, the issues table's frame), 2 chips or buttons, 4 loading placeholders, 1 notice, 4 others (a hand-made tick box, a picture's frame, an unknown editor block, and the pinned message — a preview, not clickable).

### UIG-27: the links, recounted

Counted by AST on 13 September, Peek `main` `ada8c91`, Ship `main` `21ec2a8`, tests excluded.

| job | Peek | Ship | total |
|---|---|---|---|
| 🔗 text link | 5 | 2 | 7 |
| 🃏 a whole card or row | 2 | 4 | 6 |
| 💊 a chip | 2 | 3 | 5 |
| **raw `<a>`** | **9** | **9** | **18** |
| through Peek's router `Link`, the quiet look | 2 | 0 | **2** |

UIG-1 counted 14 raw `<a>`. RIC-16 (13 September) added the 4 in `Reference.tsx`, 2 per app. The 2 router links in `ConversationCard.tsx` and `ThreadPanel.tsx` were never raw anchors, so no count saw them. **The arithmetic, 15 September: fitted 20 + reasoned 0 = 20.** Re-counted by AST on the adoption branches (Peek at `f4079b0`, Ship at `58732d4`): no raw `<a>` and no router `Link` left in either app's source.

| app | fitted | as |
|---|---|---|
| Peek | 11 | `Link` `text` (a body's link) · `quiet` ×3 (a reply's timestamp, two titles) · `underlined` ("Open in app ↗") · `plain` (a ticket row) · inside `AttachmentCard` (the file row) · `InlineChip` with `href` ×2 · `RouterLink` ×2 (the package `Link` followed through the router, ruling 19) |
| Ship | 9 | `Card` with `href` ×3 (a board card, a project card, an object) · `Link` `plain` ×2 (an issue row, its project chip) · `quiet` (a table title) · `underlined` ("Open it there") · `InlineChip` with `href` ×2 |

Every Ship link keeps `linkTo`, and both of Peek's router links keep the router: proved with the window marker (a bare anchor, the control, loses it; every changed link keeps it). A story's `#/…` address never reloads, so each was pointed at a real path before the click.

### UIG-27: what building it found

| | finding | where it goes |
|---|---|---|
| ✅ | **Peek's quiet chip is 16.8px, not 19.6px**: `1.4em` of its caption size, with its letters 1.81px above the sentence's baseline. D67 ruled every chip 19.6px. The package's is 19.6px, 0.41px off. | Peek is fixed when it takes `InlineChip` |
| ⚠️ | **`InlineChip` needs `h-[1.4em]`, and `h-[19.6px]` for the quiet tone.** No token names one line of body text. UIG-28 plans `h-[240px]` as a warning. | UIG-28: allow these two, or add a line-height token |
| ✅ | Ship's mention chip does not move when it takes `InlineChip`: its status icon comes after the words, and the drift D67 measured needs an icon first. | measured 13 September |
| ✅ | Two stories carry a color-contrast exception, computed and not run: the person chip in ship (2.70:1, the brand `Chip`'s number) and the quiet chip in signal (3.25:1). | PLAN stage 0.10 |

### ▶️ Next

| when | what |
|---|---|
| ✅ done | UIG-27: estiva-ui PR #29 (0.13.0) and #32 (0.13.1); peek PR #218 and ship PR #151 adopt it fully |
| ✅ done | UIG-28: estiva-ui PR #34 (0.14.0, with stage 6); peek PR #222 and ship PR #153 (**UIG-28: building it**, below) |
| ✅ done | UIG-3: estiva-ui PR #36 (0.15.0); peek PR #225 (**UIG-3: building it**, below) |
| ✅ done | UIG-4: ship PR #154 (**UIG-4: building it**, below) |
| ✅ done | UIG-5: estiva-ui PR #39 (**UIG-5: building it**, below) |
| ✅ done | UIG-6: estiva-ui PR #40 and #42, peek PR #227 and #230, ship PR #155 and #157, and a ruleset in each repo (**UIG-6: building it**, below) |
| ✅ done | UIG-29: estiva-ui PR #43 (0.16.0) and #44 (0.16.1); peek PR #233 (**UIG-29: building it**, below) |
| ✅ done | UIG-7: estiva-ui PR #45 (0.17.0) and #47 (0.18.0); peek PR #234 and ship PR #158 (**UIG-7: building it**, below) |
| ✅ done | UIG-8: estiva-ui PR #49 (0.19.0); peek PR #236 and ship PR #159 (**UIG-8: building it**, below) |
| ✅ done | UIG-9: estiva-ui PR #51 (0.20.0); peek PR #237 and ship PR #160 (**UIG-9: building it**, below). Phase 1 is done |
| 🚧 reopened | UIG-10: estiva-ui PR #53, #54 and #55 (0.21.0) built the command (**UIG-10: building it**, below). Reopened 18 September: a made app is not connected to the relay (§0) |
| ✅ done | UIG-32: estiva-ui PR #58 (0.21.1); peek PR #245 and ship PR #161 (**UIG-32: building it**, below) |
| ✅ done | UIG-12: estiva-ui PR #61 and PR #63 (0.22.0); peek PR #251 and ship PR #162 — the catalogue, taken ahead of UIG-11 because three later tickets read it (**UIG-12: building it**, below). Phase 3 starts |
| ✅ done | UIG-13: estiva-ui PR #67 (0.23.0, with UIG-10's relay work and PR #66); peek PR #259 and ship PR #163 — the apps' catalogues, and Katerina's A to D (**UIG-13: building it**, below) |
| ✅ done | UIG-14, with UIG-15 and UIG-16: estiva-ui PR #69 (0.24.0), #70 (0.24.1) and #71 (0.25.0); peek PR #263 and #264, ship PR #164 and #165 (**UIG-14: building it**, below) |
| ✅ done | UIG-35: estiva-ui PR #73 (0.26.0); peek PR #273 and ship PR #166 — `Lightbox`, and the attachment card that fetches, opens and saves by itself (**UIG-35: building it**, below). Recorded a day late, 22 September |
| ✅ done | UIG-18: ship PR #170 (merge `643823e`) — fourteen usage pages, five new stories, tables, and the seven Ship/Peek pairs (**UIG-18: building it**, below) |
| ✅ done | UIG-17: peek PR #307 (merge `f13834f`) and estiva-ui PR #75 — every reusable part of Peek has a usage page, and its Storybook follows her six rules |
| ✅ done | UIG-36: estiva-id PR #67 (merge `1ece1f3`) and peek PR #314 (merge `1654fa0`) — Estiva ID's own Storybook on :6009, Peek's shows Peek only, and three CSS gaps it uncovered fixed (§0) |
| ✅ done | UIG-19: estiva-ui PR #77 (0.27.0) and this record's PR (the gate job runs the contract); peek PR #321, ship PR #174. The usage-page contract, the story links and what a story never shows, all in `estiva-ui check`, proved to block a merge in each repo (§0). **UIG-11** (Leaf) takes it when it exists |
| 🚧 review | UIG-37: `gateConfig` knows TypeScript's names and `tokenConfig()` is new (0.28.0), then peek and ship take it (§0) |
| **now** | UIG-20: the skill that runs `estiva-ui find` unasked, in any repo, across every Storybook — Katerina's condition for dropping the shared Storybook, written on the ticket as a test |

UIG-27 blocks UIG-7 and UIG-8. UIG-28 blocks nothing, but it fixes a hole in the token lint that phase 1 sits on, so do it first. The reference number is not the order.

### UIG-18: building it

**What it is.** Every part of Ship worth reusing now carries a written rule
beside it, and the four that were drawn nowhere have a story. Ship PR #170,
merged `643823e` on 22 September. Katerina reviewed all of it from photos
before anything was written: https://claude.ai/artifact/4fqpPcBaP5LWKk6RkqD5mC

**The ticket's numbers were eleven days old.** It said *74 components and only
18 stories*. Measured on `origin/main 4bffd58`, the catalogue UIG-13 built
reads **91 parts in 73 files** (one more file holds none): **40 re-export + 12
reusable + 39 one-off + 0 promote-candidate = 91**. A file is not a part —
`ConversationThread.tsx` alone exports `Conversations` and `ConversationThread`
— which is the same reconciliation UIG-12 had to make for the package. The
target set is **12**, not 74.

**Stories, before and after.** 20 story files and 105 stories before, 25 and
126 after; parts linked to a story, 18 before and 23 after. Four stories are
new, for the four parts nothing drew: `ForeignObject` (six states and no
picture of its own), `RichText` (the block vocabulary), `ConversationCount`
(the zero rule is invisible and the unit changes what the number means) and
`BlockAnchorNote` — which **no story in Ship drew at all**, because no fixture
carries an anchor, so its two failure sentences, whose whole job is to be told
apart, had never been read side by side. A fifth file came out of her review:
`ConversationThread` took its own four stories, and the file that held them was
left to `Conversations` — 20 files and 105 stories became 25 and 126.

Three of the twelve carry a **"Seen in"** list instead of a story of their own —
`Attachment`, `Description`, `NewIssueDialog` — and so does `DescriptionEditor`,
the one-off she kept in. Katerina's rule of 21 September: a story that repeats
one you already have is not worth writing; show how the app uses it instead.
`ConversationThread` was a fourth until her review asked for its own stories.

**Ship's own list of what has no story is reconciled, not replaced.**
`COMPONENTS-SHIP.md` F12 has carried a list of eight *files* since the recount
of 13 September: the five pages, `AuthShell`, `DescriptionEditing` and
`editorSchema`. Seven of the eight are **one-offs** in the catalogue, which puts
them outside this ticket's target set, and all seven still have no story. The
eighth, `editorSchema`, **is not a part at all** — it is the editor's node
schema, and the catalogue holds no entry for it. That is the whole
reconciliation: the old list counted files, the catalogue counts parts, and they
differ by exactly that one. Across all of Ship, 51 of the 73 files that hold a
part still have no story — 30 of them hold only re-exports, whose story is the
package's page; 19 hold one-offs; and three hold a reusable part, the three with
a "Seen in". **F12 stays open**, unclaimed by UIG-18. What is left of it is one
question, and it is UIG-19's: a page has no story of its own, and neither does a
dialog drawn inside another story — does the count call either of them covered?

**Fourteen pages, not twelve.** `DescriptionEditor` and `BlockAnchorNote` are
one-offs by the catalogue — each used in exactly one place — and the ticket
named them as must-do anyway. Katerina ruled them out, then asked what they
were: *"if you explain to me what DescriptionEditor and BlockAnchorNote are,
and why we may need them in storybook, i could change my mind."* The answer was
that their rules live nowhere — blur commits and Enter makes a paragraph; a
detached anchor and an unaddressable one mean opposite things — so she took
`BlockAnchorNote` back in with a story, and `DescriptionEditor` with a page
only, its picture being one click inside `ProjectHeader`'s stories. **Used once
and invisible are different problems, and the catalogue only answers the
first.**

Each page keeps the package's own contract, not a new one: a line saying what
the part is, then **When**, **When not**, **How** with code, **What it owns**.
Storybook reads them from beside their components — one line in
`web/.storybook/main.ts`, which Katerina asked for directly (*"Yes we need docs
page for the components"*).

#### Her design review, and the six things it changed

She read every page and story and came back with eight points. Three were
questions the code answered — `ForeignObject` *is* built like `ProjectCard`
(the same `Card`, `p-3`, title row and meta line); the app chip *is* the
package's, through Ship's one-line re-export; and it holds no arbitrary
values. The other five were right, and one of them was a bug.

1. **A foreign status had the wrong icon** — finding 1 above, which she saw
   independently. Fixed rather than filed: `StatusLabel` takes a `colour`, and
   `ForeignObject` and `Reference` pass the one the manifest declared. The
   crossing is colour → shape because it is the only one there is: the
   projection replaces the raw value with the label, and `stage` never reaches
   a consumer at all. The story fixtures now carry what the relay sends.
2. **The conversation count floated above the app chip.** Measured: the title
   19.6px, the chip 20, the count 14.4, the row `items-start`. Count and chip
   are a centred group now — both centres at 424.2. `Related` is the same fix,
   its rows being `ForeignObject`.
3. **The rule above a card's children is gone.** The card's own edge already
   says where its contents begin; the lines between the children stay.
4. **Tables, read and written** — below.
5. **Three story changes.** `BlockAnchorNote` is drawn inside a thread card,
   where it actually appears; `ConversationThread` gains four stories of its
   own, because `subdued` cannot be judged unless it sits beside the ordinary
   card; and `ConversationCount` loses a story, because `unit` changes the
   sentence a screen reader is given and nothing on screen.

#### Tables

`table` has been a block type since the block model landed and 24 published
descriptions carry one, but Ship had no editing design, so a table was parked
as an unknown block — preserved, never drawn. It renders now, and the editor
makes one (`@tiptap/extension-table`, one control beside the paperclip).

**It had to be both halves at once**, which is why it is here rather than in a
ticket of its own: reading and writing share `PROSE_BLOCKS`, and a table that
could be read but not written would have broken RIC-14's one rule. Measured in
both surfaces: the table 608px, each cell 370.9×28.6, the same padding,
hairline and header fill; the editor adds ProseMirror's own wrapper and
changes nothing else.

**The protocol names `table` and not its parts**, so what a row and a cell are
called is decided by whatever wrote the document — ProseMirror's names, which
is what both apps' editors are. They arrive as unknown blocks carrying their
own `typeName`, a first row of header cells becomes a `thead`, and a table
nested some other way still renders its text.

**A round trip deleted the whole table, and a test caught it.** The save path
read a cell's paragraphs as inline runs, the way it reads a paragraph's, so
every row and cell came back empty: a table would have survived being opened
and vanished on save. A list was the only block container until now, which is
why the check was written as two names.

**Marker text keeps `| a | b |` literal.** §13.2 says a reader MUST render a
table as the characters it is; the dialect is the protocol package's and Peek
reads the same one, so Ship parsing pipes would make one message read two ways.
Katerina asked for the story that showed this to go — it read as the feature
being broken rather than as two content models — and ruled the dialect stays
as it is. The rule is a test and a line on the page.

**One trap worth keeping.** Installing the extension on Windows pruned
`@emnapi/core` and `@emnapi/runtime` from the lock file — optional peer
dependencies that resolve only on Linux, which is where CI installs — and
`npm ci` then refused the whole tree before either job ran anything. Restore
them from main and prove the lock with `npm ci --dry-run` on a copy holding
only `package.json` and the lock.

#### The seven things Ship and Peek both draw

The ticket asks for the pairs to be recorded, because they are the strongest
promote candidates there are and the clearest evidence for what is left of the
migration. Katerina ruled: record all seven, promote none yet.

The last column says what each pair is evidence *for*. Two of the seven already
have somewhere to go — `RichText` is UIG-30's whole case, and `ForeignObject` is
migration F13, ruled to stage 7. One was closed by this ticket. Three have
nowhere yet, which is the reason for writing them down. One is not a candidate
at all and is listed only because the pairs had to be exhaustive.

| Ship | Peek | lines | what is already shared, and what is not | what it feeds |
|---|---|---|---|---|
| `Reference` | `Reference` | 202 / 282 | **The same file name in the same folder in both repos.** Both open with the same sentence about SPEC §13.1 and RIC-10, both sit on the package's `InlineChip` and `WithTooltip`, both have a private `objectLabel()` that reads the title slot and quotes a person-titled message's opening words. What differs is Peek's scroll-to-a-message and its router, and how each draws the status. §11 G3 called this one out on 13 September; it is still true | **No ticket yet.** The strongest of the eight; she ruled *promote none yet* on 22 September |
| `ForeignObject` | `ForeignObjectWidget` + `ForeignBody` | 225 / 643 + 54 | Same projection in, two cards out. Peek's is nearly three times the size because it carries the actions the manifest declares — its status and lead are dropdowns you can change; Ship's is layout only. The app name is a chip on one and small caps on the other | **Migration F13**, ruled to **stage 7**, decided together with `Card` (D66 item 3) |
| `RichText` | `MessageBody` + `RenderBlocks` | 248 / 496 | The parsing is already the package's and tested there. What each app wrote twice is the mapping from that tree to elements, and they agree on nearly all of it. Peek draws a body on a filled block; Ship draws it on the page | **UIG-30** — *RichText: one component that draws a message's text, for both apps.* This pair is that ticket's evidence, and UIG-18 grew it: Ship draws tables now, Peek renders them as flat text |
| `ConversationThread` + `Conversations` | `ConversationCard` + `ThreadPanel` + `CommentRow` | 670 / 840 + 548 + 92 | A message is a face, a name, a time and a body in both. Then they diverge: Peek carries resolve, highlight, urgent, unread, selected and a hover menu; Ship carries the unread rule and a reply box. Katerina already ruled on 22 September that Peek's own two cards must not be merged with each other | **No ticket.** She ruled on 22 September that Peek's own two cards must not be merged with each other, which settles the shape before any promotion |
| `NewIssueDialog` | `CreateTopicDialog` | 92 / 88 | Title bar with a close, a required Title, a second field, a footer with Cancel and one primary. Both already sit on the package's dialog, fields and inputs, so what is duplicated is only the arrangement — and they arrived at the same one independently | **No ticket.** Both already sit on the package's dialog, fields and inputs; only the arrangement is written twice |
| `StatusLabel` | `StatusPill` | 90 / inside ForeignObjectWidget | Ship gives a status a shape; Peek gives it a colour, read from the colour the owning app's manifest publishes. Ship ignores that colour. See finding 1 | **Closed in Ship by this ticket** (her review, point 3): `StatusLabel` takes the colour now. Peek was already right, so the two agree without a promotion |
| `Related` | `ProjectTickets` + `TopicProjectPanel` | 57 / 183 + 1 | Both answer "what else is attached to this", and answer it genuinely differently: Ship lists the foreign files placed under an object, Peek shows the paired project's properties and ticket progress. Listed because the pairs must be exhaustive, not because it is one | **Nothing.** Listed because the pairs had to be exhaustive, not because it is a candidate |

`Attachment` is not on this list: UIG-35 already resolved it, and both apps now
draw the package's `AttachmentCard`.

#### Three things it found, none of them fixed

The ticket forbids touching a component, and Katerina ruled "not yet" on filing
them. All three are on the review page with photos.

1. **A foreign status is always a grey plain circle, in every app.** The
   projection replaces the raw status with the vocabulary's *label* before a
   consumer sees it (`projection.js`: `value = entry?.label ?? raw`) and puts
   the colour beside it as `slot.colour`. Ship's `ForeignObject` and
   `Reference` both call `StatusLabel` with `value={slots.status.value}`, and
   that shape switch only knows raw keys — so it never matches and the colour
   is never read. Peek's `StatusPill` reads `slot.colour` and is right.
   **The story hid it:** `FolderView.stories.tsx` feeds `in_progress`, the raw
   key, which the projection never sends — so the story shows a blue half
   circle beside the literal text while production shows a grey circle beside
   "In Progress".
2. **A "muted" mention card is eight to twelve levels darker.** `Activity`
   promises that a stranger's name-drop "must not sit indistinguishably beside
   your project's own work". Measured in Chrome on the `ship` theme: the
   ordinary card is `rgb(22, 24, 31)` with a 12% hairline, the muted one is
   transparent over `rgb(14, 15, 19)` with a 6.7% hairline. D70's own method
   calls a channel off by eight or less *noise*.
3. **Four dialogs have ten stories the catalogue cannot see.**
   `dialogs.stories.tsx` groups them under one heading and names no
   `component`, because it cannot name four — so `NewIssueDialog` is reported
   as having no story when it has three. Peek has the same gap, which UIG-17
   found in `Overlays/Dialogs` and `Overlays/Menus`. **UIG-19 has to decide
   whether "drawn inside another story" counts**; until it does, both counts
   are stated rather than one.

**The checks, and what the first guess got wrong.** `gates:status` reads
UIG-18 **6 of 6**. The guessed evidence looked for five headings including
"What it is" — but the package's contract has four, and "what it is" is the
opening line under the title, so every page that kept the contract would have
failed. It also read `e.class`, which the catalogue does not have: the class is
on `e.app`. A page is now found by the *part's* name rather than its file,
because two exports can share one file, and the text is read with CRLF
normalised, because Ship is checked out with CRLF on Windows.

**Not in this ticket.** Nothing moved, nothing was renamed but a story file,
and no promote ticket is open — Katerina ruled "not yet" on both filing the
findings and promoting a pair. `Related` may never have been on screen in
production: it draws nothing at all, heading included, unless a file has been
placed under a project or an issue.

### UIG-35: building it

**What it is.** One part that opens a picture full screen, in the package, for
both apps — and an attachment card that does the whole job around it: fetching
a file the reader needs permission for, opening it, and saving it. Katerina, 20
September, reading Peek's Storybook: *"peek should get all of it from estiva ui
about file attachment so full screen should be implemented in estiva-ui and
ship should get it too"*. This is B22 in the migration docs, which she ruled on
10 September (D52), plus the wrapper the two apps had written twice.

**Recorded on 22 September, a day late.** UIG-35 closed on 21 September with
its three PRs merged and deployed, and left **no record here at all** — no line
in §0, no section, no row in §15, and the status script did not carry the
ticket, so nothing read its code back. Everything below is read from the merged
code, not from memory. `gates:status` now reads UIG-35 **8 of 8**, and the
project counts 35 tickets rather than 34.

**Released as 0.26.0 and taken by both apps, all three merged on 21 September:**
estiva-ui PR #73 (`gates/35-lightbox`, merge `0866e64`, tag v0.26.0, npm latest
0.26.0), Peek PR #273 (merge `93a167c`) and Ship PR #166 (merge `75de177`).

**The package.** `Lightbox` is a picture full screen on a scrim, on Base UI's
`Dialog` like `DialogShell` — the portal, the backdrop, Escape, a focus trap,
and focus returned to whatever opened it. Both hand-built viewers it replaces
were `createPortal` and a fixed `<div>` with none of that. Focus starts on the
layer rather than on the ✕, `DialogShell`'s rule, so no picture opens with a
ring drawn on its close button. `AttachmentCard` gained the three things the
apps were doing around it: `remoteSrc` with `remoteFullSrc` and `fetchImage`
for a file the reader needs authorization for — the card owns the wait, the
refusal and the swap, while *how* to fetch stays the app's, because only the
app holds the authorization — opening the picture itself unless `onOpen` says
otherwise, and `download` to save the original under its name rather than the
thumbnail on screen. A new token, `--scrim-strong` (black at 80%, in all four
themes): a picture viewer dims harder than a dialog, and that is the value
Peek's hand-built one used.

**A viewer built by hand is refused from now on.** `no-rebuilt-behaviour.ts`
names `Lightbox` as an owner of four behaviours beside `DialogShell` — the
portal, the focus trap, the scroll lock and Escape — so the next hand-rolled
overlay is a lint error naming the part to use instead. That is the difference
between this ticket and a deletion: the copies cannot come back.

**Peek** deleted `ui/FileAttachmentCard.tsx`, 174 lines, and its `ImageLightbox`
went with it — the last overlay in Peek built by hand (migration P4, B22
closed). What is left is `postedAttachment(file)`, which only says which URL is
the thumbnail and which the original. Four surfaces draw the package's card
directly now: `ConversationCard`, `ThreadReplyCard`, `AttachFiles` and
`ComposeBox`. Two `@estiva-escape` notes went with the viewer they explained.

**Ship**'s `Attachment` is 91 lines, from 181, and **Ship gained full-screen
pictures, which it had never had** — a screenshot in an issue could be seen at
the size it was drawn and no larger. Its `useBlobUrl` and `saveFile` are gone
from the whole app. A picture in a thread is now the same 180px thumbnail Peek
shows rather than drawn whole; Katerina ruled on that from photos before it
merged.

**Three things adopting it in Ship found**, each now a test in the package: a
document that has to be fetched keeps its row instead of drawing a picture's
loading pulse; `alt`, because Ship carries one on every `imeta` and an empty
alt tells a screen reader that an attachment somebody posted is decoration; and
saving bytes already in hand hands them straight to the anchor instead of
fetching them again.

**Also closed with it,** by her ruling the same day: neither app keeps a
standalone attachment story, because the card has a page in the package. The
same Peek PR carried a Storybook tidy.

**Where it shows up later.** UIG-18 read this as settled: `Attachment` is the
one Ship/Peek pair already resolved, and it is the only one of the eight not on
that ticket's list.

### UIG-14: building it

**What it is.** Every package part has a page. A page is the answer to "which part do I use, and how" — for a person, for the Claude skill (UIG-20), for the checker's messages. UIG-14 makes all 55 say it the same way, checks what they say against the code and against how Peek and Ship really use each part, and fixes what does not match.

**Katerina's rulings, 18 September** (plan page *What UIG-14 Checks*; review page *UIG-14 Findings*, https://claude.ai/artifact/LUhtwcfi5z5J6uhWhDQx9N). UIG-15 and UIG-16 are folded in: one ticket, all pages, the three close together. She rules in groups of look-alike parts (11 groups), not in the tickets' batches: the old split was by "imports Base UI", which put Toast and Banner, DialogShell and ConfirmDialog, Button and Link in different tickets. What it owns is a table — it does / so you never write / ✓ refused when written by hand — just before Keys; a part that owns nothing says so in one line. **Every finding is shown to her with a photo and a suggestion, none left out.** And **every fix a finding asks for is made in this ticket**, not a new one: three PRs.

**Measured before starting.** All 54 pages (55 with ContainerHeader, new in 0.23.0) already had an opening line, When, When not and How with code — her template of 2 September. The ticket assumed they had to be written; they had to be checked. The ticket's "44" was 12 September's count.

**What changed in estiva-ui**, one commit each:
- What it owns on all 55 pages. The ✓ rows are `OWNED_BEHAVIOURS` read back: `src/pages.test.ts` fails when a page's ticked rows and the checker disagree, when a row is worded as a checker behaviour but not ticked, when a section is missing, twice, or out of order, when How has no code, or when a When not line names a part that does not exist. Each of those was seen to fail.
- Every How block compiled against the package: 65 blocks, 4 did not (two placeholders, one block that stopped at an opening tag, one name used for two things) and are fixed; Toast's and ChipInput's compile when checked by hand with real types.
- Her page lines: 24 edits on 19 pages (the review page's cards 1.1–11.6).
- The checker's behaviour "Closes on Escape, and takes its keys, by itself" is now "Takes its keys by itself": Tabs and Toolbar own it and do not close (card 0.1).
- `IconButton` `href` (card 4.13): a plain anchor in the button's exact look, the button again while it cannot be used. Not Base UI's Button rendering an anchor, which adds `role="button"` to a link. **Needs a release (0.24.0) before Peek can use it.**

**The findings.** Two read-only audits of every call site in Peek and Ship (at `ae0bf40` and `13b5ee0`), and the When not lines read as a map of which page names which: **88 cards**, 175 places, 113 photos from the three Storybooks. By her ruling: page lines changed or added, app fixes made here, a few left with their reason (already ruled, or already written down), and three kept for later tickets — the description edited in place is UIG-30's, the editor pop-ups UIG-31's, a picture opened full screen later. **Found late** (on the review page as card 4.15, then L): two tree rows in Peek (`FileTreeView`, `FolderContentsView`) write `aria-expanded` on an `IconButton` by hand — the item UIG-8 left for this ticket (§ "What is ready"). Katerina: a tree part on Base UI, UIG-34. `aria-pressed` by hand is gone: Peek's text toolbar uses `pressed`.

**Checks** (branch, 18 September): `src/pages.test.ts` 332 pass; unit tests pass; `gates:status` UIG-14 **2 of 2**, UIG-15 1 of 1, UIG-16 1 of 1 — the first-guess checks read a heading "What it is" that her template never had (the opening line is it) and are now the contract; each fails on 0.23.0's EmptyState page; lint 0 errors on the changed files; `registry:check` current (82 entries).

**Traps.** The script that writes What it owns replaced a section only when another heading followed, so a rerun doubled Skeleton's (its last); the test now fails on a section twice. `npm ci` in a worktree whose Storybook is running fails half-way and leaves `node_modules` gone — stop the Storybook first, and on Windows its node child outlives the shell that started it.

**Round 2, 19 September** (the review page's tab "Round 2"). The app fixes were made in their own branches, 28 cards, each with before and after photos; four stopped because doing them would have changed something she had not asked for, and each became her decision (A–M). Her answers, and what the package got for them:
- **A** — a tooltip sits inside text and wraps: `WithTooltip` `inline` (a `<span>`, since a `<div>` is not allowed inside a paragraph), and the pill wraps at 320px while one line stays 30px (13 tooltip stories identical). Both apps' references then use it.
- **B** — the composers stay as they are (TipTap handles their keys). **C1** — the bug B found is fixed anyway: a `Form` inside a `Popover` inside a `Form` sent both; a Form now sends only its own submit.
- **C** — the floating `AppShell` draws the Signal canvas: Peek's dot grid, verbatim, as a component in the Tailwind preset (neither app imports `base.css`; the class lint knows a preset class).
- **D** with **C3** — Peek's "Open work" heading takes `SectionHeader`, and `SectionHeader` `hover="none"` keeps the row still (added to `PART_LOOK_PROPS`).
- **J** — `Select` takes `disabledReason`, as `Button` does: held shut, reachable by Tab, the reason as its tooltip. Ship's own wrapper goes.
- **C4** — a waiting file's ✕ shows on keyboard focus; the cut name's tooltip hangs below it.
- **PreviewCard** (her own find): its scrollbar sat 15px from the edge, behind the card's padding; the padding moved inside the scrolling box, as `Popover`'s did at 0.12.6 — the thumb is 3px from the edge (Finding 58), the card and its text unchanged.
- **E, F, G, H, I, K, M** kept as built; **L** — the tree rows' `aria-expanded` waits for a tree part on Base UI, "soon" (Katerina). C5–C8 and C11 are app bug fixes in their PRs; C9, C10 stay; C12 is a method note (the photo counter misses changes of 8 levels or less, like the Signal dots: crop them).

**Round 3, 19 September** (the review page's tab "Round 3"). **0.24.0 is released**: estiva-ui PR #69 (merge `e67d250`), tag `v0.24.0`, release run 35406427613. Peek PR #263 (merge `f074ca3`) and Ship PR #164 (merge `154f60d`) took it, with every app fix Katerina ruled on, one commit each: 1.7 and 1.8 (references in the package tooltip, inline and wrapping), 9.3 (Peek on the package's floating AppShell, its dots drawn by the preset), 10.2 ("Open work" on SectionHeader, `hover="none"`), 4.13 (two of Peek's three navigate-only icon buttons are IconButton `href`), J (Ship's locked selects on `disabledReason`), C5–C8, C11 and the round-1 fixes. Katerina merged both; both deployed. The fixes found three more, all in 0.24.1: **F1**, the inline tooltip wrapper carries `align-top` (both apps had wrapped it in a span of their own, because the checker refuses the class on the part); **F2**, a Select given both `disabled` and `disabledReason` shows the reason, as Button does; **F3**, a link in a Toolbar had no part: `ToolbarLink`, so Peek's "Open topic" can be one.

**Round 4** (tab "UIG-15 & 16"): every point of the two folded tickets, one by one — 24 points — with cards for the ones left (N1–N9, S1, T1–T3, L1, P1, X1). **Round 5** (tab "What we missed"): the three tickets read again, line by line, against the released code; twelve more (M1–M12). Katerina ruled on every card of both rounds on 19 September.

**What 0.24.1 carries** (branch `gates/14-round4`):
- **F1, F2, F3**, each with a test.
- **The heights (T1, M4, M6).** Measured in Chrome, four copies in a 72px scrolling column: SectionHeader 32 → 24px, a Skeleton row 32 → 18, Button 32 → 18, PersonTrigger 32 → 22, Reaction 24 → 18, small Select 24 → 18, small TextInput 24 → 18 (in a fuller column, lower still: SectionHeader 12, Skeleton row 16, Button 14). Rows that span their column now refuse to shrink (`shrink-0`: SectionHeader, SkeletonRow). Controls, which mostly sit in rows, keep a minimum height equal to their height instead (Button, small Select, small TextInput, PersonTrigger, Reaction): `shrink-0` would also stop a row from narrowing them. Already safe, measured the same way: ContainerHeader, NavItem, MenuItem, TopBar, RailItem, Divider, IconButton, Checkbox `row`, Kbd, the default TextInput and Select. RailItem is a set 48px (it was 48.3, from its content; M6 (b)). `src/heights.test.tsx` pins the classes; each page's What it owns says the part keeps its height.
- **`ListColumn`** (N9: "in this PR, no new ticket"). Peek's list column, moved in as it looks: 290px, a hairline on its right, ContainerHeader on top, the list in a ScrollArea 16px under the header, 12px above the bottom, rows 12px in. `spacing`: `rows` (2px) or `sections` (4px) — Peek's five columns use both, the three of one kind of row 2px, Desk and People, which have sections, 4px. `above` for a row that stays while the list scrolls (the create field on the Folders page). `collapsed` closes it with the rail, as Peek's does: Katerina ruled that the part owns the width, the line and the collapse. The 380px column beside a conversation stays Peek's for now (Katerina: not now); its page says it is planned, with `SplitLayout`.
- **The page words.** No app names (M1: 8 pages, and L1's own wording). No app things in the examples (M2). No credits: 24 lines lost "(Katerina, D21)", a date or "UIG-9", and kept their reason (M3 (a)). The numbers on the frame pages (N1–N8). The parts sized by where they sit say so first, in When (S1: EditableText, Link, Person, Card, SectionLabel). InlineChip is left out: it sets its own 14px (M5). EditableText's line says "on your element around it", not "in `className`" as the card had it: its own page, and the lint, refuse a size there. ScrollArea's lighter text (T2); what scrolls in the floating card (T3); import SectionLabel, never copy it (L1). Planned lines (P1, M7): Byline (Avatar, Person), Lightbox (AttachmentCard), a linked object's inside (Card), the editor menus (Menu, MenuItem, Popover: UIG-31), rich text in place (EditableText: UIG-30), `SplitLayout` (AppShell, ListColumn). X1's four names on their family's pages.
- **The checks (M9).** `gates:status` UIG-15 also reads that this record walks the eight Folders mistakes and that ContainerHeader's page states its numbers; UIG-16, that table R lists every page and that the rule on exports is here. UIG-33 and UIG-34 are listed, with first guesses.

#### The eight Folders mistakes, one by one (UIG-15)

Katerina found them by opening the Folders page on 10 September; all eight were fixed by hand on 11 September. The ticket's question: reading the pages now, would each have been avoidable? Writing a page does not fix a page of the app, and a page stops a person, not a program — the last column says which a check will catch later. Peek has no story that draws the Folders page yet (Katerina, 19 September: not yet).

| | What went wrong | The page line that stops it | A check later |
|---|---|---|---|
| D1 | The list column did not scroll: 81 folders cut off at the fold | ScrollArea, When: "a list that grows with its data counts, even when today's data fits"; AppShell, How: what scrolls in the floating card; and `ListColumn`, which scrolls its rows itself | the route probe (§ "What is ready": a box that should scroll and does not) |
| D2 | "Create" clipped out of the 290px column | ContainerHeader, When: the column's actions are "IconButtons with tooltips" — words do not fit a narrow column | — |
| D3 | 81 folders wearing a topic's status glyph | none can: the glyph is Peek's own part; its page is UIG-17's | — |
| D4 | The file pane headed itself at 12px and 8px padding | ContainerHeader, When not: "A row you draw yourself at the top of a column … → this part", with its numbers | UIG-22, a hand-made header row |
| D5 | The thread pane headed itself the same way | the same line | UIG-22 |
| D6 | The folder name larger than every other pane title | EditableText, When: "It has no size of its own. Give it the size of the text it stands in for — a pane title's `text-body-2-strong`" | — |
| D7 | A row's count floating at the card's top corner | none can: Peek's own row; its page is UIG-17's (Katerina ruled the count stays in the apps, 6.11) | — |
| D8 | Four empty states in the wrong scope | EmptyState, When: "The page decides, not the size of the box." | UIG-23, a hand-made empty state |

#### Table R: every page, its group, and a tick (UIG-16)

UIG-14 + UIG-15 + UIG-16 = **57**. The tickets' "44" was the number of part files on 12 September (46 pages then); Katerina folded the three into one ticket over every page there is, and there are 57 today, every one below. The two ticks: the page keeps the contract (an opening line, When, When not, How with code, What it owns), and What it owns agrees with the checker. `src/pages.test.ts` holds both on every commit, and `gates:status` UIG-16 fails if a page is missing here.

| | Page | Group | Contract | Owns | |
|---|---|---|---|---|---|
| 1 | `AppShell` | The frame | ✓ | ✓ |  |
| 2 | `AttachmentCard` | Chips and cards | ✓ | ✓ |  |
| 3 | `Avatar` | People | ✓ | ✓ |  |
| 4 | `AvatarGroup` | People | ✓ | ✓ |  |
| 5 | `Banner` | Dialogs and messages | ✓ | ✓ |  |
| 6 | `Breadcrumb` | Getting around | ✓ | ✓ |  |
| 7 | `Button` | Pressing | ✓ | ✓ |  |
| 8 | `Card` | Chips and cards | ✓ | ✓ |  |
| 9 | `Checkbox` | Choosing | ✓ | ✓ |  |
| 10 | `Chip` | Chips and cards | ✓ | ✓ |  |
| 11 | `ChipInput` | Choosing | ✓ | ✓ |  |
| 12 | `CollapsibleSection` | Headings and rows | ✓ | ✓ |  |
| 13 | `CommandPalette` | Dialogs and messages | ✓ | ✓ |  |
| 14 | `ConfirmDialog` | Dialogs and messages | ✓ | ✓ |  |
| 15 | `ContainerHeader` | Headings and rows | ✓ | ✓ | new in 0.23.0 (UIG-13) |
| 16 | `DialogShell` | Dialogs and messages | ✓ | ✓ |  |
| 17 | `Divider` | Headings and rows | ✓ | ✓ |  |
| 18 | `EditableText` | Typing | ✓ | ✓ |  |
| 19 | `EmptyState` | Loading and empty | ✓ | ✓ |  |
| 20 | `ErrorBoundary` | Loading and empty | ✓ | ✓ | new in 0.25.0 (D3): Peek's, moved in |
| 21 | `Field` | Typing | ✓ | ✓ |  |
| 22 | `FieldLine` | Typing | ✓ | ✓ | lives in Field's file |
| 23 | `FilePicker` | Typing | ✓ | ✓ |  |
| 24 | `Form` | Typing | ✓ | ✓ |  |
| 25 | `IconButton` | Pressing | ✓ | ✓ |  |
| 26 | `IdentityMenu` | Floating panels | ✓ | ✓ |  |
| 27 | `InlineChip` | Chips and cards | ✓ | ✓ |  |
| 28 | `Kbd` | Pressing | ✓ | ✓ |  |
| 29 | `Link` | Pressing | ✓ | ✓ |  |
| 30 | `ListColumn` | The frame | ✓ | ✓ | new in 0.24.1 (N9) |
| 31 | `Menu` | Floating panels | ✓ | ✓ |  |
| 32 | `MenuItem` | Floating panels | ✓ | ✓ | lives in Menu's file |
| 33 | `NavItem` | Getting around | ✓ | ✓ |  |
| 34 | `Person` | People | ✓ | ✓ |  |
| 35 | `PersonTrigger` | People | ✓ | ✓ |  |
| 36 | `Popover` | Floating panels | ✓ | ✓ |  |
| 37 | `PreviewCard` | Floating panels | ✓ | ✓ |  |
| 38 | `ProgressBar` | Loading and empty | ✓ | ✓ |  |
| 39 | `Property` | Headings and rows | ✓ | ✓ |  |
| 40 | `Rail` | Getting around | ✓ | ✓ |  |
| 41 | `RailItem` | Getting around | ✓ | ✓ |  |
| 42 | `Reaction` | Chips and cards | ✓ | ✓ |  |
| 43 | `ReactionPicker` | Chips and cards | ✓ | ✓ |  |
| 44 | `ScrollArea` | The frame | ✓ | ✓ |  |
| 45 | `SearchInput` | Choosing | ✓ | ✓ |  |
| 46 | `SectionHeader` | Headings and rows | ✓ | ✓ |  |
| 47 | `SectionLabel` | Headings and rows | ✓ | ✓ |  |
| 48 | `Select` | Choosing | ✓ | ✓ |  |
| 49 | `Sidebar` | The frame | ✓ | ✓ |  |
| 50 | `Skeleton` | Loading and empty | ✓ | ✓ | the page for SkeletonBar, SkeletonRow, SkeletonList |
| 51 | `Tabs` | Getting around | ✓ | ✓ |  |
| 52 | `TextInput` | Typing | ✓ | ✓ |  |
| 53 | `Textarea` | Typing | ✓ | ✓ |  |
| 54 | `Toast` | Dialogs and messages | ✓ | ✓ |  |
| 55 | `Toolbar` | Pressing | ✓ | ✓ |  |
| 56 | `Tooltip` | Floating panels | ✓ | ✓ |  |
| 57 | `TopBar` | The frame | ✓ | ✓ |  |
| 58 | `Lightbox` | Dialogs and messages | ✓ | ✓ | added by UIG-35 (21 September), listed here by UIG-19: its page kept the contract from the day it landed, and only this table missed it |

#### The numbers, then and now (UIG-16)

| | 12 September (UIG-12's four) | 0.25.0 |
|---|---|---|
| export lines in `index.ts` | 45 | 56 |
| value names in those lines | 65 | 86 |
| part files (`.tsx`) | 44 | 55 |
| pages (`.mdx`) | 46 | 57 |
| story files | 46 | 57 |

Measured from git: on 12 September `index.ts` had 45 export lines naming 65 values. The ticket's "45 exports" was the lines; the UIG-12 table below called it "value exports" and is corrected. Pages and stories are two more than part files, then and now: FieldLine lives in Field's file and MenuItem in Menu's, and each has its own page and stories. Export lines are one more than part files because `cn` is a helper in a `.ts` of its own.

#### Exports that are not parts (UIG-16: X1 and M8)

A part has a page. The pieces of a part's family — sub-parts, a provider, a hook, class names, helpers — are named on that part's page; since 0.24.1 all of them are. `cn` is explained on Getting started. The two the ticket names: **`fit`** was deleted in migration stage 5; **`triggerDisabled`** is used only inside the package, by Menu and Popover, and is not exported. Neither has a page. The package's other ways in — `/eslint`, `/gates`, `/registry` with `registry.json`, the Tailwind preset, `tokens.css`, `base.css` — are tools; the README and Getting started explain them. A type goes with its part: its page's Controls table shows it.

#### Every finding, and where it ended (UIG-14)

The review page has each one with its photo: https://claude.ai/artifact/LUhtwcfi5z5J6uhWhDQx9N. **89 cards** in round 1:

| | Finding | Katerina | Where it ended |
|---|---|---|---|
| 1.1 | Tooltip sends "controls inside" to the wrong parts | ok → page line changed | as she ruled |
| 1.2 | Tooltip never names PreviewCard | ok → line added | as she ruled |
| 1.3 | Menu sends a strip of icons to IconButtons, not Toolbar | ok → line changed | as she ruled |
| 1.4 | MenuItem's reason is out of date | ok → line changed | as she ruled |
| 1.5 | Three pages disagree about pop-up lists while typing | leave | left to UIG-31 (the editor menus) |
| 1.6 | "Add members" is a MenuItem in a dialog, with no Menu around it | ok | as she ruled |
| 1.7 | A cut reference title shows its full text in the browser's own tooltip | fix here → stopped: see Round 2, A | done in both apps: the package tooltip, inline and wrapping (round 2 A, round 3) |
| 1.8 | A reference that could not be found hides its address in the browser tooltip | fix here → stopped: see Round 2, A | done in both apps: the package tooltip, inline and wrapping (round 2 A, round 3) |
| 1.9 | "Session ended" is only said in a hover tooltip on a dot | leave | as she ruled |
| 1.10 | A tooltip on the word "edited" | allow it → line added | as she ruled |
| 1.11 | A Popover is mounted only while it is open | fix here → done in Peek | as she ruled |
| 1.14 | Gap: a panel that sits in the page and closes like a popover | leave | as she ruled |
| 1.12 | PreviewCard's example had a placeholder | ok | as she ruled |
| 1.13 | Popover's anchored example stopped halfway | ok | as she ruled |
| 2.1 | Select never mentions ticking several in a list | ok → line added | as she ruled |
| 2.2 | Status, Assignee and Project are disabled with no reason | fix here → done in Ship: see Round 2, J | done in Ship: Select's `disabledReason`, Ship's wrapper deleted (round 2 J, round 3) |
| 2.3 | Selects disabled for a moment while an action runs | allow it → line changed | as she ruled |
| 2.4 | One person is picked with the several-people picker | leave | as she ruled |
| 3.1 | Field names "Field line", a part that does not exist by that name | ok → line changed | as she ruled |
| 3.2 | FieldLine's example had a placeholder | ok | as she ruled |
| 3.3 | An error line typed by hand, under a FieldLine that does the same job | ok → done in Ship | as she ruled |
| 3.4 | Peek's composers send from their own Enter handler, with no Form | fix if behaviour stays → stopped: see Round 2, B | left: the composers keep their keys, TipTap's (round 2 B); the Form bug it found is fixed in 0.24.0 (C1) |
| 3.5 | Ship edits a message with a Textarea and Save / Cancel | ok → line added; Ship stays as it is | as she ruled |
| 3.6 | Two reply boxes are one line, where the page says a message body is a Textarea | no: you will make Ship's composer behave like Peek's | Katerina's: Ship's composer will work like Peek's |
| 3.7 | The command palette uses FieldLine for its hints | keep for now | as she ruled |
| 3.8 | Gap: rich text edited where it is shown | yes, part of UIG-30 | UIG-30 |
| 4.1 | Button sends navigation to "a plain link", not to Link | ok → line changed | as she ruled |
| 4.2 | IconButton says "a toolbar" without naming Toolbar | ok → line changed | as she ruled |
| 4.3 | Five rows of icon buttons are not in a Toolbar | fix here → done in Peek; the Open work row waits on Round 2, D | as she ruled |
| 4.4 | Send buttons are disabled with no reason, in 16 places | no, keep them disabled → Button page line added | as she ruled |
| 4.5 | A disabled Button is used as a display pill | no rule: it will open a dialog of the topic's people | Katerina's: the members pill will open a dialog of the topic's people |
| 4.6 | "Back to topics" is a Button that only navigates | no link: UIG-13 solved the look | as she ruled |
| 4.7 | A key inside a button's label, and inside a placeholder | keep as is | as she ruled |
| 4.8 | The Send icon button has no tooltip | tooltip and Enter → done in Peek | as she ruled |
| 4.9 | Five controls do nothing when pressed | leave | as she ruled |
| 4.10 | Two primary buttons on one surface | ok: Post becomes an icon button later | Katerina's: Post becomes an icon button, later |
| 4.11 | Cancel beside Save is `muted` in Ship, `outlined` in Peek | leave | as she ruled |
| 4.12 | Two notes say "no part makes a row that is a link", but Link does | ok → done in both apps (Round 2, C10) | done in both apps; the whole-row link itself → UIG-33 (C10) |
| 4.13 | Gap: a link that looks like an icon button | ok → IconButton href done; Peek's three buttons after the 0.24.0 release | IconButton `href` in 0.24.0, two of Peek's three use it; "Open topic" takes `ToolbarLink` (0.24.1, F3) |
| 4.14 | Gap: copying falls back to the browser's prompt box | no part | as she ruled |
| 4.15 | Found late: two expand buttons write aria-expanded by hand | new — see Round 2, L | UIG-34, a tree part on Base UI (round 2 L) |
| 5.1 | DialogShell never names CommandPalette | ok → line added | as she ruled |
| 5.2 | Toast names Chip without the bold every other line uses | ok → line changed | as she ruled |
| 5.3 | Banner and Toast both claim "copied" | ok → line changed | as she ruled |
| 5.4 | Banner says a notice with its own action is "not in the package yet" | done by UIG-13 | as she ruled |
| 5.5 | CommandPalette's example used one name for two things | ok | as she ruled |
| 5.6 | Relay refusals are shown as neutral toasts | error → done in Peek | as she ruled |
| 5.7 | "Edited here, but not published" is neutral in messages, a warning in topics | fix here → done in Peek | as she ruled |
| 5.8 | Toasts that never close have no Dismiss, and hide their "!" | no, leave them | as she ruled |
| 5.9 | Ship shows one action's failure in the error Banner | ok → Banner line changed | as she ruled |
| 6.1 | "Resolved" is hand-made coloured text, a pill in the signal theme | fix here → done in Peek: see Round 2, F | as she ruled |
| 6.2 | A Chip inside a Link, so the Chip is what you click | leave | as she ruled |
| 6.3 | Ship shows chosen files as removable InputChips | AttachmentCard → done in Ship: see Round 2, K | as she ruled |
| 6.4 | A picture on its way is a hand-made pulsing box | fix here → done in Ship: see Round 2, K | as she ruled |
| 6.5 | A picture is a plain <img>, not a thumbnail | leave | as she ruled |
| 6.6 | The highlight tag is hand-made | leave | as she ruled |
| 6.7 | A status drawn as coloured text | leave | as she ruled |
| 6.8 | The pinned message box is hand-made | Card → done in Peek | as she ruled |
| 6.9 | Gap: a status as an icon or a coloured word | leave | as she ruled |
| 6.10 | Gap: a picture opened full screen | later | later: a Lightbox, migration stage 7 |
| 6.11 | Gap: a count beside a section heading | leave | as she ruled |
| 7.1 | Avatar's page contradicts itself about bylines | ok → line changed | as she ruled |
| 7.2 | Avatar's size scale leaves out 18 and 20 | ok → line changed | as she ruled |
| 7.3 | Ship draws faces at 18 and 20 | 18 → 16, 20 → 24 → done in Ship | as she ruled |
| 7.4 | A face and a name put together by hand, where Person fits | fix here → done in Ship: see Round 2, G | as she ruled |
| 7.5 | The huddle card stacks faces by hand | fix here → done in Peek: see Round 2, E | as she ruled |
| 8.1 | Rail says "a toolbar of IconButtons", not Toolbar | ok → line changed | as she ruled |
| 8.2 | Tabs sends navigation to "links", not to Link | ok → line changed | as she ruled |
| 9.1 | ScrollArea's When does not make the Folders mistake obvious | ok → line changed | as she ruled |
| 9.2 | ScrollArea lists "a rail"; Rail says it never scrolls | ok → line changed | as she ruled |
| 9.3 | Peek builds its floating frame by hand | fix here → stopped: see Round 2, C | done in Peek: the package's floating AppShell draws the Signal dots (round 2 C, round 3) |
| 10.1 | Divider does not mention cards | ok → line changed | as she ruled |
| 10.2 | The "Open work" heading is hand-made | fix here → stopped: see Round 2, D | done in Peek: SectionHeader `hover="none"` (round 2 D, round 3) |
| 10.3 | The date line between days is hand-made | your suggestion → done in Peek: see Round 2, M | as she ruled |
| 10.4 | A hand-made line between a comment and its replies | fix here → done in Peek | as she ruled |
| 10.5 | Hand-made lines between sections of a card | fix here → done in Peek | as she ruled |
| 10.6 | A line on every row | keep: you will redesign it | Katerina's: she redesigns it |
| 10.7 | The tickets fold is hand-made | leave | as she ruled |
| 10.8 | "Name" is a SectionLabel over a field that becomes an input | leave | as she ruled |
| 11.1 | Failures are shown in the empty-state look, in 8 places | ok → EmptyState line changed | as she ruled |
| 11.2 | An empty state while data is still coming | ok → line changed | as she ruled |
| 11.3 | A section's empty line is hand-made | fix now → done in Ship | as she ruled |
| 11.4 | An empty issue list is a whole-page empty state under tabs | ok → done in Ship: see Round 2, H | as she ruled |
| 11.5 | An empty folder is said in the count line | leave | as she ruled |
| 11.6 | Gap: no part says "this failed" in place of content | use EmptyState → line changed | as she ruled |
| 11.7 | One list skeleton for every page, card grids too | fix here → done in Ship: see Round 2, I | as she ruled |
| 0.1 | The checker calls a behaviour "Closes on Escape", but Tabs and Toolbar own it too | ok, fix it → done | as she ruled |
| 0.2 | Parts no app uses yet | leave | as she ruled |
| 0.3 | One test run failed, three reruns did not | leave | as she ruled |

Round 2 found C1–C12 (12): C1 (a Form inside a pop-up inside a Form sent both) and C4 (a waiting file's ✕ on keyboard focus) fixed in 0.24.0, C2 and C3 went with A and D, C5–C8 and C11 fixed in the apps' PRs, C9 and C10 left with their reason (C10's whole-row link → UIG-33), C12 is a note on the photo method. Round 3 found F1–F3, all in 0.24.1. Rounds 4 and 5: every card yes, except M3 (a), M6 (b), M12 (a) — UIG-33 and UIG-34 written — and N9 built here rather than ticketed.

**Round 6 · 0.24.1 released** (19 September): estiva-ui PR #70 (merge `233c9cc`), tag `v0.24.1`, published. Katerina kept RailItem's set 48px (card Q, "all good") though the tiles add up: 0.35px each, Peek's fourth ~1px higher.

**Round 7 · the apps on 0.24.1.** Peek PR #264 (list columns on `ListColumn`, F1, F3) and Ship PR #165 (F1; 105 of 105 stories identical), neither merged. Her answers: **D1 (a)** a column that crashes keeps its title; **D2 (a)** the 1px-further keyboard ring on a link stays — **for the accessibility pass: one keyboard ring for links and buttons**; D3 asked again after she saw the column in use.

**Round 8 · how the list column is used.** She could not rule on D3 without seeing the column in use, and found that the Sections story drew its group headings by hand (a row with a SectionLabel) — copied from Peek's Desk "Urgent". The review page showed each part outlined in Peek's pages. Her answers: **D4 (a)** a heading over a group of rows is a SectionHeader (`hover="none"` with nothing to act on), a group that folds a CollapsibleSection, and SectionLabel alone only in a row of another shape — SectionHeader's, CollapsibleSection's and SectionLabel's pages say so; Peek's "Urgent" becomes a SectionHeader (tested: pixel-identical). **D5 (b)** one spacing: every list column's rows 2px apart; Desk's and People's groups move up (Desk's lowest 14px, People's 16px), accepted. **D3 (c)** the crash catcher is the package's: `ErrorBoundary`, Peek's moved in as it was, held by `ListColumn` itself and used by Peek in its three other places, Peek's own deleted — this replaces her 18 September ruling (UIG-13) that it stays in Peek. Then: **when a row breaks, the message is centred** in the room the list had, under the kept title. And from a screenshot of Peek's message menu: the lines between a menu's groups touched the rows — Peek drew them three ways (no room, 4px, 4px and inset), and the Divider and Menu pages disagreed — so **the package gets `MenuSeparator`**, the line with its own 4px (her "yes"); Peek's menu rows without icons stay as they are (her "no").

**What 0.25.0 carries:** `ErrorBoundary` (its page, stories and tests, moved from Peek's); `ListColumn` holding one, its message centred, and one spacing (`spacing` is gone); `MenuSeparator`; the Sections story on CollapsibleSection and SectionHeader; the D4 page lines; the Divider and Menu pages pointing at MenuSeparator. A minor version, not a patch: it adds parts and removes a setting.

**Round 9 · the apps on 0.25.0** (19 September). Peek PR #264 moved to it: the package's `ListColumn` with no wrapper of Peek's, the package's `ErrorBoundary` with Peek's deleted, "Urgent" a `SectionHeader`, one spacing, and every menu line a `MenuSeparator` — the six counted in round 8 and the `/` menu's two, found when the PR was checked. Ship PR #165 took it with no change of its own. No photos this round (Katerina); measured in Storybook instead: Desk's rows 2px apart, "Urgent" the same row 4px higher, each menu line 4px above and below. Her word: "merge". Both merged — Peek `5c4bb45`, Ship `14bb501` — and deployed.

**Done.** UIG-14, UIG-15 and UIG-16 close together, as she ruled on 18 September. Left for later, on record: one keyboard ring for links and buttons (the accessibility pass, D2); UIG-33, a whole row that is one link; UIG-34, a tree part.

### UIG-13: building it

**What it is.** Most of what we own lives inside Peek and Ship, and nobody could find it. UIG-13 puts every one of those parts in the catalogue `estiva-ui find` searches, and sorts each. It only describes: nothing was moved, renamed or deleted.

**Katerina's rulings, 18 September** (plan page *What UIG-13 Finds*; the Ship ticket carries them at its top). 1 — Peek's and Ship's lists stay private: estiva-ui is public on GitHub and npm, so no merged index is committed or shipped; the three are put together only on a machine that has them side by side. 2 — an app's list is built fresh every time and never committed. 3 — a part with no one-line description cannot merge, Jan's work included. 4 — Claude merges and releases; the release carries UIG-10's relay work and PR #66. 5 — she picks the promote list from photos before the ticket closes.

**The count, 18 September** (Peek `d80765a`, Ship `13b5ee0`). The ticket's 115, 74 and 233 were from 12 September, and how 115 was counted was never written down (§18). Counted by name, as the package's catalogue is, and reconciled by file:

| | files (.tsx, no stories or tests) | hold a part | hold none | parts | handed on | reusable | one-off | candidate | unused |
|---|---|---|---|---|---|---|---|---|---|
| Peek | **125** | 119 | 6 | **143** | 19 | 46 | 67 | 7 | 4 |
| Ship | **74** | 73 | 1 | **91** | 41 | 10 | 38 | 2 | 0 |

With the package's 81: **315** names, **257** without the pass-ons. The files that hold no part, each with its reason in the catalogue: Peek's `main.tsx`, its two view hooks and its three editor add-ons; Ship's `main.tsx`. The unused, listed for Katerina and never deleted by the catalogue: `HighlightsCard`, `PeekLogo` and `PeekApp` (only their stories use them), `SkeletonHuddleGrid` (nothing does).

**How a kind is decided — from the code, never a folder.** A pass-on: its file only hands a package part on (in one line or two). Otherwise by the files that use it — stories and tests are not uses: none is unused, one is a one-off, two or more is reusable, and reusable with nothing tying it to the app is a candidate to move. A tie is an import of a package the package does not itself depend on, a file that is not code, or an app file that is tied; types count. Where the count is wrong, a person writes the kind beside the part with the reason (`@registry reusable: <reason>`), and the catalogue shows it.

**The promote list — Katerina decides, 18 September.** The count offered 21 parts (Peek's `SkeletonSidebarList` turned out to be the package's `SkeletonList` under a second name, and is a pass-on). I first marked 13 of them "stays in the app" myself, before she had seen them; that was hers to decide, and she said so. She then saw every one, with photos and each Storybook story beside the package part it most resembles, and ruled: **ContainerHeader** becomes a package part and Peek takes it (**A**); Peek's **ErrorBoundary** stays, and its message becomes the package's **EmptyState with a button**, which Peek uses wherever an empty state has one beside it (**B**); Peek's composer strip becomes the package's **Banner** (**C**); what Peek no longer needs is removed (**D**). Everything else stays where it is, each with her ruling on an `@registry` line: Peek's DateDivider, UnreadDot, the @ / [ menus' box (already on the package's Popover), ConfirmDelete, ConversationQuickMenu, its EmptyState and Reaction wrappers, PeekLogoMark, ReactionHorizon, TopicMoreMenu, its three providers and SkeletonConversationList (to go later); Ship's StatusLabel, ConversationCount and NewIssueDialog. A to D are part of this ticket, by her ruling.

**The descriptions.** 53 parts had none (43 in Peek, 10 in Ship; Peek's two `Skeleton` pass-ons needed none once the builder read them right) and 15 had one that described something else or nothing — "Seam-internal: mounted by PeekDataProvider", "`/topic/:ref` serves two grammars" on the whole app, "Peek ships one theme: Signal". First drafts by a helper that read each part's code; every one of the 174 own parts' lines then read by hand; 51 wrapped to the files' width. Comments only: every changed code line in both apps is a comment line, and both apps build byte for byte as main does (Peek 14 files, Ship 5, same packages, compared by hash).

**Proof.** 
- A second counter, written separately that morning (scratchpad `census.mjs`), against the builder: every part, every use, every tie and every file the same, in both apps. It disagreed three times on the way, and each time one side was wrong: the builder counted `SlashMenu.displayName = …` as a use (fixed); the counter ignored pictures as ties and missed the two-line pass-on (fixed there).
- react-docgen, Storybook's own props reader, against the builder: 168 parts agree. 3 differ where react-docgen cannot see past the file into the package — Peek's `Avatar`, `EmptyState` and `SearchInput` take the package part's props, which the builder follows through the package's own entry (all 65 of its `XProps` types are named after their part).
- Four /code-review passes: 3, then 3, then 10, then 2 faults — the last two in the fixes themselves. Each confirmed on a throwaway app and now a test. None was in Peek or Ship; each was one new file away. What they were is in the commit messages and in *What is ready*, below.
- `gates:status` (Peek and Ship on their branches, the local 0.23.0 pack installed): UIG-13 **14 of 14**, 16 done. `gates:compare`: 104 the same, 10 carried inside, 19 the app's own, 0 unplaced, 0 in the package that neither app runs. 898 unit tests, lint 0 errors, `lint:rules` 0, `.gates-count.json` unchanged, `registry:check` current — the package's own 81 entries identical field by field to schema 1's.

**A, B and C, built in the package (18 September).** Her picks, from photos in Peek's Storybook: B — `EmptyState` takes an `action`, drawn as the package's Button, **outlined**, 16px under the line, with **16px icons**; C — `Banner` takes an `icon` and an `action` and Peek's composer strip becomes a Banner in the **`info` tone** (her option 2); A — `ContainerHeader` moves in as it looks, with the buttons as an `actions` slot of IconButtons rather than Peek's three presets. Proved in Peek's Storybook, pixel for pixel: A identical to Peek's own for all seven ways its six screens draw it; B and C identical to the photos she picked from (the first B comparison differed by 859 pixels — the Storybook's dot grid, drawn over the page, landing differently on two boxes at two heights; compared at the same spot, identical). Found on the way: three of Peek's header buttons do nothing when pressed — People's "New conversation" and "Sort by", Topics' "Sort by". Moved as they are; listed for Katerina.

**Found beside it.** UIG-10's relay check runs in both apps, and the ticket list did not name them as holding a part; now it does, and §15's parts arithmetic is recounted (19 in Peek, 18 in Ship). The ticket's example `PendingAttachmentChip` no longer exists: it became the package's `AttachmentCard` in UIG-27.

**Not in this ticket, on purpose.** Stories for reusable parts are UIG-19's. A story of its own — one whose `component` is the part, or whose file is named after it — shows 64 of Peek's 124 own parts and 17 of Ship's 50; of the reusable ones and the candidates, 28 of 53 and 5 of 12. That is UIG-19's starting gap. The usage pages are UIG-17's and UIG-18's. Deleting the four unused parts, and moving any candidate, is Katerina's call after she has seen them.

**Released and taken (18 September, late night).** estiva-ui PR #67 was merged by Katerina (`d480b3c`), tagged `v0.23.0` and published by the release job (run 35370213014). Peek PR #259 and Ship PR #163 took 0.23.0, merged and deployed. By her ruling the ticket did more than describe: A moved one part into the package, and D removed six from Peek — its own `ContainerHeader` and `ComposerBanner`, `HighlightsCard`, `SkeletonHuddleGrid`, `SkeletonHuddleCard` (her call when she saw the photos) and the `PeekLogo` wordmark, each with its story. `PeekLogoMark` and `PeekApp` stay. She kept the three header buttons that do nothing when pressed as they are. Peek's main gained `DmVisibilityProvider` (hiding a DM) while the PR was open; it arrived described, and the merged code counts as below.

| on the merged code | files (.tsx, no stories or tests) | hold a part | hold none | parts | handed on | reusable | one-off | candidate | unused |
|---|---|---|---|---|---|---|---|---|---|
| Peek | **123** | 117 | 6 | **138** | 20 | 50 | 67 | 0 | 1 |
| Ship | **74** | 73 | 1 | **91** | 41 | 12 | 38 | 0 | 0 |

With the package's 82: **311** names, **250** without the pass-ons. From 143 to 138 in Peek: 6 removed, 1 added by main. Peek's handed-on 19 became 20 with `SkeletonSidebarList`; every candidate became reusable or went, by her ruling. On the merged code, both apps pass typecheck, `lint:rules`, `registry:check`, their tests (Peek 1,651, Ship 494) and their build.

**Commands.** `npm run ui:find <words>` (estiva-ui, Peek, `npm --prefix web …` in Ship); `npm run registry:check`; `npm run registry` writes an app's `registry.json` on request, ignored by git.

### UIG-12: building it

**Where.** estiva-ui branch `gates/12-registry` → **PR #61, merged (`bbd4ecd`)**, built in worktree `estiva-ui-uig12` from `cf215a6` and removed after the merge. The doc pages themselves were not touched — writing their content is UIG-14 to UIG-16; this ticket only reads them.

**Released as 0.22.0, and taken by both apps.** estiva-ui PR #63 (merge `5a9a1f3`) moved the version and wrote the changelog — including the **0.21.1 entry that release never got**, written from its own commit — and the tag `v0.22.0` published it through the trusted publisher, with a signed provenance statement; npm `latest` is 0.22.0. The lockfile's version fields, which had still read 0.21.0, and its missing `estiva-ui` bin were fixed in the same PR. **peek PR #251 (`6b1f916`) and ship PR #162 (`13b5ee0`) took it**, each with the lockfile edited by hand — the range, and the package's version, tarball, integrity and new `estiva-ui` bin — because npm on Windows drops the optional Linux entries CI installs; `npm ci` accepted both, which checks the integrity against the real tarball. Both merged green and deployed. **`npx estiva-ui find` was run from inside each app** and answered from the catalogue shipped in the installed package: `Link`, with its `truncate` prop, in Peek; `Popover` in Ship's `web/`. Nothing changes at run time: between 0.21.1 and 0.22.0 the components moved only by thirteen doc comments, and the dependencies, peers and their meta are identical — compared on the registry before editing.

**0.22.0 is not the release UIG-11 waits for.** It carries `create-estiva-app` unchanged from 0.21.x, and UIG-10 was reopened the same day (§0) because a made app is not connected to the relay. The UIG-11 row in "What is ready" says so.

**What it is.** `registry.json` at the package's root, committed and shipped, plus `src/registry/` — the schema, the builder, the search and the command — and `estiva-ui` as a bin of the package beside `estiva-gates` and `create-estiva-app` (§23: one copy, in the package). An app runs `estiva-ui find` against the `registry.json` inside its installed `@estiva-app/ui`, with no checkout of this repo.

**Why a parser and not a filename.** The components are flat in `src/`, with `.tsx`, `.mdx`, `.stories.tsx` and sometimes `.test.tsx` side by side, and the ticket warned that pairing by filename gets `FieldLine` and `MenuItem` wrong. It is worse than that: **a file is not a component.** The target set is what `src/index.ts` exports, read with TypeScript's own parser, and every other file is looked up from there.

#### The four counts, reconciled

The ticket's counts were taken on 12 September. Both columns are real; nothing was averaged away.

| thing | 12 Sept | 18 Sept | what it is |
|---|---|---|---|
| value exports from `index.ts` | 65, in 45 export lines (the ticket's "45" was the lines; corrected 19 September, UIG-16) | **81** | the target set. 91 further exports are types, which are not entries |
| component `.tsx` files | 44 | **52** | plus `cn.ts`, which is a helper, makes **53** files that export a value |
| `.mdx` doc pages | 46 | **54** | |
| `.stories.tsx` files | 46 | **54** | the same 54 names as the pages |

**81 names over 53 files.** Eleven files export more than one name; the 28 extra names are the entire difference between 53 and 81.

| file | names | which |
|---|---|---|
| `Menu.tsx` | 7 | `EnterHint`, `Menu`, `MenuItem`, `MenuPanel`, `MenuRow`, `MenuSection`, `MenuSub` |
| `CommandPalette.tsx` | 6 | `CommandPalette`, `CommandPaletteAnswer`, `CommandPaletteForm`, `CommandPaletteQuote`, `CommandPaletteSearch`, `CommandPaletteWorking` |
| `InlineChip.tsx` | 4 | `INLINE_CHIP_CLASSES`, `INLINE_CHIP_TONE_CLASSES`, `InlineChip`, `inlineChipClassName` |
| `Toolbar.tsx` | 4 | `Toolbar`, `ToolbarButton`, `ToolbarInput`, `ToolbarSeparator` |
| `Avatar.tsx` | 3 | `Avatar`, `hueFor`, `initialsFor` |
| `Skeleton.tsx` | 3 | `SkeletonBar`, `SkeletonList`, `SkeletonRow` |
| `Toast.tsx` | 3 | `Toast`, `ToastProvider`, `useToast` |
| `Tooltip.tsx` | 3 | `Tooltip`, `TooltipProvider`, `WithTooltip` |
| `ChipInput.tsx` | 2 | `ChipInput`, `InputChip` |
| `Field.tsx` | 2 | `Field`, `FieldLine` |
| `IdentityMenu.tsx` | 2 | `IdentityMenu`, `IdentityPanel` |

**54 pages over 53 files, and 53 of them named after an export.** The four names a filename would get wrong, each checked:

| name | what it is |
|---|---|
| `FieldLine` | a page and stories of its own, declared in `Field.tsx`. Not a file |
| `MenuItem` | a page and stories of its own, declared in `Menu.tsx`. Not a file |
| `Skeleton` | `Skeleton.mdx` and `Skeleton.stories.tsx` exist and **no export is called `Skeleton`**: the page is for the family `SkeletonBar` / `SkeletonList` / `SkeletonRow`. It is the one page of the 54 that is not an entry's name |
| `cn` | `cn.ts`, the only module with no page and no stories. A helper, and the one entry with no id — see below |

**81 = 74 components + 6 helpers + 1 hook.** The helpers are `cn`, `hueFor`, `initialsFor`, `INLINE_CHIP_CLASSES`, `INLINE_CHIP_TONE_CLASSES` and `inlineChipClassName`; the hook is `useToast`. **74 is UIG-9's count of the package's parts, reached a second way and by a different route** — UIG-9 counted what the rule covers, this counts what `index.ts` exports.

**Nothing is excluded.** Every one of the 81 is an entry, helpers and the hook included, each marked by `kind`. The schema still fails the build unless `entries + excluded` equals the value exports of `index.ts`, so the count has to reconcile out loud rather than by eye.

#### Where each line comes from

`purpose` is one sentence. **53 names have a page of their own** and take it from the page's opening paragraph. **28 are documented inside a sibling's page** — `MenuSub` is explained in `Menu.mdx`, not on a page of its own — and take it from the doc comment above the export.

Of those 28, **15 already had a comment and 13 did not**. The thirteen were written here, one line each, in the component files: `hueFor`, `InputChip`, `WithTooltip`, `MenuPanel`, `MenuSub`, `CommandPaletteSearch`, `CommandPaletteForm`, `IdentityPanel`, `ToolbarButton`, `ToolbarInput`, `ToastProvider`, `useToast`, `SkeletonBar`. Nothing rendered changed, and no doc page was edited.

**A comment, not a page, on purpose.** Those thirteen are parts of something else — `MenuSub` is a row of `Menu`, `ToolbarButton` an item of `Toolbar` — and a page each would put thirteen entries in Storybook's sidebar for things that are not separate components. The sentence lives next to the code instead, where whoever edits it sees it. **The builder fails the build when an export has neither**, so this cannot quietly rot.

#### What it found

| | what | now |
|---|---|---|
| ✅ | **11 of the 81 story ids resolved nowhere.** Storybook runs an export name through lodash's `startCase` before the id: `WithCounts` is the story "With Counts" and the id `navigation-tabs--with-counts`, not `--withcounts`. Only a real `storybook build` said so. | The builder does the same. **Every one of the 81 docs and story ids was then checked against that build**, and all resolve. Seven of them are written into the test, so CI holds the derivation without building a Storybook |
| ✅ | **"scrolling" found `Avatar`.** The search matched a query word against any word one was a prefix of, and `person's` puts the word **"s"** in Avatar's text — which every query on earth begins with | A prefix match now needs three letters at least |
| ✅ | **`SkeletonBar` was given its file's header paragraph**, which describes the whole Skeleton family. `Skeleton.tsx` opens with it and the export follows directly, so it read as that export's own — right-looking, and wrong | The builder refuses a file header, which turned it into a build failure naming the export. `SkeletonBar` then got a line of its own. `INLINE_CHIP_CLASSES`, which has a header above it *and* a comment of its own, keeps the comment |
| ✅ | **Two components' options were missing.** The ten-entry spot check the ticket asks for found `SectionLabel`, which writes its props out at the parameter instead of naming a type; a sweep of all 53 files then found `TextInput`, whose `size` is `forwardRef`'s second type argument while the inner function's parameter is bare | The builder follows an inline shape, an intersection, `Omit`, `Pick` and `forwardRef`. The sweep is a test: every set of words a component file declares must appear in that file's entries |
| ✅ | **The catalogue carried 33 of 336 props.** Only word-choices (`variant: primary \| outlined`) were read; `Link`'s `truncate`, and ~300 others, were not. **Katerina asked why, and she was right:** the ticket's field list says `variants`, but its plain words say the catalogue is "every component, what it is for, **what it can do**" — and 33 of 336 is not that. A session that cannot see `Link` already truncates writes truncation by hand, which is the exact duplicate this project exists to stop | Every entry carries `props`: each prop it declares itself, what it takes in a word a person reads, whether it is required, and its own note. **352 props, 210 with a note.** `variants` stays as the word-choice view, and the schema refuses a variant that is not one of the props. The file went from 62KB to 124KB — still nothing beside 54 pages of prose |
| ✅ | **`ui:find "truncate a long link"` answered with `Link`'s `external` prop.** The word **"a"** matched the "a" in its note ("in a new tab"): the three-letter minimum guards a *prefix* match, and an exact match short-circuits it | A small stop list, and query words under three letters are dropped. A question made only of stop words still answers rather than returning nothing. Only props the question names **by name** are shown; a note that happens to carry the word counts towards the score and stays quiet, or six of `Popover`'s notes saying "panel" bury the answer |
| ✅ | **Thirteen props were dropped because their names are quoted.** `'aria-label'?: string` cannot be written as an identifier, and the reader took identifiers only — so every accessible name this package declares was missing, over 10 files, **two of them required** (`Reaction`, `Toolbar`) | A quoted name is a name. All 13 are carried |
| ✅ | **`ToolbarButton` carried one prop and takes nine.** `ToolbarButtonProps extends IconButtonProps`, a type in another file of this package, and the reader stopped at the file it was in. `ToolbarInput` — `type ToolbarInputProps = TextInputProps`, a straight alias to another file — carried none | A named type's properties are its own plus everything it extends **within this package**, followed across files and through an alias. It stops at React and Base UI on purpose: `ButtonProps extends ComponentPropsWithRef<'button'>` is the DOM, and listing `onCopy` and `spellCheck` on every entry buries the answer |

| ✅ | **`ToolbarButton`'s props came out as prose.** `variant: "ats over what it a"`, `children: "omeAndEndK"`. A `ts.TypeElement` carries offsets into **its own** source text, so resolving an inherited prop with *this* file's `getText`, aliases and comment scan reads another file at those offsets. The names were right, so every name-based check passed — including the `react-docgen` one | A sibling never returns nodes. It returns finished props, read by the module that declares them, and the asking file only merges them. A test now parses every `takes` as a TypeScript type and rejects a name that is not a word anywhere in `src/` — it refuses all seven values the bug produced |
| ✅ | **`extends Omit<IdentityMenuProps, 'compact'>` was read as the name `Omit`**, so everything it wraps was lost. `IdentityPanel` was recorded as taking only `onClose` when it **requires** `me` and `signedIn`; `PersonTrigger` lost `name`, `picture`, `fallback` and `size` | A heritage clause is resolved whole, `Omit` and `Pick` included — and they now drop and keep the keys they name, so `compact` is absent from `IdentityPanel` and present on `IdentityMenu`. **`react-docgen` does not follow these either**, so those 12 props are the one place the registry is right and the second parser is wrong; they are listed by name in the test |
| ✅ | **`estiva-ui find` could not run in an app.** `cli.ts` imported the builder at the top, so the bundler put `typescript` in the same chunk as `find` — and `typescript` is a dev dependency. `npx estiva-ui find …` died with `ERR_MODULE_NOT_FOUND` before opening the JSON file it only needed to read | The builder is loaded with a dynamic import, inside `build` and `check` alone. `find` now pulls nothing but `node:fs`, `node:path` and `node:url` |

**Those three were found by `/code-review high` on the branch**, which is the one reviewer with no stake in this one's assumptions. All three were verified against the committed data before being fixed, and each is now a test.

**The two before them were found the same way, and it is the only way that works: by a parser that shares none of this one's assumptions.** `react-docgen` — what Storybook builds its own Props table with — was run over all 53 files and its props compared name by name against the registry's. **The two now agree on all 74 components**, bar four the registry is *meant* to leave out: `Button.type`, `IconButton.type`, `TextInput.type` and `SearchInput.placeholder`, DOM attributes none of them declares and each only gives a default while destructuring. That comparison is now a test (`registry.test.ts`), with those four named in it. It skips if `react-docgen` is ever absent rather than pretending to have run; it arrives with `@storybook/react-vite` and was deliberately **not** added as a dependency of its own, because npm rewriting `package-lock.json` on Windows drops the optional Linux entries CI installs.

**All 81 purpose lines were then read by hand.** None describes the wrong thing — the `SkeletonBar` class of fault does not recur. Two carry history after the purpose in the same sentence, so `firstSentence` keeps it: `EnterHint` ("…hand-rolled in five files before this") and `initialsFor` ("Peek's rule, sharpened: …"). Accurate, and left as they are.

#### What it does not carry

**`migrationStage` is in the schema and is always `null`.** The migration's plan lives in `K:/Estiva/migration docs`, which is not in this repo and is not in CI, and a copy kept here by hand is exactly the drifting list this project exists to remove. A reader gets an honest `null` rather than a stale number. The field stays because a later ticket may have a source a build can read.

**`storyUrl` is `storyId` and `docsId`, not a URL.** There is no Storybook on the internet yet (UIG-19), so an absolute link committed here would resolve nowhere. The registry carries the ids and the two path templates, and a reader joins its own base. The ticket's "every `storyUrl` resolves, or is recorded as absent with a reason" is kept, and the reason is **enforced rather than written**: the schema refuses a `component` with no page or story, so only a helper or a hook may have none. One entry has none — `cn`.

#### Commands

```
npm run registry           # write registry.json
npm run registry:check     # rebuild and compare; CI runs this
npm run ui:find -- "floating panel"
npx estiva-ui find "a list of actions"     # from an app, against the installed package
```

### UIG-32: building it

**Where.** estiva-ui branch `gates/32-app-folder` → PR #58, merged (`bd0a582`), released **0.21.1**; peek branch `gates/32-take-the-pieces` → PR #245; ship branch `gates/32-take-the-pieces` → PR #161. Built in worktrees `estiva-ui-uig32`, `peek-uig32` and `ship-uig32`, from the three mains `f1ef3ed`, `bf49e91` and `e371a0d`. Both apps were proved against a packed 0.21.1 before it was published, then moved onto the published one with a lockfile patched by hand — never regenerated on Windows, which drops the Linux-only entries CI needs.

**What each app replaced**

| piece | Peek | Ship | now |
|---|---|---|---|
| the editor hook | `.claude/hooks/gates.mjs`, 70 lines | 79 lines | `.claude/settings.json` runs the package's `dist/gates/cli.js hook` (Ship adds `--app web`) |
| the count writer | `scripts/gates-count.mjs`, 48 | 48 | `postlint:rules` runs `estiva-gates count --repo <name>` |
| the status engine | `scripts/gates-status.mjs`, 392 | 392 | `gates:status` runs `estiva-gates status` (Ship by path, `--app web`) |
| where the rules apply | `eslint.gates.js`, 41 | 41 | `gateConfig()`, with Peek's two extra folders passed in |
| the size-and-colour settings | `eslint.tokens.js`, 215 | 145 lines inside `web/eslint.config.js` | `tokenLint()` and `tokenValues()` |
| the check list | `scripts/gates-checks.mjs`, 176 | 167, moved to `web/scripts/` | `appChecks(h, …)` plus the app's own: Peek 12 checks, Ship 7 |

Which checks are an app's own was decided by `npm run gates:compare`, not by eye: a check stays in the app only if it reads a file only that app has.

**Nothing moved.** Each app's `gates:status` was photographed before the switch and compared check by check after it.

| | before | after | the difference |
|---|---|---|---|
| Peek | 62 checks | 64 | the new "no copy is left" check and "the debt list exists", both passing; and UIG-22's wording — "naming `ContainerHeader`" became "naming the header part", the same probe, still waiting on UIG-22 |
| Ship | 58 | 59 | the new "no copy is left" check, passing; and the same UIG-22 wording |

`.gates-count.json` did not change by a byte in either app. Peek's `npm run lint` read 92 errors and 102 warnings before and after, its token lint 0 errors, its gate lint clean; Ship's read 0 and 21, its gate lint clean. The editor hook refused a raw `<button>` in both, with the same message, and let the package's `Button` through.

**And CI still refuses one.** A scratch commit with a raw `<button>` was pushed to each pull request and dropped again: peek's job `gate` failed ("Use `Button` from @estiva-app/ui instead of a raw `<button>`", `estiva/no-raw-element`, run 35273767296), ship's the same, and its `web` job with it (run 35273725215). Both pull requests were green before the scratch commit and after it was dropped.

**The settings were measured, not assumed.** Before either copy was deleted, each app's token block was loaded beside the package's and compared as text: Peek's `tokenLint` and `tokenValues` were the package's character for character (10,942 and 7,131 characters), and Ship's, which sits inside its one lint config, matched piece by piece — the plugin's settings, each rule's setting, and where they apply. §23's table was right.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **Peek never had a debt list.** Ship has carried `docs/GATES-DEBT.md` since UIG-4; Peek's own check list never asked for it, so nobody noticed. The checks every app runs do. | Peek has one, and owes nothing: 0 errors from all three rules and from the token contract, no file excused, and its 16 escapes listed with what found them. Peek's `docs/` is not tracked at all (internal product docs), so that one file is excepted in `.gitignore` — a promise nobody else can read is not one. |
| ⛔ | **The status engine could only find a checks file in a repo's top folder**, and estiva-ui could only resolve a sibling's install there. Ship's app, its install and therefore its checks file are in `web/`. Ship could not have moved at all. | The engine, and estiva-ui's reading of a sibling, learned `--app`, the option the hook already had (0.21.1, PR #58, with a test). Ship's checks file is `web/scripts/gates-checks.mjs`; everything it names is still read from the repo's top folder. |
| ✅ | **Ship runs `gates:status` by path**, not by name: `estiva-gates` is a command in `web/node_modules/.bin`, while the script is in the top folder's `package.json`. Installing the package at the top folder instead would put React, Tailwind and the whole lint stack in a folder that has no app. | The shared UIG-32 check accepts either: `estiva-gates status`, or the package's `cli.js status` run by path. The hook was already written that way. |
| ✅ | **Peek's gate ignored two folders Ship's did not** — `demo-scenarios` and `convex/_generated`, written into its `eslint.tokens.js`. | `gateConfig({ ignores })` existed for exactly this; Peek passes them in. The gate reads the same files as before, proved by the identical counts. |
| ✅ | **`gates:compare` broke on the very change it measures.** It reads each app's checks file from git into a temp folder and imports it — and since UIG-32 that file imports `@estiva-app/ui/gates`, which resolves nowhere there; Ship's had moved to `web/` as well. Found by running it after both apps merged. | The import is pointed at this repository's own build, which is the list being compared anyway, and Ship's file is read from `web/`. It reads **94 the same, 10 carried inside a check that does more, 19 about an app's own code, 0 with nowhere to go** — more exactly the same than before, because the apps now run the package's checks verbatim. `NOT_IN_THE_APPS_YET` is empty: every check in `appChecks` is run by both apps. |
| 🧰 | Traps: a checks file must sit where `@estiva-app/ui` resolves, which is what decides where it lives in a repo whose app is in a folder of its own; and a consumer lockfile is patched by hand — 0.21.0 gave the package two commands and three more peers, so the entry needs its `bin` and `peerDependencies` as well as the version, the tarball and the integrity, or `npm ci` links no command. | — |

### UIG-10: building it

**Where.** estiva-ui: branch `gates/10-package-first` → PR #53 (§23 and the tickets it corrected), merged (`fee14fb`); branch `gates/10-create-app` → PR #54, merged (`65d2f8e`); its release run (35242714306) failed at `npm test`, and nothing was published. Branch `gates/10-release-fix` → PR #55, merged (`1a95b76`); the tag `v0.21.0` was moved to it and released **0.21.0** (release run 35243560890; npm latest). Built in worktrees `estiva-ui-docs10` and `estiva-ui-uig10`, from main `4d4bd64`; this record in `estiva-ui-rec10`, PR #56. The throwaway app: `K:\Estiva\uig10-throwaway`, dev server `:5310`, Storybook `:6100`; GitHub `estiva-app/uig10-throwaway` (private, about an hour, deleted after). `gates:status` from estiva-ui with Peek `1d7930a` and Ship `e371a0d`: UIG-10 **4 of 4**, UIG-32 1 of 5; 13 done, 1 started, 18 not started; 32 tickets, every repo agreeing. The plan Katerina read, with the photos: the artifact "What UIG-10 Makes".

**Katerina's rulings, 17 September**

| | question | ruling |
|---|---|---|
| T1 | "If a person outside of our team wants to create new repo using this command, they should not necessarily read ship and peek, right?" | Right: **package first** (§23 R1, R2). The command reads only `@estiva-app/ui`. |
| T2 | Which navigation does a new app get? | **The sidebar frame** that estiva-ui supports: `AppShell` solid + `Sidebar` + `NavItem`, not the rail (§23 R3). |
| T3 | Themes: a switcher, or one? | **"Just one theme"**, chosen when the app is made and set on `<html>` (§23 R4). |
| T4 | The copies found in phase 1 | **"update any doc or ship issue that needs to know about this so we never make that mistake again"**: §23's corrections, PR #53. |
| T5 | PR #53, already open | **"keep the PR and build on top of it"**: #54 was built on #53's branch; #53 merged first. |
| T6 | A private throwaway repo in `estiva-app`, for about an hour, to prove UIG-6 and the merge block | **Yes.** |
| T7 | Merge UIG-10 and publish 0.21.0 without asking again | **"yes sure"**. |

**Decisions taken while building it**, one line each:

- The status engine is TypeScript in `src/gates/status.ts`, built to `dist/gates/`; estiva-ui's `gates:status` builds first.
- The command has its own entry file: a split chunk cannot tell whether it was the file node ran.
- The gates build keeps `../eslint/index.js` external, so an app loads one copy of the plugin, not two.
- `eslint`, `typescript-eslint` and `eslint-plugin-better-tailwindcss` are optional peer dependencies. The count and the hook load ESLint from the app, not from the package.
- The hook runs by path: `node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook`. A `.bin` shim would not start on Windows.
- A made app owns no ticket. Its `gates:status` lists 18 rows as parts of tickets estiva-ui owns.
- estiva-ui reads a sibling through that sibling's own copy of the engine while it still has one. Otherwise it reads the engine the sibling has installed, so Leaf is read through its install.
- UIG-32's estiva-ui checks read Peek and Ship directly, until UIG-32 gives each app its own row. The first guess ("`./gates` is exported") would have marked it done on its own.
- The versions a made app gets for `@estiva-app/identity` and `eslint-plugin-react-hooks` come from the package's own devDependencies, or else from npm.

**What `@estiva-app/ui/gates` holds**

| piece | what it replaces |
|---|---|
| `tokenLint()`, `tokenValues()`, `TOKEN_LINT_IGNORES` | the token block in each repo's `eslint.config.js` (UIG-28) |
| `gateLint()`, `gateConfig()` | `eslint.gates.js` and the body of `eslint.gates.config.js` |
| `writeGateCount()`, `estiva-gates count` | `scripts/gates-count.mjs` |
| `runHook()`, `estiva-gates hook` | the logic in `.claude/hooks/gates.mjs` |
| `runStatus()`, `helpers()`, `estiva-gates status` | `scripts/gates-status.mjs` |
| `appChecks()`, `APP_TICKET_TITLES` | the checks every app runs in its `scripts/gates-checks.mjs` |
| `createApp()`, `appFiles()`, `create-estiva-app` | — (new) |

estiva-ui's own `eslint.gates.js`, `scripts/gates-count.mjs` and `scripts/gates-status.mjs` are deleted. Its hook is now a thin launcher, and its configs import the pieces with `audience: 'package'`.

**What `create-estiva-app <name>` makes.** `package.json` has the scripts `dev`, `build`, `typecheck`, `lint`, `lint:tokens`, `lint:rules` (+ `postlint:rules`: `estiva-gates count`), `gates:status`, `test` and `storybook`. The rest of the files:

- **Settings:** `.gitignore`, `.env.example`, `index.html` (with `data-theme`), three `tsconfig` files, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`.
- **The lint configs:** `eslint.config.js`, `eslint.tokens.config.js` and `eslint.gates.config.js`, each importing the package.
- **The gates:** `.claude/settings.json` (the hook), `scripts/gates-checks.mjs` (`appChecks`), `.gates-count.json` at zero, `docs/GATES-DEBT.md`, and `.github/workflows/deploy.yml` with the jobs `check` and `gate`.
- **The app:** `src/`, with sign-in (`auth/`), the frame (`App.tsx`), a home page with a story and a test.
- **The rest:** `.storybook/`, `README.md`, `CLAUDE.md`.

It refuses a folder that already exists. Every text is written by the package, so none can drift from it.

**"The same gate checks as Peek and Ship", proved by comparison.** `npm run gates:compare` reads Peek's and Ship's `scripts/gates-checks.mjs` from git at `origin/main`. It loads each with a recording set of helpers and writes down what every check does: which helper, and with which probe code, config and path. Ship's `web/` prefix is removed, and each app's real page is read as `<page>`. Every check must land in one group, or the command fails:

| group | Peek + Ship |
|---|---|
| the same as a check in `appChecks` | 81 |
| carried inside an `appChecks` check that does more (Peek and Ship wrote it two ways; the package's check runs both) | 20 |
| about the app's own code: reads its own source file, one its adoption deleted, or a ticket it owns other than UIG-3/UIG-4 | 19 |
| with nowhere to go | **0** |

`appChecks` has 52 checks, and none is missing from both apps. The exception is UIG-32's check, listed as waiting. A control run with one probe's text changed failed. The token and gate configs were compared too: estiva-ui's new configs resolve to the same ESLint config as Peek's, Ship's and its own old ones, 11 of 11, and 4 deliberate changes each showed a difference.

**UIG-6 on an app with no GitHub repo.** UIG-6's two checks are `main` requiring the check `gate`, and CI's job `gate` running `lint:rules`. The first asks GitHub. A folder with no GitHub remote reads ❔ ("no GitHub remote"): not a failure, and never a pass. On the throwaway it read ❔ until the repo existed. With a ruleset copied from estiva-ui's "gate on main" (same rules, no bypass), it read 2 of 2. A made app's README says to add that ruleset. For Leaf that is UIG-11's.

**Sign-in, locally, and what needs Jan.** A made app with no settings runs anonymous. With `VITE_ESTIVA_ID_ORIGIN=http://localhost:8787` (the local Estiva ID) and `VITE_ESTIVA_ID_CLIENT_ID=<app name>`, it signs in as its own app. That needs two things:

- a row in the local `app_credentials` table, with that `client_id` and the exact redirect URI (`http://localhost:5310/`)
- a person made with `pnpm invite` in estiva-id (`ROLE=admin` for the first)

Nothing local needs Jan. **Registering Leaf with the real Estiva ID does**, and that is UIG-11's.

**Lockfiles.** estiva-ui's lockfile was regenerated in a `node:24` container, and only the package's own entry changed. The throwaway was made, and its lockfile written, in a clean `node:24` container that held only the packed tarball: no Peek or Ship, and no estiva-ui checkout.

**Proof**

- **The package's own gates did not move.** Before and after moving onto the pieces:
  - `lint`: the same 139 messages
  - `lint:rules`: the same 6
  - the hook's refusal: the same text
  - `gates:status`: the same output, but for the one intended line ("runs its own copy of the status engine; UIG-32 moves it onto the package")
- **The package.** typecheck; `npm test` 816 (22 new: 15 for the pieces, 7 for the command); `lint` 0 errors, 139 warnings; `lint:rules` count unchanged; `gates:compare` 0 unplaced; CI green on #53, #54 and #55 (check, gate, a11y).
- **The throwaway, commit zero, on Windows and in GitHub Actions** (run 35240486784):
  - both typechecks, `lint`, `test`, `build`
  - the purge check
  - `lint:rules`, with the count unchanged
- **Its `gates:status`.** 18 rows. Every built ticket passes: UIG-2 1/1, UIG-3 9/9, UIG-6 2/2, UIG-7 7/7, UIG-8 9/9, UIG-9 4/4, UIG-27 2/2, UIG-28 8/8, UIG-32 1/1. The 9 unbuilt tickets read "not yet".
- **In Chrome:** the sidebar frame, light theme, anonymous. It signed in with a virtual passkey and showed the person's directory name in the identity menu.
- **The hook.** A real `claude -p` session in the throwaway was told to write a raw `<button>`. The hook refused it with the gate's message, and no file was written.
- **GitHub.** `estiva-app/uig10-throwaway` PR #1 adds one raw button:
  - `gate` and `check` both failed, naming `Button`
  - the merge was refused ("the base branch policy prohibits the merge"), and refused with `--admin` too
- **A package change reaches the app with a version bump.** The throwaway took a tarball with UIG-32's check by changing `package.json` and its lockfile only: 17 rows became 18.
- **From npm, after the release.** The reproduce command below made the same app from published 0.21.0 in a clean `node:24` container: `npm install`, `lint:rules` 0 (count unchanged), `typecheck`, and `build` all passed. File by file it differs from the throwaway in three ways only: the package version, the two doc lines #54 changed, and the count file's timestamp.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **The made app's `CLAUDE.md` named `docs/GATES-GUIDE.md` in estiva-ui**, a private repo. | It names the package's README, which ships (#54). |
| ✅ | **The printed next steps said `git init`**, which made `master`; the made app's CI runs on `main`. | `git init -b main`. |
| ✅ | **The first 0.21.0 release run failed.** The gate tests load a config file that imports the built `dist/gates`. In the check workflow `npm run lint` builds before `npm test`, which hid it, but `release.yml` runs typecheck, test, build with no lint. | `pretest` builds (#55), proved by deleting `dist` and running `npm test`. Nothing had been published; the tag moved to #55's merge. |
| ✅ | **UIG-32's first-guess check would have passed** the day `./gates` was exported, marking the ticket done. | It reads Peek and Ship now; 1 of 5. |
| ✅ | **§23's first wording** said the token block was the same in all three repos. It is the same in Peek and Ship only. | Corrected in #53 before merging, with the tickets. |
| ⚠️ | **The local Estiva ID could not issue a token**: "No available key-encryption key for this envelope (needs one of: test-1)". Its signing key had been sealed with a test key the local settings do not hold. | Retired locally so a new key was minted; put back after. For Katerina (and Jan, if it recurs): a local database carrying a key from a test run. |
| 📝 | **The made app asks for `/favicon.ico` and gets a 404**: there is no favicon. | Left; an app adds its own. |
| 📝 | **npm 11.19 holds back esbuild's install script** in a fresh install ("npm warn install-scripts … `npm install-scripts approve <pkg>` to allow"). `lint:rules`, `typecheck` and `build` passed without it; Storybook was not started from that install. | Watch for it in UIG-11; approve esbuild if Storybook needs it. |
| 🧰 | Traps: a running dev server holds a native binary, so `npm ci` fails with EPERM (stop it first); an esbuild split chunk cannot tell whether it was invoked (give a command its own entry); a heredoc or `node -e` mangles backslashes in a regex (write the file); `git show <ref>:<path>` needs `MSYS_NO_PATHCONV=1` in Git Bash; the main checkouts lag `origin/main` (run with `GATES_PEEK`/`GATES_SHIP` at fresh worktrees); jsdom warns about the engine on node 24.11 locally, CI is fine. | — |

**Reproduce.**

```sh
# in estiva-ui
npm run gates:compare                        # the checks, against Peek's and Ship's origin/main
GATES_PEEK=<peek at main> GATES_SHIP=<ship at main> npm run gates:status

# a made app, from npm alone, in a clean container
docker run --rm -it -v "$PWD:/work" -w /work node:24 \
  sh -c 'npx -y -p @estiva-app/ui create-estiva-app leaf --title Leaf && cd leaf && npm install'
```

#### Reopened, 18 September: the relay half

**Where.** estiva-ui: branch `gates/10-reopen` → PR #62 (the record: reopened), merged (`8cffc28`); branch `gates/10-relay` → the relay half, built in worktree `estiva-ui-relay10` from main `8cffc28`, to release as 0.23.0. Ship: UIG-10 back to In Progress with a "Reopened" section on top of the original; UIG-11 notes it waits for this release. The plan Katerina read: the artifact "The Estiva App Starter".

**Rulings, 17–18 September**

| | question | ruling |
|---|---|---|
| R1 | Does a new app get `protocol`, `platform` and `interop`? | Jan: "protocol, platform and interop should all be baked in". Katerina: "imagine it as a boilerplate repo. Anyone should be able to start from scratch with all the necessary dependencies and packages". |
| R2 | `interop` too, with no other app's objects to show yet? | Yes. |
| R3 | The relay, by default | Empty, like sign-in. |
| R4 | The home page | Shows the relay, the state and the signed-in name. |
| R5 | A new ticket, or UIG-10 reopened? | Reopened. |
| R6 | A helper in `@estiva-app/platform`, with Peek and Ship moved onto it? | **No** (B). ADR 0002 §10: functionality lands in a real app first and is packaged afterwards; a helper only a new app calls has one caller, and makes three copies of the wiring instead of two. The command writes the wiring into each app. Jan knows. |
| R7 | Prove "connected, signed in" here, by fixing the local Estiva ID? | **No** (B): Leaf proves it. |

**What a made app gets now**, beside what it had:

- `package.json`: `@estiva-app/protocol`, `@estiva-app/platform` and `@estiva-app/interop`, their versions asked of npm when the app is made. `ASKED_OF_NPM` in `create-app.ts` lists everything the package does not use itself, and a test holds it to the made `package.json`.
- `.env.example`: `VITE_RELAY_URL=`, empty. `src/config.ts`: `RELAY_URL` beside `ID_CONFIG`, and `relayLabel()`.
- `src/relay/client.ts`: `createLiveClientHolder()` at module level; `relayClient()`, `null` with no relay or no sign-in; the credential read on every connect; `signViaEstivaId` with `expectedPubkey` always passed; `browserOnlineSource(window)`; `subscriptionPrefix` the app's name; `KINDS`, exported and empty.
- `src/relay/useRelayState.ts`: `useSyncExternalStore` over the client's `state()` and `onState()`. Not a state set inside an effect, which React's hooks lint refuses.
- `src/relay/client.test.ts`: no relay, no socket; a relay and no sign-in, no socket; one socket however often the client is asked. A fake socket counts them.
- The home page: the relay, its state and the name, or "Running alone". Stories `RunningAlone`, `Connecting` and `Connected`.
- README: "The relay", "What you fill in", and what the app's Estiva ID registration needs. CLAUDE.md: one connection per tab.

**The shared check.** `appChecks` gains UIG-10: an app holds one module-level `createLiveClientHolder()`, and no `createLiveClient(`, `createLiveRelay(` or `new WebSocket(` in its source (tests and stories left out). Measured on 18 September, both pass: Peek's main holds one (`src/nostr/liveTopics.ts`), Ship's one (`web/src/api/liveWorkspace.ts`), and neither opens a socket another way. Controls: two holders fail, a socket of the app's own fails, no holder fails, a second holder in a test file passes. Peek and Ship run it once they take 0.23.0.

**Proof**

- **The package:** build; typecheck; `lint` 0 errors (the same 139 warnings); `lint:rules` count unchanged; `gates:compare` 0 unplaced; the gates tests 28 of 28, 5 of them new.
- **Commit zero**, made in a clean `node:24` container from the packed package alone, unedited:

```
commit zero: 37 files
typecheck app: ok
typecheck settings: ok
lint: ok
.gates-count.json: unchanged
estiva/no-raw-element: 0 errors, 0 warnings, 0 escapes
estiva/no-rebuilt-behaviour: 0 errors, 0 warnings, 0 escapes
estiva/no-restyled-part: 0 errors, 0 warnings, 0 escapes
Test Files  2 passed (2)
Tests  4 passed (4)
build: ok
package classes survive the purge: ok
relay packages: @estiva-app/protocol@^0.21.0 @estiva-app/platform@^0.1.0 @estiva-app/interop@^0.23.0
git status after the checks: clean
```

- **In Chrome, with no relay set:** the page says "Running alone: no relay is set…", and **0** sockets were opened to the relay (counted with the DevTools protocol).
- **Not proved: signed in and connected.** See the next table.

**What building it found**

| | finding | what happened |
|---|---|---|
| ⚠️ | **Estiva ID signs the relay's handshake (kind 22242) only for a relay both the app and the deployment allow**: `relay_auth_urls` on the app and `SIGN_RELAY_AUTH_ALLOWED_URLS` on the deployment (`domain/policy.ts`). The handshake names the relay by its `ws(s)://` origin (`relayAuthUrl` in protocol). | In the made app's README, and in UIG-11: Leaf's registration needs 22242 and `wss://estiva.estiva.app`. |
| ⚠️ | **No app can sign in on this machine.** The local Estiva ID's active signing key is sealed with the key-encryption key `test-1`; the local settings hold another, so every token request answers 500 ("Estiva ID returned 500 exchanging the code"). UIG-10 found the same and put it back. It also allows no relay for the handshake, and Ship's local registration has no 22242. | Left as it is (Katerina, R7). The fix, when wanted: retire that key so a new one is minted, and set `SIGN_RELAY_AUTH_ALLOWED_URLS=ws://localhost:3000`. |
| 📝 | **A client connects when it is made**, not when something subscribes (`createLiveRelay` calls `connect()` at once). So with `KINDS` empty, "connected" is true, not a guess. | The home page reads the state. |
| ⚠️ | **The home page's empty state was not in the middle** (Katerina, after #65 merged). UIG-10's first page wrapped it in a box, `flex justify-center px-6 py-16`, which centred it sideways and pinned it 64px from the top. EmptyState's own page says a page's empty state goes straight into a flex column and centres both ways "with nothing to add". No gate reads a box around a part: the gates read what is passed into it. Two photo reviews missed it, UIG-10's and this one. | Fixed before release, branch `gates/10-centre`: the empty state goes straight into `main`, and the connection is a caption at the foot. Measured at 1280×720, 1600×950 and 900×600: 0px off centre both ways in the room it is given, which is 19.2px above the middle of the whole area (half the caption). A test holds the page to it. **Not closed: the wider gap.** A box that places or styles a part, and text or a screen drawn by hand (the starter's sign-in screen, its caption), still pass every gate. Katerina has not decided how to close it. |
| 📝 | **0.22.0 went to UIG-12** (PR #63), the same morning. | This releases as 0.23.0. |
| 📝 | The throwaway's local registration and the four local test people were removed afterwards: the local Estiva ID is back to Peek and Ship, and no people. | — |
| 🧰 | Traps: stopping a background `npx vite` leaves its `node` running and the folder locked, so stop it by its command line; `docker exec` needs `-i` to read a heredoc; the local Estiva ID's database user is `estiva`; the first local invite must be `ROLE=admin` while there is no admin; a Ship description written through `"$(cat f)"` loses its last newline. | — |

**Reproduce.**

```sh
# in estiva-ui: the package, then a made app from it alone, in a clean container
npm run build && npm pack --pack-destination ../proof && cd ../proof && mv estiva-app-ui-*.tgz ui.tgz
docker run --rm -v "$PWD:/work" -w /work node:24 bash -c \
  'npx -y -p ./ui.tgz create-estiva-app relay-proof --ui file:../ui.tgz && cd relay-proof && npm install && npm test'
```

### UIG-9: building it

**Where.** estiva-ui: branch `gates/09-classname` → PR #51, merged (`673526c`), released as **0.20.0** (tag `v0.20.0`, release run 35220018399; npm latest). Peek: branch `gates/09-classname` → peek PR #237, merged (`e411b77`), deployed (run 35221444918). Ship: branch `gates/09-classname` → ship PR #160, merged (`e371a0d`), deployed (run 35221482761). Built in worktrees `estiva-ui-uig09`, `peek-uig09` and `ship-uig09`, from mains `fcc9b1b`, `230042a` and `25a38cc`. Storybooks `:6540`, `:6541`, `:6542`. `gates:status` from estiva-ui with both apps' merged code: UIG-9 **21 of 21**; 12 done, 0 started, 19 not started; 31 tickets, every repo agreeing. The explainer and the picks Katerina read: the artifact "What UIG-9 Stops".

**Katerina's rulings, 16 and 17 September**

| | question | ruling |
|---|---|---|
| N1 | The first plan, in chat | "i am not technical… last time you made me an artifact" — redone as a page of real photos, drawings and plain words. |
| N2 | "Why not all the components? The goal was to prevent custom ones" | The page's "16 of our 73 parts" read as if the rule covered 16. It covers **every part** (74, not 73: `EnterHint` had been missed): parts are found by where they come from, so a part added later is covered. 16 was only where a look is passed in today. The other ways a custom part gets built were set out ticket by ticket, with **UIG-25 (a copied part) only warning** named as the gap. |
| N3 | Check the package too? | **"Yes to all … I agree to cover all of the parts"**: the rule runs inward, and the package's own 34 places are fixed or kept with a reason. |
| N4 | Build it and photograph; fix what looks the same without asking; merge and publish when picked and green | **Yes**, **yes**, **yes**. |
| N5 | Pick 1: Ship's link fields, monospace or plain like Peek's | **B, plain** — no `TextInput` prop. |
| N6 | Pick 2: Ship's loading block, 8px card corners or 4px like the other bars | **B, 4px** — no `SkeletonBar` prop. |
| N7 | Pick 3: a long web address, breaking mid-address as today, or kept whole on the next line | **A, as today**: "if link is too long, i want it to break in a new line anyway". Told that B also breaks a link longer than a line; A stands. |
| N8 | Six new props that look exactly the same | **Yes.** `Link truncate` was added beside them, for five title links, and she was told. |
| N9 | `AttachmentCard`'s own state looks and `Card` with `href` kept with a reason | **Yes.** |

**The rule, `estiva/no-restyled-part`** (acceptance: the allow-list recorded here). In `configs.recommended`, `strict` and `package`. A class passed into a part through `className` or an inner box's class prop (`contentClassName`, `bodyClassName`, `viewportClassName`, `wrapperClassName`) may only place it. `PLACEMENT`, exported from `@estiva-app/ui/eslint`:

| goes through | the utilities |
|---|---|
| space around | `m-*`, `mx-*` … `-m*` |
| space inside | `p-*`, `px-*` … (never on `EmptyState`) |
| width and height | `w-*`, `h-*`, `size-*`, `min-*`, `max-*` |
| shown, and how it lays out | `hidden`, `block`, `inline`, `inline-block`, `inline-flex`, `inline-grid`, `flex`, `grid`, `contents`, `flow-root` |
| its place in a row or a grid | `grow`, `shrink`, `flex-*`, `basis-*`, `order-*`, `gap-*`, `space-x-*`, `space-y-*`, `col-*`, `row-*`, `grid-cols-*`, `grid-rows-*`, `grid-flow-*`, `auto-cols-*`, `auto-rows-*` |
| alignment | `self-*`, `justify-*`, `items-*`, `content-*` (not `content-[…]`), `place-*` |
| position | `static`, `relative`, `absolute`, `fixed`, `sticky`, `inset-*`, `top-*`, `right-*`, `bottom-*`, `left-*`, `start-*`, `end-*`, `z-*` — ruling B8 says "position and spacing" |
| a name for hover | `group`, `peer` (and `/name`): they draw nothing |

Everything else is refused — colour, type, border, corner, shadow, cut-off and wrapping, clipping, effects — and so is any class behind a variant that draws another box or reaches inside (`before:`, `after:`, `[&…]:`, `*:`). A placement class behind a breakpoint, a theme (`signal:`) or a state variant goes through. Hand-written sizes (`w-[244px]`) go through; the token lint already warns on them. The message names the part's look props (`PART_LOOK_PROPS`, exported, held to the package's source by a test) or says the part has none yet, and says a look for what is around a part goes on your own element around it.

**Parts by where they come from, never by name.** An import from `@estiva-app/ui` (named or `* as`); an app file that re-exports one (`export { X } from`, `export *`, `export const Y = X`); a component that spreads its rest or props onto a part (Peek's `EmptyState`, `Avatar`, `SearchInput`, `RouterLink`); a component that hands its own class prop into a part's (Peek's `ConversationCard` into `Card`). Relative imports and `@/` (the `src` beside the nearest `package.json`) are followed, reading and parsing the file with the lint's own parser. Inside the package — a nearest `package.json` named `@estiva-app/ui` — a part is a name `src/index.ts` exports, imported from a sibling or declared in the file. A test generates one case per exported part, so a part added later has one.

**What it reads.** A string, a template, `cn()`/`clsx()`/`twMerge()` arguments, both sides of a condition, a `const` in the same file, a class map read from one (`MAP.key`, `MAP[key]`), a `const` object spread onto a part.

**What it cannot see.** A class worked out while the app runs, or imported from another file's `const`; props spread from a call (`{...linkTo(href)}`); `cloneElement`; a wrapper shaped differently from the two above. And, the big one: **a look-alike built from plain boxes**, which passes nothing into a part at all — UIG-25's copied part (a warning, ruling C2) and the registry and skill (UIG-12, UIG-20). Found while counting: Peek's `HuddleCard.tsx` still has `MemberAvatars`, the hand-drawn face stack `AvatarGroup` replaced; this rule cannot see it.

**The count** (acceptance: import analysis, following re-exports). The built rule, stories in, tests out, `.ts` and `.tsx` in the apps.

| repo | main | files | reported |
|---|---|---|---|
| Peek | `230042a` | 284 | **23**, in 18 files |
| Ship | `25a38cc` | 131 | **13**, in 10 files |
| estiva-ui (inward, N3) | `fcc9b1b` | 106 | **34**, in 17 files — 20 in components, 14 in stories |

Before building the rule, an independent TypeScript pass over git's copy of each main found the same 23 and 13: 234 class props reach a part in the apps (Peek 166, Ship 68); 198 only place it. Of the package's 74 parts, 16 have a look passed in, 19 are only placed, 39 are given no class by the apps.

**The arithmetic, against UIG-1** (§3 Family D: estiva-ui 8, Peek 15, Ship 8 — `className` only, stories out, padding allowed on `EmptyState`). The rule on UIG-1's commits (Peek `d094006`, Ship `6693025`, estiva-ui `89d27d6`): Peek 27 = **15** + 10 paddings on `EmptyState` (ruling 6 came after UIG-1) + 2 inner class props. Ship 14 = **7** + 6 `EmptyState` paddings + 1 story. estiva-ui 24 = **7** + 13 stories + 4 inner class props. Peek reproduces UIG-1's 15 exactly; Ship and the package come to one under UIG-1's 8 each, and UIG-1 did not record its list, so that one cannot be named. UIG-1's nine samples are all in today's count: Peek's reference widget `Person`, `FoldersPage`'s `EditableText`, `ComposeBox`'s glow; Ship's `IssueView` title, `NewProjectDialog`'s mono field, `IssuesTable`'s frame; the package's `Banner` ✕, `DialogShell`'s line, `Tooltip`'s motion. Every `EmptyState` padding had gone with UIG-27 (peek #218, ship #151).

**Peek: 23 = 16 fixed + 5 new props + 2 escaped. Ship: 13 = 7 fixed + 4 picked + 2 escaped. estiva-ui: 34 = 23 fixed + 5 new props + 6 escaped.** `.gates-count.json`: Peek `no-restyled-part` 0 errors, 2 escapes; Ship 0, 2; estiva-ui 0, 6.

**What changed in the apps**

| where | now | why |
|---|---|---|
| Peek: a huddle's and a thread's topic link, a reply's time, the reference widget's person and title | the look on a `contents` box around the part; `Link truncate` | the words take their look from where they sit; the part stays in the layout where it was |
| Peek: the Files panel's project name; Ship: the issues table's title | a box around the link; `Link truncate` | the same |
| Peek and Ship: the card that could not be read | its words in a box inside the card | `Card` draws the frame only (UIG-27 ruling 9) |
| Peek: the comment row; Ship: the issues table's frame | the line / the frame on a box of the app's own | a `Form` draws nothing; a region is not a frame |
| Peek: a long link in a message | its breaking on an inline box around the link | N7 |
| Peek: the folder name; Ship: a project's and an issue's title | the size on the box around `EditableText` (`contents` in Ship) | a field inherits the page's font, so no prop |
| Peek: the huddle card's reply faces | `AvatarGroup` | the conversation card's same row since 3 September; photographed identical |
| Peek: Resolve (dialog, quick menu), send, Bold/Italic/Underline, the huddle card | `resolve`, `glow`, `pressed`, `clip` | N8 |
| Peek: Textarea's `resize-none`, the Highlights label's `whitespace-nowrap`, Topic details' `[&>*]:shrink-0` | gone | each did nothing |
| Ship: the Peek link fields | plain | N5 |
| Ship: the loading block | 4px corners | N6 |
| Peek: the top bar's search | escaped | a picture of a field that opens the launcher; no part is a button that looks like a search field |
| Peek: the Files panel's ticket rows; Ship: the issue row and its project chip | escaped | a whole row that is one link, drawn by a layer over it; no part does that, and these rows are not cards |

**What the package gained** (0.20.0)

| part | what |
|---|---|
| `estiva/no-restyled-part` | the apps' third rule, and the package's fifth; `PART_LOOK_PROPS`, `PLACEMENT` exported |
| `IconButton` | variant `current` (the colour of where it sits: `Banner`'s ✕) and `resolve` (muted, green on hover in Signal); `pressed` (active fill, `aria-pressed`); `glow` (Signal). `ToolbarButton` has them all |
| `Button` | variant `resolve` (primary; outlined, green on hover in Signal) |
| `Card` | `clip` |
| `SectionLabel` | `tone` (`secondary` in `MenuSection` and `CommandPalette`: her ruling of 1 September, one fix for both, as estiva-35 pointed out) |
| `Link` | `truncate` |
| `Divider` | no inset inside a `Menu` or `Popover`, which tell it so (`DividerInPanel`), instead of reaching in with `[&>[role=separator]]:mx-0` |
| the package's own places | `ConfirmDialog`, `DialogShell`, `IdentityMenu`, `Breadcrumb`, `ReactionPicker` and the `Person`, `Property`, `ScrollArea` stories: the look on a box of their own. `Tooltip`'s motion on Base UI's popup. `PreviewCard`'s `[&>*]:shrink-0` and a file link's `cursor-pointer` gone, doing nothing. Escaped: `Card` with `href` drawn on `Link` (UIG-27 ruling 1); `AttachmentCard`'s failed or warning hairline, loading pulse, faded ×2, Download shown on the card's hover |

**Proof**

- **The rule.** 383 lint tests in `src/eslint`: every allowed and refused family, every route to a part (re-export by `@/` and relative path, barrel, renamed, wrapper, className-handing component, namespace, same-file wrapper), inner class props, a `const`, a class map, a spread object, `EmptyState`'s padding, an escape without a reason, both package cases; one generated case per exported part (74); the look-props table held to the package's source.
- **The package.** 794 tests; typecheck; `lint` 0 errors, 137 warnings as before; `lint:rules` 0 errors, 6 escapes; CI green (check, gate, a11y). The published tarball checked for the rule, the table, `DividerInPanel`, the resolve classes and the new props' types.
- **Photos** (D70). Package: every story in both themes, **620 of 620 identical**. Peek: all 352 stories, **345 identical**, the 7 others the huddle faces (sub-pixel ring edge, looked at). Ship: all 101, **97 identical**, the 4 others the link fields (N5). Each before-run confirmed to render the old code by a class this ticket removes.
- **In Chrome** (what a photo at rest cannot show): a divider in an open menu, 0 margins; a shown tooltip carries its motion and pill classes; a file link shows the pointer; a breadcrumb's crumbs cut, colour and size exactly as on the old code (run on both).
- **The apps, on published 0.20.0.** Peek: `lint:rules` 0; `tsc -b`; 131 files, 1,493 tests (one launcher test timed out once beside Ship's suite and passed alone). Ship: `lint:rules` 0; `lint` 0 errors, 21 warnings; `tsc -b`; 51 files, 494 tests; build. CI green on both; merged and deployed.
- **`gates:status`.** UIG-9's checks: estiva-ui 8 (the apps get exactly the three rules; the rule in the package's own set; the exports; a look refused naming the part; placement passing; `EmptyState`'s padding; an escape; the new props); Peek 7 and Ship 6 (a border into `Button`; placement; a re-export, a wrapper and a className-handing component followed; an escape against its control; a real page with none). **21 of 21.** UIG-8's check "the apps get exactly two rules" now reads that they get its two, as UIG-7's was widened.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **The ticket's counts were UIG-1's**, its `cn()` trap was retired on 1 September, and "shared components use arbitrary values" ended with UIG-28. | Counted with the rule; the arithmetic above. |
| ✅ | **Wrappers and forwarders.** On the mains, five app components spread their props onto a part (Peek's `EmptyState`, `Avatar`, `SearchInput`, `RouterLink`; Ship's `NavItem`) and 24 hand their own `className` on (13 in Peek, 11 in Ship). A name search and a re-export search both miss them. | The rule follows both shapes. |
| ✅ | **My page said "16 of our 73 parts"**, which read as a rule for 16; and the package has 74 parts. | N2; corrected on the page. |
| ✅ | **The huddle card's clip is needed**: without it the "Huddle" strip's square corners stick out of the round card (photographed). | `Card clip`. |
| ✅ | **The huddle card's reply faces were a hand-drawn copy** of a row the conversation card had moved to `AvatarGroup` on 3 September, four faces where the rule is three. | `AvatarGroup`, photographed identical. |
| ✅ | **`EditableText` needs no size prop**: a field inherits the page's font, so the size goes on the box around it. | No prop; its page says so. |
| ✅ | **A box around a link can shift a layout** — a flex item's `min-width`, or a line box's strut under an inline wrapper with a different font. | Boxes that only hand a look on are `display: contents`; a box that must draw (a line, a frame) or carry text is a block. |
| ✅ | **Menus reached into their dividers** (`[&>[role=separator]]:mx-0`). | `DividerInPanel`; checked in Chrome. |
| 📝 | **Package gaps, for later tickets:** a row that is one link (Peek's ticket rows, Ship's issue row); a search field that is a button (Peek's top bar); `Card` with a failed, loading or faded state and `IconButton` shown on its card's hover (`AttachmentCard`). | Escaped with reasons; listed in "What is ready". |
| 📝 | **Peek's `MemberAvatars`** (in `HuddleCard.tsx`) is the face stack `AvatarGroup` replaced, drawn from plain boxes. | Not this rule's to see; UIG-25's. |
| 🧰 | Traps: a patch script's exact-text edit misses on CRLF files — normalise first and write back with the file's own line endings; a Storybook started from a background task keeps its child server alive after the task stops — stop the process on the port; backticks inside a generated HTML template literal break the page builder; two test suites side by side time a launcher test out. | — |

### UIG-8: building it

**Where.** estiva-ui: branch `gates/08-the-reach` → PR #49, merged (`d76b30b`), released as **0.19.0**. Peek: branch `gates/08-the-reach` → peek PR #236, merged (`230042a`), deployed (run 35131022066). Ship: branch `gates/08-the-reach` → ship PR #159, merged (`25a38cc`), deployed (run 35131017665). Built in worktrees `estiva-ui-uig08`, `peek-uig08` and `ship-uig08`, from mains `15216a6`, `02e5f04` and `27113cd`. Storybooks `:6530`, `:6531`, `:6532`. `gates:status` from estiva-ui with both apps' merged code: UIG-8 **23 of 23**; 11 done, 0 started, 20 not started; 31 tickets, every repo agreeing. The explainer Katerina read, with every photo she picked from: the artifact "What UIG-8 Stops".

**Katerina's rulings, 16 September**

| | question | ruling |
|---|---|---|
| M1 | The / @ !@ [ menus: keep their hand-written roles and keys with reasons, as the ticket said? | **Yes.** And, on her question whether Base UI and Tiptap could do it one day: a shared part, **UIG-31**, created for "much later". |
| M2 | Add to Open work's rows onto the package `Checkbox` | **Yes**, and from the photos **B**: `Checkbox` gains a row form, pixel for pixel today's rows. A (the Checkbox as it was: box on the left, no icon, no fill) was not taken. |
| M3 | The other places that keep their behaviour, each with its reason | **Yes.** |
| M4 | Ship's code blocks: kept with a reason, as first proposed? | **No — they wrap, like Peek's.** Her question "why do they need to stay?" found the reason wrong: Peek has wrapped a long code line since her ruling of 11 September, Ship never took it, and Ship's own editor already wrapped while its reading surface scrolled. |
| M5 | The scroll example in Peek's Storybook onto `ScrollArea` | **Yes.** |
| M6 | Our scrollbar hides behind sticky date lines, in Peek's message lists too: fix it in this release? | **Yes.** |
| M7 | The first plan, in tables | "I dont even understand you at all" — redone as a page of photos and drawings in plain words; the decisions a designer does not need to take (the rule reads `.ts`; Enter and Escape while typing are not read; `aria-expanded` and `aria-pressed` wait for UIG-14) were taken and said on the page. |
| M8 | Push, merge and publish | "Do everything yourself, all the prs and the merges." |

**The behaviour list** (acceptance: derived from the package source). Which `@base-ui/react` module each component imports was read with the TypeScript parser; what each module owns was read from Base UI 1.8.0's own source (roles, keys, `useDismiss`, `FloatingFocusManager`, `useListNavigation`, `CompositeRoot`, `useScrollLock`, each Positioner's `autoUpdate`). It lives in the rule as `OWNED_BEHAVIOURS`, exported from `@estiva-app/ui/eslint` for UIG-12's registry, and a test holds its tables to the source.

| behaviour | Base UI does it in | the error names | the rule reads |
|---|---|---|---|
| is built on Base UI | every module (the table below) | the component built on it; "ask Katerina" for one no component uses | an import from `@base-ui/react` (and `@base-ui-components`) |
| floats on top of the page | Dialog, AlertDialog, Popover, Menu, Select, Combobox, Autocomplete, Tooltip, PreviewCard, Toast | `DialogShell`, `ConfirmDialog`, `CommandPalette`, `Popover`, `Menu`, `Select`, `ChipInput`, `Tooltip`, `PreviewCard`, `Toast` | `createPortal`, called, or imported and never called |
| closes on a press outside | Dialog, AlertDialog, Popover, Menu, Select, Combobox, Tooltip, PreviewCard | `Popover`, `Menu`, `Select`, `DialogShell`, `PreviewCard` | a `mousedown`, `pointerdown`, `click` or `touchstart` listener on `window` or `document` |
| closes on Escape and takes its keys | the same, and Toast | `DialogShell`, `Popover`, `Menu`, `Select`, `Tabs`, `Toolbar` | a `keydown`, `keyup` or `keypress` listener on `window` or `document` |
| holds focus inside, gives it back | Dialog, AlertDialog, Popover, Menu, Select, Combobox | `DialogShell`, `CommandPalette` | a `focusin` or `focusout` listener on the page; the Tab key compared by hand |
| stops the page scrolling behind | Dialog, AlertDialog | `DialogShell` | `overflow` written into `document.body`'s style |
| stays attached to its anchor | every Positioner | `Popover`, `Menu`, `Select`, `Tooltip`, `PreviewCard` | a `scroll` or `resize` listener on the page |
| moves through items with the arrow keys | Menu, Select, Combobox, Autocomplete, Tabs, Toolbar | `Menu`, `Select`, `ChipInput`, `CommandPalette`, `Tabs`, `Toolbar` | ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End, PageUp or PageDown compared by hand, once per handler |
| says what it is | the part that sets each role | `DialogShell`, `ConfirmDialog`, `Menu`, `Select`, `ChipInput`, `CommandPalette`, `Checkbox` `row`, `Tabs`, `Toolbar`, `ProgressBar`, `Checkbox`, `Divider`, `Button`, `IconButton`, `Link`, `Tooltip`, `WithTooltip`, `FieldLine`, `Banner`, `Toast` | a hand-written `role`: dialog, alertdialog, menu, menuitem, menuitemcheckbox, menuitemradio, listbox, option, combobox, tablist, tab, tabpanel, toolbar, progressbar, checkbox, separator, button, link, tooltip, alert, status; and, with "ask Katerina", menubar, switch, radio, radiogroup, slider, spinbutton, meter |
| is reachable with Tab | Button, Toggle, Checkbox, Tabs, Toolbar, ScrollArea | `Button`, `IconButton`, `Link` | `tabIndex` that can be 0 or more, on an element that is not a control |
| scrolls with our scrollbar | ScrollArea | `ScrollArea` | `overflow-auto` / `-scroll` (x or y, behind any variant, `[&_pre]:` included) in any string, or `overflow: 'auto'`/`'scroll'` in a style |

Three facts from Base UI's source the list rests on, each different from what one would assume: **Base UI's Tooltip sets no role at all** (the package's `Tooltip` writes `role="tooltip"` itself); **Dialog never writes `aria-modal`**; `alert` and `status` on a line of words are the package's own (`FieldLine`, `Banner`), not Base UI's.

The Base UI modules, and the component each error names: alert-dialog `DialogShell` · autocomplete `CommandPalette` · avatar `Avatar` · button `Button` · checkbox `Checkbox` · collapsible `CollapsibleSection` · combobox `ChipInput` · dialog `DialogShell` · field `Field` · fieldset and form `Form` · input `TextInput` · menu `Menu` · popover `Popover` · preview-card `PreviewCard` · progress `ProgressBar` · scroll-area `ScrollArea` · select `Select` · separator `Divider` · tabs `Tabs` · toast `Toast` · toggle `Reaction` · toolbar `Toolbar` · tooltip `Tooltip`. **No part yet** (ask Katerina): accordion, checkbox-group, context-menu, drawer, menubar, meter, navigation-menu, number-field, otp-field, radio, radio-group, slider, switch, toggle-group, and Base UI's helpers (use-render, merge-props, types…).

**What this rule cannot see.** Said plainly, because a lint that looks for scrolling boxes is easy to mistake for one that finds scrolling bugs:

- **A box that should scroll and does not.** A class rule finds the scrolling box built by hand; it cannot find the one that was never built. Peek's Folders column is the case: at `72c999c`, the commit before `3dc663b` fixed it, `FoldersPage.tsx` has **no overflow class at all** (read with the TypeScript parser; the page's other column already sat in a `ScrollArea`). Only a check that opens the page and scrolls it — the route probe, a later phase — can find that.
- Opening after a hover delay (Tooltip 600 ms, PreviewCard 600 / 300 ms), the open and close animation, a toast's timers.
- Measuring and placing by hand, for UIG-5's reason: `Popover` takes a rectangle to hang from.
- A listener on a variable that holds the document.
- **Not read on purpose:** Enter and Escape compared by hand (in a field or an editor they are typing; `Form` and `EditableText` own the ones that send or cancel), and `aria-expanded` / `aria-pressed` written on a package component (the component is already the package's; UIG-14's usage rules).

**The count** (acceptance: with the rule or an AST pass). The built rule, on git's copy of each main, `.ts` and `.tsx`, stories in, tests out.

| repo | main | files | reported |
|---|---|---|---|
| Peek | `02e5f04` | 284 | **15**, in 13 files |
| Ship | `27113cd` | 131 | **4** |
| estiva-ui (exempt; the acceptance's proof) | `15216a6` | 116 | **36** Base UI imports in 29 files — 34 naming a part, 2 helpers. The ticket's **22** was UIG-1's. |

**The arithmetic, against UIG-1's count** (Peek `d094006`, Ship `6693025`, recounted on those commits with the same script: every number in UIG-1's table reproduced). Fixed + escaped + gone + not reported = UIG-1's count, per behaviour; what UIG-1 did not count is named.

| behaviour | app | UIG-1 | gone before UIG-8 | fixed | escaped | not reported, by design |
|---|---|---|---|---|---|---|
| Base UI import | both | 0 / 0 | — | 0 | 0 | — |
| `createPortal` | Peek | 2 | 1 — the launcher (peek #233) | 0 | 1 — the picture viewer | — |
| key listener on the page | Peek | 2 | — | 0 | 2 — the huddle starter, Ctrl+K | — |
| press listener on the page | Peek | not counted | — | 0 | 2 — the huddle starter, the selection toolbar | — |
| arrow keys by hand | Peek | not counted | — | 0 | 3 — the / @ [ menus | — |
| hand-written role | Peek | 7 | 2 — `alert` in the launcher (peek #233), `progressbar` (peek #218) | 1 — Add to Open work's `option` | 1 — the freshness dot's `status` | 3 — `img` on the logos |
| hand-written role, added since | Peek | — (stage 5, peek #201) | — | 0 | 4 — the menus' `option` ×3 and `listbox` | 6 `group` |
| `tabIndex` 0 | Ship | 1 | — | 0 | 1 — the description's reading surface | — |
| scrolling box | Peek | 2 | 2 — the launcher's list (peek #233), the huddle picker's (peek #201) | 1 — the DateDivider story (UIG-1 left stories out) | 0 | — |
| scrolling box | Ship | 1 | — | 1 — `prose.ts`, which now wraps | 0 | — |
| hand-written role | Ship | 4 | 1 — `progressbar` (ship #151) | 2 — the two upload error lines | 0 | 1 — `img` on a status shape |

**Peek: 15 = 2 fixed + 13 escaped. Ship: 4 = 3 fixed + 1 escaped.** `.gates-count.json`: Peek `no-rebuilt-behaviour` 0 errors, 13 escapes (and UIG-3's one on `no-raw-element`); Ship 0, 1.

**What changed in the apps**

| where | now | why |
|---|---|---|
| Peek: Add to Open work | `Checkbox` `row` with the status icon as `leading` | M2. Each row is a tick box named by its title, reached with Tab and Space; it was an `option` in a list that was not one, and no row could be reached from the keyboard |
| Peek: DateDivider's sticky-in-scroll story | `ScrollArea` | M5 |
| Ship: the two upload error lines | `FieldLine tone="error"` | an exact copy of it; the `data-*="upload-error"` attributes went, nothing read them |
| Ship: code blocks in a description | `whitespace-pre-wrap break-words` | M4 |
| Peek: the full-screen picture viewer | escaped | becomes the package Lightbox at migration stage 7 (B22) |
| Peek: the huddle starter (2) | escaped | a panel inside the page, not floating; no part closes that |
| Peek: the selection toolbar | escaped | it follows a text selection; the Popover it opens in has no trigger for that |
| Peek: Ctrl+K | escaped | no part owns an app-wide shortcut; opening the palette is Peek's |
| Peek: the / @ !@ [ menus (7) | escaped | Base UI's lists need a text field of their own; UIG-31 |
| Peek: the freshness dot | escaped | `FieldLine` and `Banner` are lines of words |
| Ship: the description's reading surface | escaped | it holds headings and lists, which a button cannot (D37) |
| both apps: the gate | lints `src/**/*.{ts,tsx}`, and the editor hook checks `.ts` | a listener in a hook file, or a class list in a `.ts` file (`prose.ts`), is behaviour too |

**What the package gained** (0.19.0)

| part | what |
|---|---|
| `estiva/no-rebuilt-behaviour` | the apps' second rule, in `recommended` and `strict`; `OWNED_BEHAVIOURS` exported |
| `Checkbox` `row`, `leading` | a list you tick several from: picture, words, box at the end; the row fills on hover and while checked. Peek's row class list, verbatim |
| `ScrollArea`'s bar `z-10` | the bar paints above a sticky row (`sticky top-0 z-10`), which hid part of the thumb in Peek's topic and direct-message lists |

**Proof**

- **The rule.** 149 cases, every table row generated. The tables are read against the package source by the TypeScript parser; broken on purpose three ways (a module said to have no part while a component imports it; a part naming a component that does not import it; a message naming a component the package does not export), each failed.
- **The package.** 681 tests; lint 0 errors, 137 warnings (2 new: the StickyHeadings box is the file's other stories' `h-[240px] w-[280px]`); `lint:rules` 0; typecheck; build; CI green. The published tarball checked for the rule, the table, the row classes and the bar's `z-10`.
- **In Chrome.**
  - `ScrollArea`: a scrolled region with the pointer over it — bar `z-index` `auto`, the thumb cut under the sticky heading; `10`, whole.
  - Add to Open work on B against today's, a row ticked and another hovered: identical, pixel for pixel.
  - Ship's refused upload, a file picked for real: the old line (its `data-composer` present) and `FieldLine` identical, pixel for pixel; the same element, role, classes, font and colour.
  - Ship's code block: reading scrolled and editing wrapped before; both wrap after.
- **Photos** (D70). Package: every `Checkbox` and `ScrollArea` story, both themes, 13 of 13 identical. Peek: 106 stories reaching a changed file, 104 identical — the DateDivider story (only the text's smoothing changed: Chrome draws text in a scrolling layer grayscale; every box measured in place) and `conversationcard--resolved` (1px, known to differ between two shots of the same code). Ship: 61, 60 identical and the throwaway code-block story, which showed the ruling and was never committed.
- **The editor hook**, fed 8 payloads in each app: a key listener in a `.ts` hook file, a `role="option"` row, an `overflow-y-auto` story and a raw `<button>` refused; an escaped listener, a `.test.ts`, a `.d.ts` and a file outside `src` passed.
- **The apps, on 0.19.0.** Peek: `lint:rules` 0; `tsc -b`, `tsc -p convex`; 131 files, 1,493 tests — a new test fails on the old rows (8 `option`s found). Ship: `lint:rules` 0; lint 0 errors / 21 warnings as before; typecheck; 51 files, 494 tests; build.
- **`gates:status`.** UIG-8's checks: estiva-ui 5 (the apps get exactly the two rules; every part named is exported; `OWNED_BEHAVIOURS` exported; `Checkbox` `row`; the bar's `z-10`), each seen to fail with its part broken; Peek and Ship 9 each (a Base UI import names `Popover`; `createPortal` names `DialogShell`; a key listener in a `.ts` file; arrow keys yes and Enter no; `option` names `Select`; `tabIndex` 0 yes and -1 no; `overflow-y-auto` names `ScrollArea`; an escape against its control; a real page with none). **23 of 23.**

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **The ticket's numbers were UIG-1's.** Three PRs had removed a portal, two scroll boxes, an alert and two progress bars since; stage 5 had added the menus' roles; the package had 36 Base UI imports, not 22. | Counted with the rule on each main, and UIG-1's commits recounted to make the arithmetic add up. |
| ✅ | **D47 had happened.** The ticket said to escape the type-ahead menus "until their real fix"; peek #198 and #201 had moved them onto `Popover` and made them listboxes. What is left is what Base UI has no part for. | M1; UIG-31. |
| ✅ | **The gate never read a `.ts` file.** Ship's `prose.ts`, a scrolling class, was invisible to it. | Both apps lint `.ts`. |
| ✅ | **Ship's code block scrolled while read and wrapped while written**, against Peek's ruling that it wraps. | M4. |
| ✅ | **The package's scrollbar hid behind sticky rows**, in Peek's message lists. | M6: 0.19.0. |
| ✅ | **Add to Open work's rows could not be reached from the keyboard.** | M2: each is a tick box now. |
| ✅ | **UIG-7's own check said `no-raw-element` was the only app rule**, and would have failed the day a second arrived. | It reads that the apps get `no-raw-element`. |
| ✅ | **Ship's real-page probe read from the repository root**, where Ship's `src` is not. | `cwd: WEB`, reading `web/src`. |
| ✅ | **My first reason for Ship's code blocks was wrong** ("ScrollArea cannot go around it"): its reading surface is React. | Katerina asked why; M4. |
| 🧰 | Traps: **Playwright hides scrollbars in headless Chrome** (`--hide-scrollbars`) — a photo of a native scrollbar needs `ignoreDefaultArgs`; jsdom mounts no `ScrollArea` bar (it measures no overflow), so the bar's order is proved in Chrome; a before/after photo of an edited file must confirm which code rendered (a changed attribute) before it is trusted; a Bash call over ~8KB fails with a quoting error — write the script to a file; muted text on a surface is 3.94:1, which CI's axe run refuses in a new story. | — |

### UIG-7: building it

**Where.** estiva-ui: branch `gates/07-raw-elements` → PR #45, merged (`b51136a`), released as **0.17.0**; branch `gates/07-form-everywhere` → PR #47, merged (`3b84334`), released as **0.18.0**. Ship: branch `gates/07-raw-elements` → ship PR #158, merged (`27113cd`), deployed (run 35107662706). Peek: branch `gates/07-raw-elements` → peek PR #234, rebased on peek #233 (UIG-29) and #235, merged (`02e5f04`), deployed (run 35108023078). `gates:status` from estiva-ui with both apps' merged code: UIG-7 18 of 18; 10 done, 0 started, 20 not started. Built in worktrees `estiva-ui-uig07`, `ship-uig07` and `peek-uig07`, from mains `8f27208`, `15d3c04` and `0e65a5b`. Storybooks `:6520`, `:6522`, `:6521`. Photos: `K:\Estiva\uig07-review\`.

**Katerina's rulings, 16 September**

| | question | ruling |
|---|---|---|
| L1 | The launcher's search field: change it, or keep it with a reason naming UIG-29? | **Keep it with a reason.** Overtaken: UIG-29's rewrite (peek #233) merged first and left no raw `<input>`, so no escape was written. |
| L2 | Peek's and Ship's three hidden file pickers: a package part, or keep them with a reason and a ticket? | **A package part**, named **`FilePicker`** — "file" allowed, because it means a file on the computer, not an app's Files. Base UI has no part for it (her question). |
| L3 | Peek's tick box with words beside it: the Checkbox carries its own words? Grey words when disabled? | **Yes**, and **"no need"** for grey words. On her question, the words went onto Base UI's `Field.Label`. |
| L4 | Forms: not refused, since a form draws nothing? | **"forms should be part of this ticket"**: a package `Form` on Base UI's `Form`, and the rule refuses a plain `<form>`. |
| L5 | An element the package has no part for (a video, an embedded page, a slider, a date…) | **Refused, and she should know**: the message says to ask Katerina, and the part gets made in the package. An automatic Peek message when it happens: **"leave it out"**. |
| L6 | Where `Form` and `FilePicker` go in Storybook | **Inputs.** |
| L7 | The Busy story showed nothing | A defect, fixed in PR #45: a disabled fieldset left `Button`, `IconButton` and `Checkbox` looking usable (and a Checkbox tickable). They read `formBusy.ts` now. |
| L8 | Text fields had no hover, where `Select` and `ChipInput` do | **"yes on this PR"**: `TextInput`, `Textarea` and `SearchInput` take `hover:border-border-strong`. |
| L9 | Order with UIG-29 | UIG-29 took 0.16.0 and 0.16.1; UIG-7 took 0.17.0 and 0.18.0. UIG-29's Peek PR merged first (Katerina), and UIG-7's rebased on it. |
| L10 | The places the checker cannot see — a dialog that sends without a plain `<form>` — in a new ticket? | **No new ticket: "form everywhere needs to happen now"**, in these PRs: every dialog or panel where fields are filled in and sent, the launcher's forms included. |
| L11 | The command palette's form ("later", in UIG-29) | **"now not later"**, and its keys stay the key list's: Enter in a field does nothing, Ctrl+Enter sends. |
| L12 | The keys, in every other form | **Yes**: Enter in a one-line field sends; Enter in a text area is a new line; Enter in a list or a picker picks; Ctrl+Enter sends from anywhere. |

**The mapping** (acceptance: derived from `src/index.ts`, checked against the HTML standard's list of interactive content — "a, audio (if controls), button, details, embed, iframe, img (if usemap), input (if not hidden), label, select, textarea, video (if controls)" — plus the three elements the package has a part for that the list leaves out). It lives in the rule as `RAW_ELEMENT_PARTS` and `RAW_INPUT_PARTS`; a test generates one case per row.

| raw element | the message names |
|---|---|
| `<a>` | `Link` — for a chip `InlineChip`, for a whole card `Card` with `href` |
| `<button>` | `Button` (UIG-3's message, word for word) |
| `<input>` — no type, text, email, password, url, tel, number, unknown | `TextInput` |
| `<input type="search">` / `"checkbox"` / `"file"` | `SearchInput` / `Checkbox` / `FilePicker` |
| `<input type="submit">`, `"button"`, `"reset"`, `"image"` | `Button` |
| `<input>` with a computed type | `TextInput`, and the other three by type |
| `<textarea>` / `<select>` | `Textarea` / `Select` |
| `<dialog>` | `DialogShell` — to ask yes or no, `ConfirmDialog` |
| `<label>` | `Field` — for words beside a tick box, `Checkbox` with `label` |
| `<details>` / `<progress>` / `<form>` | `CollapsibleSection` / `ProgressBar` / `Form` |
| `<iframe>`, `<embed>`, `<object>`, `<meter>`, `<audio>` or `<video>` with `controls`, `<img>` with `usemap`, `<input>` radio, range, color, date, datetime-local, month, week, time | **no part yet**: "Do not build one here: ask Katerina, and it gets made in @estiva-app/ui." |
| **not reported** | `<input type="hidden">` (draws nothing); `<summary>` (its `<details>` is); `<option>`, `<optgroup>`, `<datalist>` (parts of another control); `<fieldset>`, `<legend>`; `<audio>`/`<video>` without `controls`; `<img>` without `usemap`; every element that is not a control |

One rule: `estiva/no-raw-button` renamed `estiva/no-raw-element`. The escape helper and the config shape are UIG-3's. The id is in each app's `.gates-count.json` and Ship's `docs/GATES-DEBT.md`; UIG-3's own check in estiva-ui now reads that `<button>` maps to `Button`.

**The count** (acceptance: count with the rule or an AST pass, never a line search). Every `.tsx` the gate lints, stories in, tests out, read from git's copy of each main with the TypeScript parser, then linted with the rule itself.

| app | main | files | the rule refused |
|---|---|---|---|
| Ship | `15d3c04` | 93 (19 stories) | **6**: `<form>` in `Composer`, `NewIssueDialog`, `NewProjectDialog`, `PairFolderDialog`; `<input type="file">` in `Composer`, `ui/DescriptionEditing` |
| Peek | `9b86ecd` | 187 (63 stories) | **3**: `<label>` in `ReadStatePanel`; `<input type="file">` in `ui/AttachFiles`; `<form>` in `ui/ForeignObjectWidget` |

No raw `<a>`, `<textarea>`, `<select>`, `<dialog>` or `<details>` in either app, and nothing with no part yet. Peek's full-screen picture ✕ keeps UIG-3's escape. Not JSX, so not the rule's: one `document.createElement('a')` per app, for a download.

**The arithmetic, against UIG-1's count (12 September).** Replaced + escaped = UIG-1's count, with what went since named.

| element | app | UIG-1 | gone before UIG-7 | replaced | escaped |
|---|---|---|---|---|---|
| `<a>` | Peek / Ship | 7 / 7 | 7 / 7 — UIG-27 (peek #218, ship #151) | 0 | 0 |
| `<input>` | Peek | 4 | 3 — the people picker (peek #201), the reference widget's field (peek #222), the launcher's field (peek #233) | 1 | 0 |
| `<input>` | Ship | 2 | 0 | 2 | 0 |
| `<textarea>` | Peek | 1, a story | 1 — the Signal Theme page (peek #225) | 0 | 0 |
| `<select>`, `<dialog>` | both | 0 | — | 0 | 0 |
| `<form>` | Peek / Ship | not counted (L4) | — | 1 / 4 | 0 |
| `<label>` | Peek | not counted for apps | — | 1 | 0 |

**Peek: 3 = 3 replaced + 0 escaped. Ship: 6 = 6 replaced + 0 escaped.** `.gates-count.json`: Peek 0 errors, 1 escape (UIG-3's); Ship 0, 0.

**Form everywhere (L10).** What the checker cannot see — a dialog or a row that sends its fields without a plain `<form>` — found by reading every file that draws a field beside a send button, in the apps and the package:

| where | now |
|---|---|
| Peek: Start topic, Create topic, Resolve, Add members, Move file, Add to open work | the fields are a `Form`; the footer's send button is `type="submit"` for it; busy where the send waits |
| Peek: Topic details' rename, the comment box, the new-folder row, the selection toolbar's link field | `Form` (with `busy` where a send waits); their hand-written Enter handlers are gone |
| Peek: the launcher's forms | the palette's `Form`, from the package |
| Ship: editing a message | `Form` with `busy` |
| estiva-ui: `CommandPaletteForm` | the package `Form`, `enterSends={false}` (L11) |
| not a form, unchanged | Peek's huddle starter (its message box sends); `EditableText` (commits on Enter or blur); a Select that saves on change |

What a person notices: Enter in Create topic's title creates (it did nothing); Ctrl+Enter sends every form; Shift+Enter in the new-folder field no longer creates; while a send waits, the row's field locks with its button.

**What the package gained**

| release | part | what |
|---|---|---|
| 0.17.0 | `Form` | Base UI's `Form`: the page's submit prevented; a field showing its error stops it sending and takes focus. `busy` switches everything inside off (a Base UI `Fieldset`, `display: contents`) and holds focus on the form; when it ends, focus goes to the first invalid field, else back to what sent it, else the first control — `CommandPalette`'s order. |
| 0.17.0 | `FilePicker` | A hidden `<input type="file">` the caller's button opens through its ref; `onPick(File[])` only when something was chosen; clears itself, so the same file can be chosen again. |
| 0.17.0 | `Checkbox` `label` | The words beside the box, on Base UI's `Field` and `Field.Label`. Peek's class list. |
| 0.17.0 | `formBusy.ts` | Not exported: `Button`, `IconButton` and `Checkbox` are disabled, and look it, inside a busy `Form`. |
| 0.17.0 | hover on text fields | `TextInput`, `Textarea`, `SearchInput`: `hover:border-border-strong`, as `Select` and `ChipInput`. |
| 0.18.0 | `Form`'s keys | L12, done by the form rather than left to the browser: Enter in a one-line field sends whatever the buttons and fields; Shift+Enter and Alt+Enter there send nothing; Ctrl+Enter sends from anywhere; a busy form ignores every send; each goes through the submit, so Base UI's field check runs. `enterSends={false}` turns off the plain Enter. |
| 0.18.0 | `CommandPaletteForm` | On `Form` (L11). The chip row stays outside, so its ✕ still goes back while the form works; the button row is inside, so focus on the button is held; the button is a submit and Ctrl+Enter the Form's, one path. |

**Proof**

- **The rule.** 119 cases in `src/eslint`, every row of the mapping and every input type generated from the exported maps. Old files against the new rule: Ship 6 errors, Peek 3, each naming its part; the apps' branches: 0.
- **The package.** 524 tests at 0.18.0; `lint` 0 errors, 135 warnings, none from changed files; `lint:rules` 0 with its count file unchanged; typecheck, build; CI green on both PRs (check, gate, a11y). Each published tarball checked for its parts.
- **In Chrome.**
  - `Form`: focus waits on the form while busy and comes back. A jsdom-only test passed while Chrome dropped focus to the page; see findings.
  - `FilePicker`: opens the picker, takes the same file twice, ignores an empty pick.
  - `Checkbox` `label`: each click on the words or the box toggles once.
  - Hover: 12% → 22% white on hover only; rest, focus, focus with hover and disabled identical (32 of 40 photos; the 8 that differ are the hovered ones).
  - The palette's form, walked against the key list: Enter in a field nothing, a text area's Enter a new line, Ctrl+Enter with a missing field marks and focuses it, while creating focus on the form and the chip ✕ usable, refused → focus back where it was.
  - Ship, old code against new with one script: every control's colours and cursor identical while sending and after; focus, which dropped to the page, now waits and comes back; choose, remove, choose again → 1, 0, 1 chips.
  - Peek's forms, counting the browser's submit events: each sends on its keys and not on a picker's Enter, a text area's Enter or Shift+Enter; the link field applies on Enter and discards on Escape; the Read state switch is named by its words.
- **Photos** (D70).
  - Checkbox: the stories identical before and after, and the plain label against `Field.Label` identical, 8 of 8, both themes.
  - The palette, old code against new: signal 10 of 10; ship 9 of 10 (the rows-arriving story, caught either side of its timer).
  - Ship: 63 stories reaching a form, a file input or a toast identical, and 53 reaching the message edit.
  - Peek: 153 stories, 151 identical, the other 2 differing between two shots of the same code; 90 reaching the Form-everywhere files, identical.
- **The apps, on 0.18.0.**
  - Ship: `lint:rules` 0; `lint` 0 errors, 21 warnings, as before; 51 files, 494 tests; typecheck; build.
  - Peek, rebased on main `f94bfa0`: `lint:rules` 0; `tsc -b`, `tsc -p convex`; 130 files, 1,492 tests.
  - New tests, each failing on the old code: the text action's form, the new-folder Enter, the message edit's Ctrl+Enter.
- **`gates:status`.** UIG-7's checks:
  - estiva-ui, 4: the apps get exactly `no-raw-element`; every part the mapping names is exported; `Form`, `FilePicker` and `Checkbox`'s `label` exist; the palette's form is `<Form enterSends={false}>`.
  - Peek and Ship, 7 each: `<input>`, `<a>`, `<form>` and a file input; `<textarea>`/`<select>`/`<dialog>`/`<label>`; an element with no part; an escape against its control; a real page with no error.
  - Each estiva-ui check was seen to fail with its part broken. In Ship, the installed rule's `<form>` row and its no-part message broken → 5 of 7.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **The ticket's counts were UIG-1's.** `<a>` had gone in UIG-27, three of Peek's four inputs in three other PRs, the launcher's last one in UIG-29 the same day. | Counted with the rule on each main (the arithmetic above). |
| ✅ | **A disabled `<fieldset>` does not tell Base UI.** `Button`, `IconButton` and `Checkbox` take their disabled look from Base UI's state: inside a busy form the button looked usable, and a Checkbox (a `<span>`) could still be ticked. Text fields, `Select` and `Reaction` style `:disabled` and were right. | `formBusy.ts` (L7). |
| ✅ | **Chrome blurs a focused field the moment it is disabled, before any React effect runs; jsdom never does.** The first `Form` held focus in every test and lost it in Chrome. | The form remembers the last element inside it that had focus; a test blurs by hand and failed before the fix (UIG-29 measured the same trap). |
| ✅ | **In an input the browser submits a form on Shift+Enter and Alt+Enter too.** On Peek's comment box, Shift+Enter sent the comment. | 0.18.0's Form stops the browser's submission for every Enter in an input; a test fails without it. |
| ✅ | **Base UI's `Form` refuses to send while a `Field` shows an error.** A form that marks a missing field on a send and keeps the mark until the next send can never send again — the palette's own Form story did. The apps clear their marks when the field changes, or work them out from the draft (Peek's launcher). | The story works the marks out from the draft; `Form`'s and the palette's pages say so. |
| ✅ | **The text fields had no hover** while `Select` and `ChipInput` did. | L8. On `SearchInput` hover now looks like its focus, which was already the stronger border. |
| ✅ | **The checker cannot see a form that is not a `<form>`.** Ten places in Peek and one in Ship sent their fields by hand-written Enter handlers or buttons. | L10: all on `Form`. |
| 📝 | **UIG-5's inward set is narrower than the apps' rule.** `raw-element-outside-a-wrapper` reads `a, button, input, textarea, select, dialog, form, label`, not `<fieldset>`, `<details>`, `<progress>` or the elements with no part; `CommandPalette`'s plain `<fieldset>` was never reported. | Not changed here; UIG-8 or a later inward ticket. |
| 📝 | **Ship's `Description.test.tsx` flaked once** under load (ProseMirror asking jsdom for `getClientRects` after a test ended), then passed 4 of 4. | Unrelated to this ticket; noted. |
| 🧰 | Traps: a `git rebase` in a worktree failed once with "update_ref failed for ref 'HEAD'" and left the index and files at the new base with HEAD on the old commits — back up the branch, `reset --hard` to it, retry; `autocrlf` makes a script's exact-text edit miss — normalise line endings first; `\b` in a JavaScript template literal written through a shell heredoc becomes a backspace character — write such edits with `String.raw`; `RuleTester` refuses two identical cases; the React 19 `element.ref` warning comes from Storybook building a code sample from a story that passes `ref` (`docs.source.type: 'code'`); npm lists a new version a minute or two after `+ @estiva-app/ui@…`; Storybook's action events are not a way to see a story's handler run — count the page's `submit` events. | — |

### UIG-29: building it

**What it was.** Peek's `CommandLauncher.tsx`, 1,767 lines (1,655 when UIG-1 counted), hand-built its own dialog, field, chips, list and keyboard. It is now 1,075 lines on the package's `CommandPalette`. Katerina asked for the move and a UX review in one rewrite: *"I dont wanna build something that is going to change anyway."*

**How it was decided.** A UX review of the old launcher (25 walks, 9 bugs F1–F9, 15 choices R1–R15), a clickable prototype in Peek's Storybook, and a design proposal, all ruled by Katerina on 15–16 September. The key list the build is checked against, with every ruling, is `K:\Estiva\uig29-review\KEY-LIST.md`.

| ruling | what |
|---|---|
| Option C | a new package component on Base UI `Dialog` + `Autocomplete`, the list inline, the way Base UI's own command palette is built. cmdk stays rejected (D8) |
| name | `CommandPalette`, exported from the package root |
| rows | the menu row, placed on `Autocomplete.Item` the way `Select` places it on `Select.Item` |
| C1–C7 | Esc always closes; Ask first for a sentence, last for a word; recents, forgettable; an action found by name; after creating, a toast, a thread line and a composer chip; typed prefixes and a per-row actions menu later |
| R1–R15 | as the review advised: R1 A, R5 C, R11 A, R15 B, the rest yes |
| P1–P4 | the palette owns every key and writes the footer from the lit row; it owns a form's frame and keys; the Ask, Draft and Make pieces are its parts; the lit row's fill sits 8px in, as in a menu |
| 16 September | Esc closes rather than going back; "Ask about this conversation" is lit first when opened from a thread; Recent leaves out the page you are on; the Launcher stories are deleted (not representative without a relay or a model) |

**Why `DialogShell`, `SearchInput` and `ChipInput` did not fit** (the ticket asks this be said here):

- **`DialogShell`** is a titled card with a close button and a button row. A palette has none of the three: its top is a field and its bottom is a key footer. Built on the shell it would be the shell with every slot switched off and a second card drawn inside — "a very custom dialog", Katerina's words.
- **`SearchInput`** is a field on a page that filters a list beside it. The palette's field drives a list that is always open inside the window, owns the arrow keys and Enter, and changes level. That is Base UI's `Autocomplete`, inline.
- **`ChipInput`** chooses several values and opens a popup list under its field. The launcher's chip is the level you are in, not a chosen value, and its list is never a popup.

**Reconciliation — UIG-1's count for this file, per rule** (§3, §9 finding 3, and the ticket's table):

| rule | UIG-1 | replaced | escaped | by |
|---|---|---|---|---|
| raw `<button>` | 4 | 4 | 0 | UIG-3 (peek PR #225): the 3 chips to `InputChip`, a source row to `MenuItem` |
| raw `<input>` | 1 | 1 | 0 | the palette's `Autocomplete.Input` |
| `createPortal` | 1 | 1 | 0 | Base UI `Dialog` |
| `overflow-auto` | 1 | 1 | 0 | `ScrollArea`, inside the palette |
| hand-made empty state | 1 | 1 | 0 | `EmptyState`, inside the palette |
| hand-written `role="alert"` | 1 | 1 | 0 | `FieldLine`, inside `CommandPaletteForm` |
| copied class lists | 5 | 5 | 0 | they matched `DialogShell`, `ChipInput` and `SearchInput` (§9 finding 3); the window and field are the palette's now, the chips `InputChip` |
| **total** | **14** | **14** | **0** | |

Also gone with the old file: the **58** hand-typed sizes and **2** raw colours UIG-28 escaped naming UIG-29, and all **29** `@estiva-escape` lines naming it. Peek's gate lint count is unchanged; `gates:status` reads UIG-29 **2 of 2** (its second check now looks for `CommandPalette`, not `DialogShell`).

**What was built.**

| where | what |
|---|---|
| estiva-ui PR #43, 0.16.0 | `CommandPalette`, `CommandPaletteSearch`, `CommandPaletteForm`, `CommandPaletteWorking`, `CommandPaletteAnswer`, `CommandPaletteQuote`; page, 10 stories, 24 tests. `Menu.tsx` exports its row body inside the package |
| estiva-ui PR #44, 0.16.1 | `notes` under the rows; a late row keeps the highlight in place only after the person has moved it |
| peek PR #233 | the launcher on the palette with the rulings; `ActionFormFields` and `lib/formDraft.ts` (what was typed survives going back); `lib/recents.ts`; a message result opens its topic at the message, a reply at the reply; the prototype and the Launcher stories deleted |

**Proof.** The package: every key in the key list walked in Chrome on its stories; 26 tests, six of the fixes broken on purpose each failing its test; CI's axe run green (the footer's muted text takes the same contrast exception as 21 other story files, PLAN stage 0.10). Peek: every level walked on the launcher harness (search, recents, Ship's form, Set status, Ask, Draft, Make, the model download offer, focus back in the composer on close); 1,470 tests; typecheck, token lint, gate lint and build on a clean `npm ci`; Katerina on the running app with real data.

**What building it found.**

1. **Base UI's `Autocomplete` moves the highlight on Home and End**, as well as the text cursor. The key list says the cursor only; the palette stops Base UI's handling there.
2. **Base UI keeps the highlight's position, not its row**, when rows arrive above it — the old launcher's F7, again. The palette walks it back with the arrow keys, but only after the person has moved it: opened from a thread, Peek's own rows arrive a moment late, and pinning the first app under them was wrong (0.16.1).
3. **The approved prototype had three bugs**, not carried: focus went to the wrong field when only a later one was missing; Ctrl+Enter disabled the focused field, which drops focus to the page for good; the footer named keys that did nothing there.
4. **jsdom does not move focus off a field that becomes disabled; Chrome does.** A test of "focus is held while the form works" passes in jsdom even when broken, unless it checks focus is not on a `:disabled` element.
5. **Peek had no recents.** `lastSelection` remembers one topic and one person, in memory. Recents are new, in localStorage.
6. **A message search hit dropped the tags naming its thread**, so a reply could not be opened at. Hits carry `root` now.
7. **Storybook's Vite cache keeps an old `@estiva-app/ui`** after the package in `node_modules` changes: "does not provide an export named CommandPalette". Delete `node_modules/.cache/storybook` and restart.

**Not built, and why.**

- **C5's chip in the composer.** Peek's composer inserts a created issue as raw `nostr:naddr…` text. A chip needs a composer node (like the message mention's) that sends the same text, and the text reader taught to rebuild it for drafts and edits.
- **C5's "created an issue" line in the thread.** It looks like the "resolved" line, but that line is a record — a Convex row and a kind 9101 assertion on the relay. Nothing records that an issue was created from a thread: the issue event carries no thread tag, and a reply carries no `a` tag. A real record would be a new 9101 subtype in `@estiva-app/protocol` (estiva-foundation, shared with Ship), which needs Jan.
- **The Make proposal card's two lines** are token classes inside the package's `Card`, not a palette part.
- **C6 and C7**, by ruling: later.

### UIG-6: building it

**Where.** Round 1, the gate lint as a CI job of its own: branch `gates/06-gate-job` → estiva-ui PR #40 (`808fd93`), peek PR #227 (`66d38f7`), ship PR #155 (`d82d1ea`), merged. Round 2, `gates:status` reads rulesets: branch `gates/06-status-reads-rulesets` → estiva-ui PR #42 (with this record), peek PR #230, ship PR #157. Built in worktrees `estiva-ui-uig06`, `peek-uig06` and `ship-uig06`, from mains `a2cf385`, `3e3d130` and `d96eaf2`. The rulesets are GitHub settings, not code.

**Katerina's rulings, 16 September**

| | question | ruling |
|---|---|---|
| K1 | Give the gate a CI job of its own, or require the job it already sits in (`check`, `web`)? | **A job of its own, `gate`, in all three repos.** A red `gate` can only mean the rules. Requiring `check` or `web` would require the typechecks, tests and build with it, and a later move of the step would leave GitHub guarding nothing. |
| K2 | Can anyone skip it? | **No.** "Admins can disable it but should not skip the checks": the bypass list is empty. An admin can switch the ruleset off, and that shows. |
| K3 | Who switches it on in Peek and Ship, where only Jan is admin? | **Jan**, from the steps in her message to him, sent the same day. She set estiva-ui's herself. |
| K4 | The ticket says to keep the typechecks, token lint and tests required. None were. Require them now? | **No.** They stay optional, as her message to Jan says. |

**Before** (read 16 September, before any change): no classic protection and no ruleset on `main` in any of the three repos. Nothing was required, so nothing stopped a merge on a red pull request. All three repos are private, on the Team plan, where protected branches and rulesets are available. Katerina is admin in estiva-ui and has write access in Peek and Ship; Jan (`miky-btc`) is admin in all three. Direct pushes to `main` since 15 August: estiva-ui 10 (the last on 7 September, release commits), Ship 2 (16 August), Peek 0.

**The rule now**, read back from GitHub — the same ruleset in each repo:

| repo | ruleset | set by | at (UTC+3) |
|---|---|---|---|
| estiva-ui | "gate on main", id 23534324 | Katerina | 11:58 |
| ship | "gate on main", id 23534509 | Jan | 12:04 |
| peek | "gate on main", id 23534558 | Jan | 12:05 |

Each is **Active** on the default branch, with three rules: `required_status_checks` — `gate`, from integration 15368 (GitHub Actions), not strict — and `deletion` and `non_fast_forward`, which a new ruleset switches on by default. estiva-ui's bypass list reads `[]`. Peek's and Ship's read `null` to someone who is not an admin, so Katerina cannot see them; GitHub tells her `current_user_can_bypass: never`.

**The CI job.** In each workflow the "Gate lint" step left `check` (estiva-ui, Peek) or `web` (Ship) and became the job `gate`: checkout, setup-node, `npm ci`, `npm run lint:rules`. In Peek and Ship, `publish` now needs `gate` too, as it needed the job that held the step. Ship's `gate` installs `web/` only: the root install is for compiling `../lib/nostr`, and the lint compiles nothing. Both versions of each workflow were parsed and compared, job by job and step by step: only that step moved. `lint:rules` passed on a bare `npm ci` in a fresh worktree of each repo (Ship's with no root install). On the pull requests `gate` took 23 s in estiva-ui, 33 s in Peek and 24 s in Ship, beside the other jobs.

**gates:status.** UIG-6's check had two faults, both measured:

- it asked `branches/main/protection`, which answers **"Not Found" to anyone who is not an admin**: for Katerina, in Peek and Ship, "not protected" whatever was set;
- that endpoint knows only classic protection. **With estiva-ui's ruleset active it still said "Branch not protected"**, and `branches/main` said `protected: true` with no checks listed.

`protectedBranch` now reads `rules/branches/<branch>` — the rules in force; "Anyone with read access to a repository can view its active rulesets" (GitHub docs, about rulesets) — and classic protection as `branches/<branch>` reports it. A new helper, `ciJob`, finds a workflow job by its id and a step in it that runs a script. UIG-6's checks in each repo: `main` requires exactly `gate`, and CI's job `gate` runs `lint:rules`. The pair catches a renamed job, which would leave every pull request waiting for a check that never reports. **6 of 6**, from Katerina's account. Seen to fail: Peek's job renamed → "no workflow has a job gate"; Ship's step commented out → "the job gate does not run npm run lint:rules"; a scratch repository pointed at estiva-docs, which has no rules → "requires no check to merge". No repo uses classic protection, so that half was never seen with a check in it.

**Acceptance, line by line**

| | criterion | evidence |
|---|---|---|
| ✅ | A pull request with one violation cannot be merged, in all three repos | estiva-ui #41 (a raw `<button>` buried in `EmptyState`), peek #228 (`ComposerBanner`), ship #156 (`Activity`): `gate` failed, the merge state read BLOCKED, and a merge through the API was refused with HTTP 405, "Repository rule violations found — Required status check "gate" is failing." estiva-ui's refusal was to an admin. All three closed, never merged, their branches deleted. |
| ✅ | Every previously required check is still required | None was required (**Before**, above). |
| ✅ | A normal, clean pull request still merges | estiva-ui #40, peek #227 and ship #155 merged after each repo's ruleset was active. The deploys that followed succeeded (Peek run 35077756244, Ship run 35077769745): the rule does not stop the deploy that runs on the push to `main`. |
| ✅ | Jan has been told | Katerina's message, 16 September: what changes, the hook, how to escape a line, and the ruleset steps. He set Peek and Ship the same day. |
| ✅ | The change and its date are recorded here | this section |
| ✅ | `gates:status` reports it done in all three repos | 6 of 6 |

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **GitHub requires a whole job, by its name** (UIG-4's finding): "Workflow: The name format is `<job name>`" (GitHub docs, troubleshooting rules). | Ruling K1: the job `gate`. |
| ✅ | **Nothing was required before**, though the ticket said to keep the typechecks, token lint and tests required. | Ruling K4. |
| ⚠️ | **Only an admin can set a ruleset, and Jan is the only admin in Peek and Ship.** | Ruling K3. A change to Peek's or Ship's rule goes through Jan. |
| ✅ | **The status check could not see protection** (the two faults above). | Fixed in round 2. |
| ✅ | **All three rulesets went on before the job was on `main`.** A pull request whose run had no `gate` job would have waited for a check that never reports; none was open, and the three that added the job merged first. Once the job is on `main`, an older branch is fine: Jan's peek #229, branched before it, reported `gate` — GitHub runs a pull request's workflow as merged into `main`. | Next time: the job lands, then the rule. |
| 📝 | **A draft pull request proves nothing**: GitHub never merges a draft. The proofs were ordinary pull requests titled THROWAWAY. | — |
| 📝 | **In estiva-ui and Ship the everyday lint fails too** on a raw element, since the gate config is appended to `eslint.config.js`, so `check` or `web` failed beside `gate`. Peek's CI does not run `npm run lint`: on peek #228 `gate` was the only failure, which shows the ruleset, not another check, refused it. | — |
| 📝 | **No direct push was tried.** One that got through would put a raw button on `main`, and in Peek and Ship deploy it. The docs: "When enabled, commits must first be pushed to another ref where the checks pass" (GitHub REST docs, rules). | — |
| 🧰 | Traps: a script that tries to merge a proof must first check that its `gate` failed; `gh pr close --delete-branch` run from a worktree deletes the remote branch and leaves the local one; renaming the job `gate` needs each ruleset changed with it. | — |

### UIG-5: building it

**Where.** estiva-ui branch `gates/05-package-chain` → PR #39, merged (`a2cf385`), built in its own worktree (`estiva-ui-uig05`) from main `ee14bab`, Storybook on `:6515`. No release: the apps take nothing from this.

**Katerina's rulings, 16 September**

| | question | ruling |
|---|---|---|
| I1 | Start UIG-5 now? | **yes** |
| I2 | Photograph the breadcrumb and the toast before changing them, and pick? | **yes** |
| I3 | Anything kept raw: a written reason, and the list comes to her? | **yes** |
| I4 | The toast's action: keep it as it is with a reason, or the package's `Button`? | **`Button`** — the right-hand column of the two side by side, borders in the ship theme and all. And the rule behind it: *"nothing in estiva-ui that requires an existing component already in the package should be left out. They should be used."* |

**The count** (acceptance: enumerate with the rule). Every `.tsx` under `src`, stories in, tests out, on main `ee14bab`: **100 files**.

| rule | the ticket said | today | why it moved |
|---|---|---|---|
| P4 · a raw element outside a wrapper | 4 | **2** — `Breadcrumb.tsx:91` `<a>`, `Toast.tsx:129` `<button>` | `ChipInput`'s two went with stage 5 (PR #22, merged 12 September) |
| P1 · hand-rolled behaviour (D6) | 2 components, 1 escape expected | **0** | `ChipInput` at stage 5 and `Toast` at stage 6: no `createPortal`, no `window`/`document` listener and no `react-dom` import is left in `src` |
| P2 · no doc page | 0 | **0** | |
| P3 · no story | 0 | **0** | |

The package writes **14** raw elements, as UIG-1 counted: 2 buried (the two above), 4 handed to a Base UI `render` prop, 8 a component's own outermost element.

**The arithmetic: 2 = 2 fixed + 0 escaped.** `.gates-count.json`: four rules, 0 errors, 0 warnings, 0 escapes. `docs/GATES-DEBT.md` exists and is empty.

| place | became |
|---|---|
| `Breadcrumb.tsx`, a crumb that leads somewhere | `Link` `plain` — 5 stories in both themes identical pixel for pixel, same markup |
| `Toast.tsx`, the action on a toast, in place and in the provider | `Button` `outlined` `small`; in the provider it is handed to Base UI's `Toast.Action` through `render`. 40×24 → 44×24, side padding 4px → 6px, the pill 4px wider, and in the ship theme the four coloured toasts gain the border only the neutral one had. 2 of the 8 toast stories changed; the 6 without an action are identical |

**The apps are untouched, on purpose.** Peek and Ship spread `configs.recommended`, which still carries exactly `no-raw-button`; `configs.strict` the same. The inward set is `configs.package`. A test holds that line, and `countGates` now takes the rules to list, so an app's `.gates-count.json` gains no rows either. An app that took these would fail on raw elements it may keep until UIG-7 and on pages it does not have.

**What the rules do not try to read.** `no-hand-rolled-behaviour` reads portals and global listeners, not measuring arithmetic: `Popover` hands Base UI a virtual anchor with a `getBoundingClientRect`, which is the documented way to anchor to a rectangle, and a rule that guessed would report it.

**Proof.** 41 cases in the new rules' testers and 71 in `src/eslint` altogether; a scratch commit with a buried element, a portal, a global listener and a component with neither page nor story — 6 errors across all four rules, dropped after; the hook fed 16 Claude Code payloads through the command in `.claude/settings.json` (refused: a buried element in source and in a story, a portal, a component with no page or story, a short escape, an `eslint-disable`, an Edit removing an escape on a CRLF file; passed: a component's own element, a `render` prop, a valid escape, a test, a file outside `src`, a `.ts`, a words-only Edit, a missing `old_string`, an Edit that does not parse yet). `npm run lint` 0 errors and 131 warnings, as before; 410 tests; typecheck and build clean. `gates:status` 12 of 12, each rule and each carve-out proved, the carve-outs with the reporting case as their control.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **The ticket's numbers were stale.** It named 4 raw elements and expected `Toast.tsx:174` to be escaped until stage 6. Stage 5 and stage 6 have both landed since, so the count is 2 and P1 is already at zero — the ticket's one planned escape was not needed. | Counted with the rule, not with the ticket. |
| ⚠️ | **A file-system rule breaks probes.** `component-has-a-page` and `component-has-a-story` read the disk, so linting a probe as `src/__gates_probe__.tsx` reports "no page" on every probe — which would turn every "this must **not** be an error" check, here and in UIG-7 to UIG-9, into a false failure. | Probes are linted at a real component's path; `ORPHAN` is the made-up path, kept for the two checks that need it. |
| ✅ | **Nothing else in the package hand-builds what it already has.** Every class list in `src` was compared with every other: the only near-match between two components is `Reaction` against `Chip`, and `Reaction` is a toggle control at a control's height, which its comment says. The rest are story scaffolding. | Katerina's rule (I4) holds today, and the gate holds it from here. |
| 🧰 | Traps: in a `RuleTester` a rule's id is `rule-to-test/<name>`, so a directive naming the rule must use that; an escape sits above the **statement**, so a `return createPortal(…)` needs the statement as its anchor, not the call; an `eslint-disable` silences the rule's own report, so only `escapeInDirective` is seen — the count sees the silenced one and fails. | — |

### UIG-4: building it

**Where.** ship branch `gates/04-ship-chain` → PR #154, built in its own worktree (`ship-uig04`) from main `cb091c8`. No package change: the rule is 0.15.0's.

**Katerina's rulings, 16 September**

| | question | ruling |
|---|---|---|
| W1 | The hook in Ship's top folder only, or also a copy in `web/`? | **The top folder only.** Ship's `CLAUDE.md` is there and written for a session started there; no session on her machine has started in either Ship folder; a copy is one more thing to keep in step. |
| W2 | `^0.14.0` does not accept 0.15.0: change the range too, not only the lock entry? | **yes** |
| W3 | Photograph the stories with a chip or a dropdown, though 0.15.0 changes no caller? | **no** |
| W4 | This record in its own estiva-ui PR, after Ship's merges? | **yes** |

**The count** (acceptance: enumerate with the rule). Every `.tsx` under `ship/web/src`, linted from git's copy of main `cb091c8` with `web/eslint.gates.config.js`: **127 = 74 source files + 19 stories**, the rule on in every one, **+ 34 tests**, the rule off in every one. **0 raw `<button>`**, as UIG-1 counted.

**The arithmetic: 0 = 0 replaced + 0 escaped.** `web/.gates-count.json`: `estiva/no-raw-button` 0 errors, 0 warnings, 0 escapes.

**What Ship's copy changes from Peek's.** (A copy, ruled a defect on 17 September, §23; **UIG-32 replaced all of it with the package's pieces** the same night — this stays as the record of what was copied.) The same five files, and only this: the lint's files live in `web/` and the hook in the top folder, so the hook checks `web/src/**/*.tsx` and loads ESLint and the package from `web/` (the top folder installs neither); the ignored folders are written in `eslint.gates.js`, since Ship has no `eslint.tokens.js` to import them from; CI's "Gate lint" is a step in the `web` job, after its lint.

**Escapes, after.** Unchanged: the token lint's older form 37 (Ship 2); the plugin's 1, in Peek; none in Ship.

**Lint, before → after** (Ship main `cb091c8` → the branch): `npm --prefix web run lint` 0 errors, 21 warnings → 0, 21, no difference in any file or rule (19 hand-written sizes or spaces, 2 hooks warnings). `npm --prefix web run build` passes; `npm --prefix web test` 51 files, 493 tests, both; `npm run typecheck` passes; the root's 12 test scripts that run on Windows pass, both (`docker-context` and `trees-agree` cannot find their files on Windows, both, and CI runs them).

**Proof.** A scratch commit with a raw button in a component, a story and a test: `lint:rules` exit 1 (the component and the story), `lint` exit 1, the hook refused the two and passed the test; the commit was dropped and `lint:rules` exits 0. The hook, fed 16 Claude Code payloads through the command in `.claude/settings.json`: refused a raw button in source and in a story, a short escape, an `eslint-disable`, two Edits on a CRLF file (back to a raw button, removing an escape), a relative path; passed a test, two files outside `web/src`, a `.ts` file, a valid escape, `Button`, a words-only Edit, a missing `old_string`, an Edit that does not parse yet. CI on PR #154: `check` and `web` pass, and `web`'s "Gate lint" step printed `estiva/no-raw-button: 0 errors, 0 warnings, 0 escapes`, the count file unchanged. `gates:status` UIG-4 9 of 9; on main, with the same packages installed, 0 of 9.

**What building it found**

| | finding | what happened |
|---|---|---|
| ✅ | **A session started below the repository's folder does not get the hook either.** Measured with two real headless Claude sessions asked to write the same raw button: started in Ship's top folder, the hook refused it; started in `web/`, the file was written. The docs say the same: "Hooks and other `.claude/settings.json` keys load from the current working directory's `.claude/` folder with no parent-directory fallback" (code.claude.com/docs/en/permissions). | Ruling W1. A session in `web/` reads the top folder's `CLAUDE.md` (it loads every `CLAUDE.md` above its folder), whose paragraph tells it to run `npm --prefix web run lint:rules`. §16's S1 note says so. |
| ✅ | **Branch protection requires a check by its job's name, and no repo has a job named for the gate.** On PR #154 GitHub's checks are `check` and `web`; Peek's workflow runs `check` (and `publish` on main); estiva-ui's `check.yml` runs `check` and `a11y`. Ship's and Peek's "Gate lint" is a step inside a job. UIG-6's check (`protectedBranch`, the same in all three repos) looks for a required check whose name matches `gate` or `lint:rules`, which no check's name can match today. | For UIG-6: either the gate becomes a job of its own, named for it, or UIG-6 requires the job that holds the step and its checks change to match. Ruled in UIG-6 (K1): a job of its own, `gate`. |
| 📝 | **The ticket's two hooks warnings are not both in `pages/ProjectPage.tsx`**: one is there, one in `pages/IssuePage.tsx`. | Untouched, as the ticket says. |
| 📝 | **A new minor version under 1.0 always moves the range.** `^0.14.0` stops before 0.15.0, so taking it changes the lock entry, the range in the lock and the range in `package.json`, as Peek's PR #225 did. | Ruling W2. |
| 🧰 | Traps: `node -e` with a backslash in it breaks in Git Bash — write a script file; a shell still inside a worktree blocks `git worktree remove` (it leaves the empty folder); Ship's root `npm test` stops at its first script on Windows, so run the scripts one by one. | — |

### UIG-3: building it

**Where.** estiva-ui branch `gates/03-tracer` → PR #36, merged, tagged `v0.15.0`, published. Peek branch `gates/03-tracer` → PR #225, merged, deployed (main's check ran "Gate lint": exit 0). Each built in its own worktree (`estiva-ui-uig03`, `peek-uig03`). Photos and crops: `K:\Estiva\uig03-review\`.

**Katerina's rulings, 15 September**

| | question | ruling |
|---|---|---|
| E1 | The 41 escapes written as `eslint-disable-next-line <rule> -- @estiva-escape: <reason>` (A2): should the plugin read them, or should they be converted? | **Neither: leave them alone.** They escape the token lint's rules, which are not the plugin's, and converting them would switch those rules back on. The plugin reads only `// @estiva-escape: <reason>` or `{/* @estiva-escape: <reason> */}`, and refuses the marker inside an `eslint-disable` for its own rules. |
| E2 | Escape the launcher's 4 raw buttons naming UIG-29, as the ticket said? | **No, change them.** "I will think about what to do with the launcher later." The UIG-29 session was told first; it had built nothing in the file. |
| E3 | Escape the 7 buttons in Storybook's `Docs/Signal Theme`? | **Delete the page** ("not needed"). Peek's Signal theme itself stays; estiva-ui documents it. |
| E4 | The other raw buttons, each photographed as it is beside the nearest package part | Cancel and the tickets toggle → `Button` muted small. Add members → `MenuItem`, its hover fill 8px in from the dialog's sides "same we do in menus". The members pill → `Button` outlined at the default size, 3px around the faces (the small size is the faces' height and covered the hairline). The launcher's chips → `InputChip`. A source under an answer → `MenuItem`. The full-screen picture's ✕ → **kept, escaped**: the package's `IconButton` is small and unfilled on a photo, and the viewer becomes the Lightbox at migration stage 7. |
| E5 | Release | 0.15.0 when PR #36 merged; fix the flaky Select test on that PR. |
| E6 | Reaching sessions started outside the repo (below) | Nothing outside the repositories, nothing anyone has to be told: the hook in the repo, a line in `CLAUDE.md`, CI, and branch protection (UIG-6). |

**The count** (acceptance: enumerate with the rule itself). Every `.tsx` under Peek's `src`, stories in, tests out, linted from git's copy of main `3f5774f` with `eslint.gates.config.js`: **16** in 7 files. UIG-1 counted 19 on `d094006`; 3 went since: `PendingAttachmentChip`'s and one of `FileAttachmentCard`'s in UIG-27 (`b9b1a6b`), one of `HuddleCreator`'s with the people picker (`2ab42d6`).

**The arithmetic: 16 = 8 replaced + 7 deleted with the page + 1 escaped.** `.gates-count.json`: `estiva/no-raw-button` 0 errors, 0 warnings, 1 escape.

| place | became |
|---|---|
| `HuddleCreator.tsx`, "Cancel Esc" | `Button` muted small |
| `ui/ProjectTickets.tsx`, the tickets toggle | `Button` muted small, the chevron as `leadingIcon` |
| `MembersDialog.tsx`, "Add members" | `MenuItem` tall in a `px-2` row (fill 8px in, square over the faces at 21px, 48px) |
| `ui/MembersPill.tsx` | `Button` outlined, default, `gap-2 pl-[3px] pr-2` |
| `CommandLauncher.tsx`, the Ask, scope and context chips (3) | `InputChip` with `removeLabel` (the ✕ keep "Leave Ask", "Leave <scope>", "Clear context") and, for Ask and context, `truncate` |
| `CommandLauncher.tsx`, a source under an answer | `MenuItem` `px-3 py-2`, its words and their notes unchanged |
| `ui/FileAttachmentCard.tsx`, the viewer's ✕ | escaped |
| `stories/SignalTheme.stories.tsx` (7) | deleted with the page |

**Escapes, after.** The token lint's notes in the older form: **37** (estiva-ui 3, Peek 32, Ship 2; the 41 less the Signal Theme page's 1 and the 3 on the launcher chips' text). The plugin's escapes: **1**, in Peek.

**Lint, before → after** (Peek main `3f5774f` → the branch on `01ff162`): `eslint .` 89 errors, 116 warnings → 89, 112; `eslint src` 73, 116 → 73, 112; `lint:tokens` 0, 116 → 0, 112. The 4 warnings are hand-written sizes that left with the launcher's chips and the pill. `tsc -b`, `tsc -p convex` clean; `test:run` 124 files, 1,420 tests, as main.

**Proof.** 23 RuleTester cases and 8 through ESLint's own API (estiva-ui); the rule's count on main by the rule itself; a raw button on disk fails `npm run lint:rules` (exit 1) and passes with an escape (exit 0); the hook, fed 15 Claude Code payloads through its own command line (refused: a raw button in source and in a story, a short escape, an `eslint-disable`, Edits back to a raw button, removing the escape; passed: a test, a file outside `src`, a valid escape, `Button`, a words-only Edit, a missing `old_string`, an Edit that leaves the file not parsing yet); every story that reaches a changed file photographed before and after (D70), every difference one of E4, each looked at.

**What building it found**

| | finding | what happened |
|---|---|---|
| ⚠️ | **A repo's hook reaches only sessions started in that repo's folder.** Claude Code reads `.claude/settings.json` from the session's primary working directory (code.claude.com/docs/en/settings). A session started in a folder above — a workspace holding several repositories, which is how Katerina works — never gets it, and nothing inside a repository can change that (`--add-dir`, plugins and nested settings do not). It does read the repository's `CLAUDE.md` when it works on the files. The ticket, the guide (T14, gate 2) and this plan said the committed hook reaches "every Claude session"; nobody checked. | Ruling E6. Peek's `CLAUDE.md` tells such a session to run `npm run lint:rules`; it asks rather than blocks. CI stops everyone; UIG-6 makes GitHub refuse the merge. The guide is corrected (§18, G1). **UIG-4 and UIG-5 carry the same assumption; their tickets get a note, wording shown to Katerina first.** An organisation's managed settings could enforce a hook everywhere; not pursued. |
| ✅ | **`InputChip` could not name its ✕, nor cut a long label.** The launcher's chips needed both. | `removeLabel`, and `truncate` opt-in: cutting clips up to 4px of a letter's edge at 1x even when the label fits (the same chip, in place; identical at 2x), so a chip that is never capped keeps every pixel. |
| ✅ | **`MenuItem` outside a `Menu` is a plain button with no role**, so `MembersDialog`'s comment ("would claim menu semantics") was stale. | It is the dialog's row now. |
| ✅ | **Select's keyboard tests raced the list's focus.** CI failed "Tab closes the list" on PR #36; with every frame 100ms late, Tab, the arrow-and-Enter test and Home/End failed 3 of 3, focus still on the trigger. | `focusedList()` waits for focus inside the list before a key (on PR #36). |
| 🧰 | Traps: `eslint -o /dev/null` from Git Bash writes a file named `nul`; the story picker (`stories-using.mjs`) matches text per line, so a comment phrase that wraps does not seed its file; a stopped Storybook task leaves its node process on the port (stop it by PID, after checking its command line); Tailwind in a running Storybook does not generate a class new to the app until `src/index.css` is touched. | — |

### UIG-28: building it

**Where.** estiva-ui branch `gates/28-token-holes`, started from stage 6's `stage-6-primitives` at `fc0d15d` and built in its own worktree. At the end its commits go on top of stage 6's branch: one push, one PR, one `0.14.0` (Katerina, 15 September; the stage 6 session records it against D69). Peek and Ship each get a `gates/28-token-holes` branch **after** `0.14.0` is released, because Peek's Signal labels use the new `text-small`. The count, the scripts that made it and every class they found: `K:\Estiva\uig28-review\` (`COUNT.md`, `scripts/`, `data/`).

**Katerina's rulings, 15 September**

| | question | ruling |
|---|---|---|
| R1 | Fix the raw-colour pattern in Peek and Ship: it matches nothing (§13) | **yes**, although the ticket said the four rules stay as they are |
| R2 | Corners and shadows block like type; border and ring widths only warn | **yes** |
| R3 | Signal's small labels (24 places) get a token, not escapes | **yes**. Then, "do we really need to invent new tokens?": three tokens, one, and none were photographed side by side, and she picked **one: `text-small`, 10px and nothing else**, with Tailwind's own letter-spacing steps (0.02em → `tracking-wide`, 0.1–0.16em → `tracking-widest`, 9.5px → 10px) |
| R4 | A size close to a token but not exact: photos first, then she picks in the package, every such place takes the named size (14 class strings, six of them in stories); `Property`'s label keeps wide letters as `tracking-widest` (0.08em → 0.1em), and so do the Design Tokens page's headings |
| R5 | Rename the class maps the lint cannot see, and read the editor's `attributes.class` | **yes** |

**The prefix list** (acceptance 1), from every utility Tailwind registers under the preset, each given an arbitrary value and sorted by the CSS it produced:

| group | prefixes | the scale comes from | rule |
|---|---|---|---|
| type | `text` `leading` `tracking` | the preset's `fontSize` | error |
| corners | `rounded` and its 14 sides and corners | the preset's `borderRadius` | error |
| shadows | `shadow` `drop-shadow` | the preset's `boxShadow`, `dropShadow` | error |
| heights and spacing | `w` `h` `size` `min-w` `min-h` `max-w` `max-h` `p*` `m*` `gap*` `space-x/y` `inset*` `top` `right` `bottom` `left` `translate-x/y` `basis` `indent` `scroll-m*` `scroll-p*` `border-spacing*` | **Tailwind's default spacing scale. The preset has no spacing token.** | warning |
| border and ring widths | `border*` `divide-x/y` `outline` `ring` `ring-offset` | Tailwind's default | warning |

**The rule.** A new block in `eslint.config.js`. The plugin is registered twice, as `token-values` (errors) and `token-spacing` (warnings), so the four older rules are untouched and an escape for a size cannot also silence a raw colour on the same line. The variant part reads arbitrary variants (`[&_pre]:`, `group-hover/row:`), which the older pattern does not. `text-[14px]` names its token, read from the preset through `tailwindcss/loadConfig`. The inline-style rule is `no-restricted-syntax` on a `style={{ }}` property that sets a colour, a font size, a border or a shadow; width, height and transforms pass. Tests are out. Every pattern was checked against every arbitrary class in the three repos: 714 classes, 0 mismatches. `gates:status` carries 7 package checks for it, each seen to fail with its rule removed.

**The count** (acceptance 2), classes in `src` (estiva-ui also `stories/`), stories in, tests out, on estiva-ui `fc0d15d`, peek `64e989a`, ship `8ab75a3`:

| | estiva-ui | peek | ship |
|---|---|---|---|
| type · error | 87 | **175** (58 in `CommandLauncher.tsx`) | 14 |
| corners · error | 1 | 5 | 0 |
| shadows · error | 5 | 5 | 0 |
| inline style · error | 10 reports | 36 (27 in `SignalTheme.stories.tsx`) | 3 |
| heights and spacing · warning | 131 reported | 130 | 19 |
| border and ring widths · warning | 0 | 5 | 0 |

UIG-1's "157 in Peek, type or spacing" does not split: its scripts were thrown away and its prefix list never written down. On 15 September's main the same words count **175 type and 78 spacing** in Peek's source (130 with stories).

**estiva-ui, reconciled** (acceptance 7 and 8)

| | count | fixed | escaped |
|---|---|---|---|
| type | 87 | **87** | 0 |
| corners | 1 | **1** | 0 |
| shadows | 5 | **5** | 0 |
| inline style | 10 | 0 | **10**, in three places, each with its reason: `Avatar`'s per-person palette, `AvatarGroup`'s ring width from a prop, the Design Tokens page drawing each token from its variable |
| heights and spacing | 131 warnings | recorded | — |

`npm run lint` exits 0: 0 errors, 131 warnings. Proof on screen, every story in both themes against the commit before: the 31 exact swaps changed nothing (576 of 576); `text-small` changed only SectionLabel and what holds one (a little tighter in signal) and Chip (0.3px wider in signal); ship unchanged.

**Peek and Ship: done, 15 September.** peek PR #222 and ship PR #153, merged. Each PR also took `0.14.0` and migration stage 6's app changes (ADOPTION P34, S35).

Katerina's rulings for the apps, 15 September:

| | question | ruling |
|---|---|---|
| A1 | One PR per app, or one for the version and one for UIG-28? | **one per app**, the two as groups of commits |
| A2 | The escape form: GATES §16 S4 says `// @estiva-escape: <reason>`, but ESLint obeys only `eslint-disable` until UIG-3 | **`eslint-disable-next-line <rule> -- @estiva-escape: <reason>`**: it works today, and UIG-3 can find every one. The package's three escapes carry the marker since `gates/28-close` |
| A3 | Ten looks, photographed as they are and with the named value | **yes to all**: Peek's resolved line (`text-h5`, an 8px corner, the theme's glow), the highlight squares at 4px, line heights to Tailwind's nearest step, the composer's hint `text-menu`, Signal's thread time 10px, the Resolve hover `success-outline`; Ship's table headings `tracking-widest`; code at `0.9em` kept and marked; the highlight tag's 13% tint kept and marked |
| A4 | Why do the apps keep a Design Tokens page, when the package's Storybook has one? | **they don't**: both apps' pages and their `Swatches.tsx` are deleted, and each Introduction points at the package's page |

Reconciled against the lint's own reports, counting the class lists it could not see before R5:

| | Peek | Ship |
|---|---|---|
| type · error | 175 = 104 fixed + 11 gone with the Design Tokens page + **60 escaped** (`CommandLauncher.tsx` 58, naming UIG-29; `MessageBody.tsx` 2, code at `0.9em`) | 14 = 1 fixed + 11 gone with the page + **2 escaped** (`prose.ts`, code at `0.9em`) |
| corners · error | 5 fixed | 0 |
| shadows · error | 5 fixed | 0 |
| raw colours (R1) · error | 5 = 3 fixed + **2 escaped** (`CommandLauncher.tsx`, UIG-29) | 0 |
| inline style · error | 65 reports = 5 fixed + 3 gone with the page + **57 escaped** (`SignalTheme.stories.tsx` 56, one file-level disable; the highlight tag's tint 1) | 3, gone with the page |
| warnings | 116 | 19 |

On 15 September's mains (peek `3f5774f`, ship `cb091c8`): Peek `npm run lint:tokens`, Ship `npm run lint` and estiva-ui `npm run lint` exit 0. `gates:status`: **UIG-28 ✅ 23 of 23** (7 in the package, 8 in each app).

Proof on screen, every story before and after each step, each difference looked at: taking `0.14.0` changed Peek 97 of 355 stories and Ship 15 of 101, all the package's ruled changes; UIG-28's app work changed only the looks in A3 and Signal's small labels (R3).

### UIG-27: adopting it in Peek and Ship

Katerina's words: *"peek and ship will adopt the updates from estiva-ui carefully and no bugs."* Ruling 15: the adoption is **full**, and the code it replaces is **deleted**. Nothing may change on screen that a ruling above did not change.

#### 1. Before any code

1. Read the UIG-27 ticket in Ship in full (`ship_get_issue UIG-27`; the answer is too big to print, so it is saved to a file — read all of it). Its acceptance list is the definition of done; §4 below repeats it.
2. `npm view @estiva-app/ui version` must print `0.13.0` or later (released 14 September: PR #29 and #30, tag `v0.13.0`). If it prints less, stop and tell Katerina. Read the 0.13.0 CHANGELOG entry: it lists every prop.
3. **Work in a worktree, never a main checkout.** The migration session (PLAN stage 6) works in Peek and Ship at the same time. `git fetch` first; main has moved under a session twice before. Ship: `npm ci` in the root **and** in `web/`. Stop every dev server in a checkout before `npm ci`, or it fails on Windows. Katerina's servers (`:6006`, `:6008`, `:5173`) are hers; use your own ports.
4. **Another session works in these apps** (the migration, PLAN stage 6). Run `gh pr list` in peek and ship before starting and again before pushing; rebase on `origin/main`; if an open PR touches the same files, tell Katerina.
5. Branch `gates/27-missing-components` in each app (the ticket's name). One PR per app. **Do not merge**: Katerina merges.
6. **Photograph first.** Every app story, before and after, pixel for pixel (the package's CLAUDE.md, "A port, step by step", step 9), plus the real screens a story does not reach (a conversation with attachments, a Ship issue with a description, a project). Every difference is either a ruling below or a bug. Scripts: `K:\Estiva\uig27-review\scripts\` — `shoot-all-stories.mjs` photographs every story a Storybook lists, `pixels-attachment.mjs compare` diffs two folders, and the README says which is which. For the real screens, the method in memory `estiva-session-2026-09-10-peek-atlas` (58 screens of Peek).
7. **Show Katerina the plan before building** (her standing rule): three short parts and yes/no questions, with the photos of what only she can rule — the two router links, and Ship's empty-state room (§2). Asked at the start, a ruling never blocks the end.
8. **Push** when the app builds, its tests pass and every photographed difference is explained; open the PR; **never merge**.

#### 2. What each app changes

Places as of Peek `main` `664d144` and Ship `main` `58732d4`, 14 September. **Lines drift: find each by its file and its code, and re-count before starting.**

**`Link`** — 20 links: 18 raw `<a>` and 2 router links. Every one ends as a component or a written reason; `fitted + reasoned = 20` goes in **UIG-27: the links, recounted** above. Re-read on 14 September at the commits above: the same 20, and by job the same as that table (Peek 5 text, 2 card or row, 2 chip; Ship 2, 4, 3).

| app | where | job | what it looks like now | becomes |
|---|---|---|---|---|
| Peek | `ui/MessageBody.tsx:52` (`BodyLink`) | text | info colour, underlined | `Link` `text`, `external` |
| Peek | `ThreadReplyCard.tsx:504` | text | a muted timestamp, underline on hover | `Link` `quiet` |
| Peek | `TopicProjectPanel.tsx:243` · `ui/ForeignObjectWidget.tsx:401` | text | a title, underline on hover | `Link` `quiet`, `external` |
| Peek | `ui/ForeignObjectWidget.tsx:277` | text | "Open in app ↗", dotted underline | `Link` `underlined`, `external` (solid now: ruling 2) |
| Peek | `ui/ProjectTickets.tsx:154` | row | a title whose `after:absolute after:inset-0` makes the whole row the link | `Link` `plain`, keeping those classes |
| Peek | `ui/FileAttachmentCard.tsx:297` | card | the file row | goes with it, into `AttachmentCard` |
| Peek | `ui/Reference.tsx:227` · `:258` | chip | the inline chip | `InlineChip` with `href` |
| Peek | `ConversationCard.tsx:572` · `ThreadPanel.tsx:492` — `react-router-dom`'s `Link` | text | quiet | `Link` `quiet` navigating through the router in `onClick` (NavItem's rule), or keep the router's with a written reason — **Katerina decides**, from the two side by side |
| Ship | `Board.tsx:24` · `ProjectCard.tsx:55` · `ui/ForeignObject.tsx:218` | card | the whole card | `Card` with `href` (it draws `Link` `plain`) |
| Ship | `IssueRow.tsx:66` | row | `after:absolute after:inset-0`, the whole row | `Link` `plain`, keeping those classes |
| Ship | `IssueRow.tsx:79` | chip | wraps the round project badge | `Link` `plain` |
| Ship | `IssuesTable.tsx:84` | text | a title, underline on hover | `Link` `quiet` |
| Ship | `ui/ForeignObject.tsx:99` | text | "Open it there", underlined | `Link` `underlined` |
| Ship | `ui/Reference.tsx:156` · `:160` | chip | the inline chip | `InlineChip` with `href` |

`Card`, `Link` and `InlineChip` all pass the rest of their props to the anchor, so `{...linkTo(href)}` spreads onto any of them (read in `Card.tsx` and `InlineChip.tsx`).

⛔ **Ship's links spread `{...linkTo(href)}`** (`router.ts:191`, SHI-20). Keep it: `<Link {...linkTo(href)} …>`. Drop it and every click reloads the whole app. **Prove it, don't read it** (acceptance): in Playwright set `window.__marker = 1`, click the link, read it back. Still there, the app navigated; gone, the page reloaded. Do it for every Ship link that changed, and for Peek's two router links.

**`InlineChip`** (D67, ruling 3). Peek: delete `ui/inlineChip.ts`; its callers take the package's `InlineChip`, or `inlineChipClassName` / `INLINE_CHIP_CLASSES` where the editor needs strings — `ui/MessageBody.tsx` (3 chips), `ui/Reference.tsx` (3), `extensions/mention.tsx` (8), `extensions/highlight.tsx`. Tone `mention` is renamed `person`. The package's classes already carry `h-[1.4em] align-top`, so Peek's `INLINE_CHIP_STYLE` and `INLINE_CHIP_STYLE_ATTR` go, never doubled (a chip that adds its own style keeps that part: `mention.tsx:505` caps its width at `24ch`). The quiet chip becomes 19.6px (was 16.8px, a fix). Renaming the tone changes no saved or pasted text: the editor finds a chip by its data attribute (`parseHTML` matches `span[data-mention]` and its siblings), never by a class. Ship: `ui/Reference.tsx` draws every Ship chip, a person's too; it becomes `InlineChip`, and measured, it does not move.

**`ProgressBar`**. Peek `ui/ProjectTickets.tsx:22` → `variant="quiet"` (4px now, was 3px: ruling 5). Ship `ProjectRail.tsx:88` → the package's `variant="default"` (Ship's own 6px look); delete `ui/ProgressBar.tsx` and its story and test.

**`Card`** — the 18 in **UIG-27: the cards, sorted** above, by rulings 9–12. The fill is read from each card's measured colour (13 September, `card-frames.json` in the scripts folder); the states from the Card diff that matched Peek's conversation card.

| app | card | `Card` |
|---|---|---|
| Peek | `ConversationCard.tsx:487` | `fill="surface"` `hover="fill"` `quietUntilHover`; selected → `selected`, being edited → `active`, unread → `attention="accent"`, urgent → `attention="warning"` (each measured identical) |
| Peek | `ThreadReplyCard.tsx:415` | `fill="surface"` `hover="fill"` `quietUntilHover`; the same states, where it draws them (read it) |
| Peek | `HuddleCard.tsx:127` | `fill="surface"` `hover="fill"` (its hairline stays at rest) |
| Peek | `TopicDetailsDialog.tsx:254` · `TopicProjectPanel.tsx:238` | `fill="none"` |
| Peek | `ui/ForeignObjectWidget.tsx:385` | `fill="inset"` |
| Peek | `ui/ForeignObjectWidget.tsx:607` | `fill="none"` `unreadable` (dashed now) |
| Peek | `ui/FileAttachmentCard.tsx:216` · `:246` · `:291` · `ui/PendingAttachmentChip.tsx:87` | `AttachmentCard`, below |
| Ship | `Board.tsx:26` | `fill="elevated"` `href` (8px corners now, was 6px) |
| Ship | `ProjectCard.tsx:58` | `fill="surface"` `href` |
| Ship | `ConversationThread.tsx:543` | `fill="surface"`; its `subdued` look (`border-subtle` on `bg-base`) → try `fill="none"`, and measure |
| Ship | `ui/ForeignObject.tsx:212` | `fill="surface"`, and `href` where it is a link (the `<a>` at `:218`) |
| Ship | `ui/ForeignObject.tsx:89` | `fill="surface"` `unreadable` |
| Ship | `ui/Attachment.tsx:45` · `:88` | `AttachmentCard`, below |

The foreign object's inside layout (D66) is **not** this ticket.

**`AttachmentCard`** (rulings 13, 14, 16, 18).

| app | today | becomes |
|---|---|---|
| Peek | `ui/PendingAttachmentChip.tsx`, used in `ui/ComposeBox.tsx:366` and `ui/AttachFiles.tsx:54` | `<AttachmentCard pending …>` in both; **delete** the file, its story and its test |
| Peek | `ui/FileAttachmentCard.tsx`, used in `ConversationCard.tsx:671` and `ThreadReplyCard.tsx:535` | shrinks to what only Peek can do: `useRelayBlob` (the fetch), `downloadFile`, `ImageLightbox`. It passes `src`, `href` and `state`, with `onOpen` (opens `ImageLightbox`) and `onDownload` (calls `downloadFile`). Keep passing `data-interactive`: `ConversationCard.tsx:516` and `HuddleCard.tsx:158` ignore a click inside `[data-interactive]`, so a click on a file does not also open the conversation. The card's props spread onto its root, so it arrives |
| Ship | `ui/Attachment.tsx`, used in `ui/RichText.tsx`, `ui/editorSchema.tsx`, `ConversationThread.tsx` (`Attachments`) | a **file** and the **can't-load** state become `AttachmentCard` (ruling 8: 28px line → Peek's 50px card). **Images stay as they are** until the package has a full-screen viewer (ruling 14), so `Attachment.tsx` keeps its image and its fetch. ⚠️ `editorSchema.tsx` draws it **inside the description editor**: the taller card changes the editing surface — photograph a description with a file while editing, and check it can still be selected, moved and deleted |

What changes on screen, all ruled: a card that cannot be read is dashed; a name shows in full on hover **only when it is cut off**, and a size never does; the loading placeholder is a named status (Peek's had an `aria-label` on a plain `div`).

**`EmptyState`** (ruling 6). A section's empty state goes **inside the box its rows live in, with no padding of its own**. The callers that pad one today:

| app | callers |
|---|---|
| Peek | `TopicActivity.tsx:68` (`px-4 py-4`) · `TopicProjectPanel.tsx:211` · `:219` (`p-3`) · `ui/ProjectTickets.tsx:118` (`border-t px-3 py-2`) · `views/FolderContentsView.tsx:91` · `:96` (`p-4`) · `views/ForeignConversationView.tsx:72` · `:86` (`p-4`) — and read the multi-line ones: `ui/StarredSection.tsx:47`, `ui/ErrorBoundary.tsx:41`, `pages/DeskPage.tsx:410`, `pages/TopicsPage.tsx:200` · `:215` |
| Ship | `Activity.tsx:122` (`py-8`) · `ConversationThread.tsx:648` (`py-8`) · `History.tsx:32` (`py-6`) · `NewIssueDialog.tsx:73` (`py-6`) · `views/ProjectView.tsx:126` (`py-10`) · `IssueList.tsx:50` (passes `className` on) — and read `pages/IssuePage.tsx:93`, `views/ProjectsView.tsx:54` |

⚠️ **Not ruled yet, and it covers all six of Ship's padded callers:** how much vertical room an empty section takes in Ship (`py-6`, `py-8`, `py-10`). Ruling 6 says it is taken when those callers are fixed. Photograph them at the start and bring the photos to Katerina with the plan (§1, step 7); change them after she rules.

A finding, not this ticket's to fix: some callers use `EmptyState` for a **failure** — Peek's "This folder could not be read." (`views/FolderContentsView.tsx:91`), "Something went wrong… try again" (`ui/ErrorBoundary.tsx:41`) — which its page says an empty state must never stand in for. List them in the PR; change them only if Katerina says.

**`gates:status`.** It is run in estiva-ui and reads all three repos. UIG-27 reads 6 of 12 today: the 6 package checks pass, and the other 6 are the apps' — in each, "the installed package has Link", "… has ProgressBar", and "the hand-made progress bar is gone". Taking 0.13.0 and deleting the two bars turns all 6. Also: add UIG-30 to both apps' `scripts/gates-checks.mjs`, which list 29 tickets. Nothing catches that today: "every repo agrees" checks who owns a ticket, not that every list has it. And add a check for each thing this adoption deletes (`inlineChip.ts`, `PendingAttachmentChip.tsx`), so it cannot come back.

**GATES.md is estiva-ui's.** The last edits (the arithmetic, §0, §13, §15) go in a third PR, in estiva-ui, branch `gates/27-close` (UIG-2 closed the same way). Katerina merges it.

#### 3. Traps

| trap | what happens | do instead |
|---|---|---|
| a test pinned to a deleted file or an old class | fails, and tempts a "fix" in the test | read every failure as a possible package defect first (package CLAUDE.md); a test of deleted code goes with the code |
| linking the package checkout into an app | two Reacts ("reading 'useRef'"); `npm pack` does not rebuild `dist` | install the published 0.13.0 |
| `cn` from `tailwind-merge` in the app | a size token beside a colour is dropped | the app's own `cn` if it is taught the ramp, or the package's |
| a Base UI Select option found by text in a test | flaky: the closed list is already mounted (§22) | `findByRole('option', { name })` |
| a Ship description edited through the agent | renders raw JSON | never edit a Ship description with `edit-project` / `ship_edit_project` |
| accessibility runs | not on Katerina's machine | CI runs axe; never `test:a11y` locally |
| docs that are not this project's | — | never edit `K:\Estiva\migration docs`, `PREVENTION.md`, `COVERAGE-PLAN.md` |

#### 4. Done means

The ticket's acceptance, with today's numbers:

- [x] All 20 links fitted or reasoned; `fitted + reasoned = 20` written above (20 + 0).
- [x] Every Ship link keeps `linkTo`, proved by the window marker; Peek's two router links too.
- [x] Both hand-made progress bars are gone.
- [x] The chips, the 18 cards and the attachments are the package's; `inlineChip.ts`, `PendingAttachmentChip.tsx` and Ship's `ui/ProgressBar.tsx` are deleted, with their stories and tests; `FileAttachmentCard.tsx` holds only Peek's own part, and Ship's `ui/Attachment.tsx` its image, its fetch and (ruling 22) its file's open and download.
- [x] Every padded empty state sits inside its rows' box, or level with rows that pad themselves (ruling 21); Ship's after her ruling on their room (20).
- [x] Every story photographed before and after; every difference is a ruling, explained noise, or fixed (one bug, below). The real screens were not re-shot: see below.
- [x] Both apps build, typecheck, lint and pass their tests; CI green on both PRs.
- [x] Both apps' `gates-checks.mjs` list UIG-30, and check that the deleted files stay deleted.
- [x] `npm run gates:status` reads Peek's part 6 of 6 and Ship's 5 of 5; §0, §13 and §15 updated in the `gates/27-close` PR.

#### 5. What the adoption did

| | found | what happened |
|---|---|---|
| ✅ | **A feed card went dark under its own menu.** Peek's conversation, reply and huddle cards stay lit while their ⋯ menu or emoji picker is open; the menu opens outside the card, so `:hover` is false there (measured). `Card` lit only on `:hover`. | `Card` `hovered`, released as 0.13.1 (estiva-ui PR #32, ruling 23). A selected clickable card keeps its pointer in the same release. |
| ✅ | **The first `RouterLink` threw without a router.** `useNavigate()` at the top of `ConversationCard` broke every card drawn outside one (the Files panel's "with activity" story). Caught by photographing every story. | The router is read inside `RouterLink`, which needs one exactly where react-router's `Link` did. 7 tests. |
| ✅ | **Ship's description editor saves and closes on blur**, and a file card's link and Download button take focus: pressing Download while editing committed and left the editor (measured). | Inside the editor a file is drawn and never opened (`opens={false}`); measured again: a click selects it, Backspace deletes it, no commit. |
| ✅ | **Two kinds of padded empty state in Peek.** 7 copy their list box's padding; 7 sit in lists whose rows pad themselves, where no padding would move the line 8–12px off the rows. The file tree's 4 arrived with FOL-19 on 14 September. | Ruling 21. Photographed identical. |
| ✅ | **A document was deliberately not fetched in Ship** ("a PDF is not fetched to show its name"), and opening one needs its bytes. | Told Katerina before building; ruling 22 stands: fetched when drawn, once, cached, as Peek does. |
| 📝 | Ship's chip that is a link no longer fills on hover: Peek's chip never did, and ruling 3 moved Peek's in unchanged. | Written in ship PR #151. A hover for a linked `InlineChip` would be a package change, if wanted. |
| 📝 | Some callers use `EmptyState` for a failure ("This folder could not be read.", "What is in this could not be read.", the relay failure in Peek's Files panel, "This conversation could not be read.", `ErrorBoundary`), which its page says an empty state must not stand in for. | Listed in peek PR #218; changed only if Katerina says. |
| 📝 | The real screens (a conversation with files, a Ship issue with a description, a project) were not re-photographed: the stories covered every changed component, and the one behaviour a story could not show (the editor's blur) was measured in a browser with a throwaway story. Full-Storybook photo runs cost a lot of reading; after the first full pass, only the stories that draw what changed were re-shot. | — |
| 🧰 | Traps: a fresh `npm install` with npm 11.6 rewrites unrelated `peer` flags in a lock — bump the ui entry only; a `#/…` story address never reloads, so the window marker must first point it at a real path; Ship's `docker-context` and `trees-agree` root tests fail on Windows only (`K:\K:\…`), and CI runs them; a full test run beside another suite times out tests that pass alone. | — |

### What is ready for the next tickets

| ticket | what it gets |
|---|---|
| every ticket | **One copy, in the package (§23).** A gate piece — a rule, its settings, the hook, the count, the status engine, a check every app runs — goes into `@estiva-app/ui`, and the apps import it. Never paste it into a repo: since UIG-32 there is no copy left to add to. "In all three repos" means "in the package, imported by all three". Only a check about an app's own code stays in that app's list. |
| every rule ticket | The apps' rules are `configs.recommended`/`strict`: three, `no-raw-element` (UIG-7), `no-rebuilt-behaviour` (UIG-8), `no-restyled-part` (UIG-9), which is also in `configs.package`. A new rule goes beside them; `src/eslint/index.test.ts` says which set is which, and each of UIG-7's, UIG-8's and UIG-9's `gates:status` checks reads that the apps get *its* rules, not *only* them. A rule added to `lint:rules` is required on `main` the day it lands, so it lands at zero errors, fixed or escaped (UIG-6). The apps' gates lint `.ts` and `.tsx`. |
| UIG-12 | `PART_LOOK_PROPS` (each part's look props, held to the source) and `PLACEMENT` (what may pass into a part), exported from `@estiva-app/ui/eslint` beside `OWNED_BEHAVIOURS`. UIG-9's rule already resolves an app's re-exports, wrappers and className-handing components to the part they draw: the registry can reuse that reading. |
| UIG-25 | **The gap UIG-9 names**: a look-alike built from plain boxes passes nothing into a part, so no rule sees it. Peek's `MemberAvatars` (`HuddleCard.tsx`) is one, the face stack `AvatarGroup` replaced. Ruling C2 made UIG-25 a warning; Katerina may rule again once it is counted. |
| later tickets | **Package gaps UIG-9 kept with reasons**: a row that is one link (Peek's `ProjectTickets`, Ship's `IssueRow` ×2); a search field that is a button (Peek's `TopBar`); `Card` with a failed, loading or faded state and `IconButton` shown on its card's hover (`AttachmentCard` ×5); `Card` with `href` drawn on `Link`. |
| UIG-14 | `IconButton` and `ToolbarButton` take `pressed`, which writes `aria-pressed`: Peek's text toolbar uses it. Peek's file tree and `ProjectTickets` still write `aria-expanded` / `aria-pressed` by hand. |
| every pull request | Nothing merges into `main` without `gate` green, and nobody can skip it. Never rename the job `gate` without changing the ruleset in each repo with it; `gates:status` UIG-6 reads both. In Peek and Ship only Jan can change the ruleset. |
| UIG-9, UIG-14 | Every form in the apps is the package `Form` (UIG-7): a hand-written Enter handler that sends is the thing to look for; UIG-8 does not read Enter or Escape. UIG-5's inward set does not read `<fieldset>`, `<details>`, `<progress>` or the elements with no part — `CommandPalette` kept a plain `<fieldset>` until UIG-7 — so an inward rule for those is open. |
| UIG-12 | `OWNED_BEHAVIOURS`, exported from `@estiva-app/ui/eslint`: each behaviour, the Base UI parts that do it, the components that own it, what the rule reads — the shape the registry can read (UIG-8). **Used: the registry reads it and keeps no list of its own.** |
| UIG-17, UIG-18, UIG-19, UIG-20, UIG-25 | **The apps' catalogues (UIG-13).** `buildAppRegistry({ root })` returns an app's catalogue at schema 2, built from its code every time — never read a committed one, there is none. Each entry's `app` holds its class, `usedIn`, `tiedTo`, `packageNamesake`, and a written reason when a person set the class (`@registry reusable: <reason>` in its comment). **UIG-17 and UIG-18 have their lists:** the entries whose class is `reusable` or `promote-candidate` — Peek 48 and Ship 12, as built (53 and 12 when this was written; Peek's moved as `main` merged in and as Katerina ruled `EditedMarker` stays) — get the five sections; a one-off keeps its purpose line. `findInRegistries` searches several; `estiva-ui find --also [name=]<folder>` adds an app beside. `h.catalogue(folder)` is the gate helper. What the builder learnt, all now tests: a part is what draws or is drawn as a tag, not what a folder holds; a pass-on can be written in two lines; `export { X as default }`, `export default memo(X)` and `export default class extends …` are parts; overloads are one part; a name in a type, a member or a shadowing local is not a use; `export * as`, `baseUrl` and `.then((m) => m.X)` are followed. |
| UIG-13, UIG-19, UIG-20, UIG-25 | **The catalogue (UIG-12).** `registry.json` at the package's root, schema 1, 81 entries; `@estiva-app/ui/registry` exports `buildRegistry`, `findInRegistry` and `validateRegistry`; the bin `estiva-ui` runs `find`, `build` and `check`. Read it, never parse the source again — and when a field is added, raise `SCHEMA_VERSION`, because a reader that knows version *n* has to be able to say so. **UIG-13 widens the same schema:** `repo` and `importPath` are already per entry, and `excluded` is there for a name Peek or Ship exports that is deliberately not an entry. Note what the builder learnt the hard way, all three now tests: Storybook's ids run the export name through `startCase`; a prefix search on words shorter than three letters matches everything; a file's header comment is not its first export's description. |
| UIG-14 | `aria-expanded` and `aria-pressed` written on a package component (Peek's file tree, `ProjectTickets`, the selection toolbar) are not read by UIG-8: the component is already the package's, and how to use it is a usage rule. |
| the route probe (later phase) | **A box that should scroll and does not** has no class for a lint to read — Peek's Folders column at `72c999c`. Only opening the page and scrolling it finds that (UIG-8). |
| UIG-31 | The / @ !@ [ menus' 7 escapes name it; its first-guess check reads that SlashMenu keeps none. |
| UIG-11 | **`npx -p @estiva-app/ui create-estiva-app leaf --title Leaf`** (0.23.0, the release that finishes UIG-10: never 0.22.x or older, because the files that wire the relay are written once), then `npm install` on Linux or in a container, and `git init -b main`. Still to do by hand, each proved on the UIG-10 throwaway: the GitHub repo; its ruleset, copied from estiva-ui's "gate on main" (`gh api repos/estiva-app/estiva-ui/rulesets/23534324`, then POST it to the new repo); and `leaf` in the ticket list's parts wherever it runs a check. **Sign-in and the relay on the real Estiva ID need Jan to register Leaf**: a `client_id`; its exact redirect URI; every kind it signs, **including 22242**, the relay's NIP-42 handshake; and `relay_auth_urls` holding `wss://estiva.estiva.app`, which the deployment's `SIGN_RELAY_AUTH_ALLOWED_URLS` must hold too. Anything left out fails at the last step, with every screen looking right. **Leaf proves the connection, signed in, with a photo**: UIG-10 could not, locally (§0). Locally it is one `app_credentials` row and `pnpm invite` in estiva-id. |
| every ticket, again | **Where a repo's gate files are, after UIG-32.** Peek: `eslint.gates.config.js`, `eslint.tokens.config.js`, `scripts/gates-checks.mjs`, `.claude/settings.json`, `docs/GATES-DEBT.md`. Ship: the same, but in `web/` — including `web/scripts/gates-checks.mjs`, because it imports the package and Ship's install is there — while `.claude/settings.json`, `gates:status` and the workflows stay in the top folder, and both the hook and `gates:status` name `--app web`. A made app: `appFiles()` in `src/gates/create-app.ts`. Nothing else is a gate file; if you find one, it is a copy. |
| every rule or fingerprint ticket | A probe every app runs goes into `appChecks` (`src/gates/app-checks.ts`), and every app — Peek, Ship and a made one — gets it with a version bump (UIG-32). Never paste it into a repo. `gates:compare` fails on a check in `appChecks` that neither app runs, so a check the apps cannot run yet is listed in `NOT_IN_THE_APPS_YET` (`scripts/gates-compare.mjs`) until they take the release that carries it. |
| UIG-10, UIG-11, UIG-26 | "Same row set" now reads "same gate checks" (§15), proved by `npm run gates:compare`. The starter reads only the package, never Peek or Ship; they are the yardstick of that comparison (§23). |
| UIG-21 | Its line counts are measured with imports: Peek **273**, Ship **298**, estiva-ui **192** (§22). |
| every ticket | Update your own checks and your row in §15 in the same session. A check every app runs belongs in the package's shared list (§23, from UIG-10); only a check about a repo's own code goes in that repo's `scripts/gates-checks.mjs`. |

**UIG-30 is listed everywhere:** Peek's and Ship's `scripts/gates-checks.mjs` gained its part in UIG-27's app PRs, and the status engine, the same file in all three repos (a hand-made copy, ruled a defect on 17 September, §23), now says "every ticket" instead of a count.

---

## §1 What UIG-1 did

One question: before we switch a rule on, how much would it actually block?

§3 answers it. One row per rule per repo. Real counts, real `file:line`, and the
exact words the error would print.

Katerina filled in the verdicts on 13 September. §14 has them all.

---

## §2 How I counted

### The files

Every `.ts` and `.tsx` under `estiva-ui/src`, `peek/src` and `ship/web/src`,
minus `*.stories.tsx` and `*.test.tsx`. That is the ticket's wording, taken
literally.

| repo | files |
|---|---|
| estiva-ui | 51 |
| peek | 254 |
| ship | 130 |
| **total** | **435** |

Three notes on that number.

**The ticket excludes `*.test.tsx` but not `*.test.ts`.** So 68 unit-test files
are inside the set: 3 in estiva-ui, 49 in Peek, 16 in Ship. They test logic and
contain no JSX. They have zero violations, so they change nothing here. When
UIG-3 writes the real lint, exclude `*.test.ts` too.

**The `*.stories.tsx` exclusion came from the ticket, not the guide.** I think it
was a mistake. §10 has the numbers. §3 to §8 stay on the ticket's file set so the
reconciliation still lines up; §10 is the second column.

**estiva-ui's 51** is 44 component files, plus `index.ts`, `cn.ts`, `fit.ts`,
`triggerDisabled.ts`, plus 3 `.test.ts`. The 44 matches the number UIG-5 quotes.

### The method

A throwaway Node script per rule family. Each one parses the file with the
TypeScript compiler API and walks the AST.

**No grep.** The ticket warned about this and it caught me twice:

- Grep finds 3 `overflow-auto` in estiva-ui. The AST finds 1. The other two are
  the word inside a comment.
- My own first pass measured hand-rolled behaviour by text match and reported
  `createPortal` in 7 package files. There are 2 call sites. The other five are
  prose.

Class rules match on **every string literal in the file**, not just on a
`className` attribute. So a class inside `cn()`, inside a `*Styles` map, or
assigned to a variable counts the same as one written inline.

Where a count depended on a judgement call, I give both numbers instead of
picking one. That is §3 family D, §5 P4, and §7.

---

## §3 The rule table

21 candidate rules, one row per repo. The message column is the exact error text.
Every message names a component.

**Verdicts ruled by Katerina, 13 September.** §14 explains what each one changes.

### Family A — forbid the raw element

Guide T10. Tickets UIG-3, UIG-4, UIG-7.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **raw-button** | estiva-ui | 8 | `src/Menu.tsx:295` · `src/Toast.tsx:105` · `src/Reaction.tsx:58` | see §5 P4 | **on** |
| | **peek** | **12** | `components/CommandLauncher.tsx:1363` · `components/HuddleCreator.tsx:87` · `components/ui/PendingAttachmentChip.tsx:58` | `A <button> here is not ours. Use Button, or IconButton when it is icon-only.` | |
| | **ship** | **0** | none found | same | |
| **raw-input** | estiva-ui | 1 | `src/ChipInput.tsx:205` | see §5 P4 | **on** |
| | **peek** | **4** | `components/CommandLauncher.tsx:1418` · `components/HuddleCreator.tsx:95` · `components/ui/AttachFiles.tsx:30` | `An <input> here is not ours. Use TextInput, SearchInput, or Checkbox for a tick box.` | |
| | **ship** | **2** | `components/Composer.tsx:183` · `components/ui/DescriptionEditing.tsx:215` | same | |
| **raw-anchor** ⛔ | estiva-ui | 3 | `src/NavItem.tsx:31` · `src/RailItem.tsx:27` · `src/Breadcrumb.tsx:91` | see §5 P4 | **on** once UIG-27 builds Link |
| | **peek** | **7** | `components/ui/MessageBody.tsx:51` · `components/ThreadReplyCard.tsx:500` · `components/ui/ForeignObjectWidget.tsx:277` | **no message possible. §9.1** | |
| | **ship** | **7** | `components/Board.tsx:24` · `components/IssueRow.tsx:66` · `components/IssuesTable.tsx:84` | **no message possible. §9.1** | |
| **raw-dialog** | estiva-ui | 0 | none found | `A <dialog> here is not ours. Use DialogShell, or ConfirmDialog to ask yes or no.` | **on** |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |

### Family B — forbid the reach

Guide T11. Ticket UIG-8.

> **Built 16 September as one rule, `estiva/no-rebuilt-behaviour`**, from the behaviour list rather than these candidates; the counts below are UIG-1's, and **UIG-8: building it** in §0 reconciles every one of them.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **no-base-ui-import** | estiva-ui | 22 | `src/Button.tsx:2` · `src/Checkbox.tsx:1` · `src/CollapsibleSection.tsx:2` | legitimate. This is the package's job. | **on** |
| | **peek** | **0** | none found | `Only @estiva-app/ui imports Base UI. Take the component from @estiva-app/ui, or add it there first.` | |
| | **ship** | **0** | none found | same | |
| **no-create-portal** | estiva-ui | 2 | `src/ChipInput.tsx:222` · `src/Toast.tsx:174` | see §5 P1 | **on** |
| | **peek** | **2** | `components/CommandLauncher.tsx:1327` · `components/ui/FileAttachmentCard.tsx:67` | `createPortal is not how we float things. Use Popover, Menu, Tooltip, PreviewCard or DialogShell. Each owns its own portal.` | |
| | **ship** | **0** | none found | same | |
| **no-keydown-listener** | estiva-ui | 0 | none found | same | **on** |
| | **peek** | **2** | `components/HuddleCreator.tsx:64` · `layouts/AppShell.tsx:34` | `A keydown listener on document is not how we take keys. Menu, Select, Popover and DialogShell own their own.` | |
| | **ship** | **0** | none found | same | |
| **no-role-dialog** | estiva-ui | 0 | none found | `A hand-written role="dialog" means a hand-made dialog. Use DialogShell. It traps focus and gives it back.` | **on** |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |
| **hand-written ARIA role**, wider | estiva-ui | 3 | `src/Divider.tsx:33` · `:46` (`separator`) · `src/Tooltip.tsx:69` (`tooltip`) | all legitimate — these components own those roles | **on** · `progressbar` once UIG-27 builds ProgressBar |
| *(see note)* | **peek** | **7** | `components/AddToOpenWorkDialog.tsx:71` (`option`) · `components/ui/ProjectTickets.tsx:22` (`progressbar`) · `components/CommandLauncher.tsx:1680` (`alert`) | `A hand-written role="option" means a hand-made listbox. Use Select.` | |
| | **ship** | **4** | `components/ui/ProgressBar.tsx:25` (`progressbar`) · `components/Composer.tsx:229` (`alert`) · `components/ui/DescriptionEditing.tsx:238` (`alert`) | same, per role | |
| **no-tabindex-on-div** | estiva-ui | 0 | none found | `tabIndex turns a box into a control. Use Button, IconButton or NavItem. They are focusable already.` | **on** · `tabIndex={0}` and up only |
| | peek | **0** | none found | same | |
| | **ship** | **1** | `components/ui/DescriptionEditor.tsx:77` | same | |
| **no-overflow-class** | estiva-ui | 1 | `src/ChipInput.tsx:224` | see §5 P1 | **on** |
| | **peek** | **2** | `components/CommandLauncher.tsx:1689` · `components/HuddleCreator.tsx:143` | `overflow-auto draws the browser's scrollbar. Use ScrollArea. It draws ours.` | |
| | **ship** | **1** | `components/ui/prose.ts:35` | same | |

Two notes on this family.

**`no-tabindex-on-div` as written is too broad.** It flags any `tabIndex` on a
non-interactive element. It should only flag `tabIndex={0}` or higher.
`tabIndex={-1}` is the correct way to make something focusable by script without
adding a Tab stop. See §10.

**I first measured `role="dialog"` only, and got 0 everywhere.** UIG-8's ticket
names `role="dialog"` / `"menu"` / `"listbox"` / `"tooltip"` / `"tab"`, so my
first count was too narrow. I went back and read every `role=` in all three
repos. There are 14. Two matter:

- **`AddToOpenWorkDialog.tsx:71` writes `<div role="option">`.** That is a
  hand-made listbox. `Select` exists.
- **`role="progressbar"` appears twice** — `peek/…/ProjectTickets.tsx:22` and
  `ship/…/ProgressBar.tsx:25`. Two apps each hand-built a progress bar, and the
  package has none. D6 lists Progress as something Base UI should own. That is a
  package gap, not just a rule violation.

The three `role="alert"` are inline error messages. `FieldLine` carries a tone
and may be the right answer; worth checking in UIG-15.

✅ **Checked in UIG-15 (19 September):** no `role="alert"` written by hand is left in Peek or Ship.

### Family C — fingerprints

Guide T12. Tickets UIG-22 to UIG-25.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **no-handmade-header** | estiva-ui | 1 → **0** | `src/DialogShell.tsx:117`, which owns the shape | `A panel header drawn by hand. Use SectionHeader.` | **on** |
| | **peek** | 4 → **3** | `components/ConversationHeader.tsx:132` · `components/ThreadPanel.tsx:233` · `components/ThreadPanel.tsx:367` | `A panel header drawn by hand. Use ContainerHeader.` | |
| | **ship** | **0** | none found | `A panel header drawn by hand. Use SectionHeader.` | |
| **no-handmade-empty-state** | estiva-ui | 0 | none found | `A line saying there is nothing is an EmptyState. Use EmptyState. scope="section" inside a section, scope="page" for a whole page.` | **on** |
| | **peek** | **7** | `components/CommandLauncher.tsx:1464` · `components/ReadStatePanel.tsx:65` · `components/views/FolderContentsView.tsx:101` | same | |
| | **ship** | **2** | `components/Board.tsx:61` · `components/ui/ForeignObject.tsx:206` | same | |
| **no-native-title** | estiva-ui | **0** | none found | `title= is the browser's tooltip, not ours. Use WithTooltip, or IconButton's tooltip prop.` | **on** |
| | **peek** | **3** | `components/ui/Reference.tsx:116` · `:137` · `:166` | same | |
| | **ship** | **3** | `components/ui/Reference.tsx:87` · `:103` · `:137` | same | |
| **no-copied-class-list** | estiva-ui | 14 | `src/TextInput.tsx:26` ≈ `Textarea.tsx:24` · `src/Chip.tsx:36` ≈ `Reaction.tsx:64` | see §9.4 | **warn** |
| | **peek** | **28** | `components/CommandLauncher.tsx:1339` ≈ `DialogShell.tsx:113` · `components/ThreadPanel.tsx:233` ≈ `DialogShell.tsx:117` · `components/ui/PersonRow.tsx:84` ≈ `Skeleton.tsx:22` | `This class list is DialogShell's, re-typed. Import DialogShell from @estiva-app/ui.` | |
| | **ship** | **2** | `auth/AuthShell.tsx:42` ≈ `DialogShell.tsx:87` · `components/Sidebar.tsx:91` ≈ `NavItem.tsx:38` | same | |

The two numbers in `no-handmade-header` are before and after removing the
component that owns the shape. `DialogShell` in the package and `ContainerHeader`
in Peek are the originals, so they should not be flagged against themselves.

### Family D — the className allow-list

Guide T13. Ticket UIG-9.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **className-placement-only** | estiva-ui | **8** | `src/Banner.tsx:62` (IconButton `text-current`) · `src/DialogShell.tsx:150` (ScrollArea `border-b`) · `src/Tooltip.tsx:115` (Tooltip `transition-[…]`) | `Only placement passes through IconButton's className. "text-current" changes how it looks. Ask for a prop on IconButton instead.` | **on** |
| | **peek** | **15** | `components/ui/ForeignObjectWidget.tsx:91` (Person `text-caption`) · `pages/FoldersPage.tsx:260` (EditableText `text-body-2-strong`) · `components/ui/ComposeBox.tsx:407` (IconButton `signal:shadow-glow-accent`) | same, with the component's own name | |
| | **ship** | **8** | `views/IssueView.tsx:120` (EditableText `text-h2`) · `components/NewProjectDialog.tsx:89` (TextInput `font-mono`) · `components/IssuesTable.tsx:47` (ScrollArea `border rounded-lg`) | same | |

> **Recounted by UIG-9, 17 September**, with the built rule: Peek 23, Ship 13, estiva-ui 34 on that day's mains, and UIG-1's numbers reproduced on UIG-1's commits — see §0, **UIG-9: building it**.

**Padding is allowed. That was already decided and I missed it.**

I first reported two numbers here and asked Katerina whether padding counts as
placement. It does. UIG-9's ticket spells the allow-list out and `p-*`, `px-*`,
`py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` are all in it. The numbers above are the
padding-allowed ones, which is the only set that matters.

For the record, the stricter reading would be estiva-ui 9, Peek 33, Ship 15. The
whole difference is padding pushed into `EmptyState`: 9 places in Peek, 6 in
Ship. That is not a rule violation, but 15 callers adding their own padding to
the same component does suggest `EmptyState` is missing a prop. Worth a look in
UIG-15.

✅ **Checked in UIG-15 (19 September):** solved by UIG-27, which gave `EmptyState` its own room for each scope. Peek passes it no padding; Ship passes one 4px gap (`mt-1`, placement) and three hand on their caller's classes.

### Already on, recorded so it is not counted twice

| rule | repo | count | note | verdict |
|---|---|---|---|---|
| colours & sizes (`lint:tokens`) | all three | 0 | Already a CI gate. In `eslint.tokens.js` since D36 (Ship) and D55 (Peek). | on, already |

---

## §4 Two rules I added

The guide's T10 names four raw elements. UIG-7's own summary says "text boxes,
dropdowns, links, dialogs". A dropdown is `<select>`, and a text box is as often
`<textarea>` as `<input>`. I measured both so the family has no hole in it.

| rule | estiva-ui | peek | ship | samples | message | verdict |
|---|---|---|---|---|---|---|
| **raw-select** | 0 | **0** | **0** | none found anywhere | `A <select> here is not ours. Use Select.` | **on** |
| **raw-textarea** | 2 | **0** | **0** | `src/Textarea.tsx:22` · `src/EditableText.tsx:143`, both `render` props | `A <textarea> here is not ours. Use Textarea.` | **on** |

Both are free. Zero violations in either app. The package's two are handed to a
Base UI `render` prop, which is the correct pattern. Turn them on in UIG-7 and
they can never regress.

---

## §5 The package-facing rules

UIG-5 names four rules that point inward at the package, and says UIG-1 measures
them. Measured against `estiva-ui/src`.

| | rule | count | what I found | verdict |
|---|---|---|---|---|
| **P1** | hand-rolled behaviour where Base UI has a part (D6) | **2 components, 6 sites** | `ChipInput` is the package's last hand-rolled float. It imports `./fit` (:5), listens to `window` resize and scroll itself (:143, :144), and portals by hand (:222). Base UI's Positioner and Portal do all four. `Toast.tsx:174` is the second `createPortal`. `fit.ts` now has one real caller; everything else moved to Base UI. | **on** · ChipInput fixed by PR #22, Toast at stage 6 |
| **P2** | a component with no `.mdx` doc page | **0** | All 44 have one. There are 46 `.mdx` files. The two extra are `FieldLine` and `MenuItem`, which are exported from a sibling file. That is the false positive UIG-5 warned about, and it is real. | **on** |
| **P3** | a component with no `.stories.tsx` | **0** | All 44 have one. Same two extras, same reason. | **on** |
| **P4** | a raw element outside a wrapper | **9** or **4** | The package has 14 raw elements. 5 are handed to a Base UI `render` prop, which is fine. Of the other 9, **4 sit nested inside a bigger component**: `Breadcrumb.tsx:91`, `ChipInput.tsx:43`, `ChipInput.tsx:205`, `Toast.tsx:105`. The other 5 are the component's own root element: `NavItem`, `RailItem`, `Reaction`, `EditableText`, `Menu.tsx:480`. | **on** · the tracer |

**Re-counted on 16 September, when UIG-5 built them** (main `ee14bab`): P4 is **2**
(`Breadcrumb.tsx:91`, `Toast.tsx:129`) and P1 is **0** — `ChipInput` moved onto Base
UI's Combobox at stage 5 and `Toast` onto Base UI's Toast at stage 6, so the two
`createPortal`s, the `window` listeners and `fit.ts` are all gone. P2 and P3 are still
0. The 14 raw elements split 2 buried, 4 in a `render` prop, 8 a component's own root.

P2 and P3 are at zero. That is good news, but it means neither can be the tracer:
a rule with nothing to fix proves nothing about the fix-or-escape path. Turn them
on in UIG-5 anyway. They cost nothing and they hold the line.

The package's four numbers, re-counted, all matching what UIG-5 quotes:
**44 component files, 46 doc pages, 46 story files, 45 export lines** in
`index.ts` (65 value exports across those 45 lines).

---

## §6 The escape-boundary number

The question: if we exempt no folder and require an escape marker per line, how
many markers is that?

| | peek | ship |
|---|---|---|
| raw elements (`button`, `input`, `a`, `dialog`) | 23 | 9 |
| of those, inside a pure re-export file | **0** | **0** |
| **escapes needed** | **23** | **9** |
| of those, inside `components/ui/` | 12 | 3 |
| outside it | 11 | 6 |

**Answer: yes, escapes only is workable.** 32 markers across both apps. Each one
names a real place worth a look later.

**Exempting `components/ui/` would be worse than useless.** The ticket suspected
this. The numbers confirm it.

- Peek's `components/ui` holds 83 files, 51 of them in scope. 15 are pure
  re-exports. **None of those 15 contains a raw element**, because a one-line
  re-export has no JSX in it. So the exemption catches nothing.
- What it would exempt is the 7 real components that hold the 12 raw elements:
  `FileAttachmentCard.tsx` (313 lines), `ForeignObjectWidget.tsx` (625),
  `ProjectTickets.tsx` (179), `MessageBody.tsx` (497),
  `PendingAttachmentChip.tsx` (138), `AttachFiles.tsx` (69),
  `MembersPill.tsx` (53).
- `PendingAttachmentChip` is on that list. The guide names it as the component
  nobody can find. An exempt folder would hide it from the thing built to
  surface it.
- Ship is the same shape. 52 files, 40 in scope, 28 pure re-exports with no raw
  element in any of them, and 3 raw elements sitting in 2 real components
  (`ForeignObject.tsx` 232 lines, `DescriptionEditing.tsx` 249).

*The ticket's "80 files" and "50 files" are the same folders counted a day
earlier, before excluding stories and tests.*

---

## §7 The tracer rule for UIG-5

**Use `raw-element-outside-a-wrapper` (P4), narrow definition. 4 violations.**

| candidate | count | why not |
|---|---|---|
| P1 hand-rolled behaviour | 2 components | Fixing it means moving `ChipInput` onto Base UI Combobox. That is stage 5 of the migration, far too big for a tracer. |
| P2 no doc page | 0 | Nothing to fix. |
| P3 no story | 0 | Nothing to fix. |
| `no-copied-class-list` inward | 14 | It is a similarity threshold, not a fact. A tracer has to be unarguable. |
| `className-placement-only` inward | 9 | Solid, but its definition is the thing you still have to settle. |
| **P4, narrow** | **4** | ✅ |

Why P4:

- It mirrors UIG-3's Peek rule almost exactly, so the chain gets proved with the
  same rule code. That is the point of a tracer.
- 4 is the right size. Enough to exercise fix, escape, count and reconcile.
  Small enough to finish in one ticket.
- It is mechanical. Is this element inside a `render` prop? Is it nested inside
  another element? Both are AST facts.
- The narrow definition does not flag a primitive for owning its own root
  element. The wide definition (9) would need 5 escapes on day one for code that
  is correct.

The four: `Breadcrumb.tsx:91` (`<a>`), `ChipInput.tsx:43` (`<button>`),
`ChipInput.tsx:205` (`<input>`), `Toast.tsx:105` (`<button>`). **By the time UIG-5 built
it, 16 September, it was 2**: `ChipInput`'s went with stage 5 (§0, UIG-5: building it).

---

## §8 Reconciliation

Every candidate rule the guide names appears in §3 exactly once.

| source | named | measured | where |
|---|---|---|---|
| Guide T10, forbid the raw element | 4 | 4 | §3 family A |
| Guide T11, forbid the reach | 6 | 6 | §3 family B |
| Guide T12, fingerprints | 4 | 4 | §3 family C |
| Guide T13, className allow-list | 1 | 1 | §3 family D |
| **guide total** | **15** | **15** | ✅ |
| Added by UIG-1 from UIG-7's wording | 2 | 2 | §4 |
| Package-facing, named by UIG-5 | 4 | 4 | §5 |
| **total against the guide** | **21** | **21** | ✅ |
| Found by UIG-1, named nowhere | — | 4 | §11 |
| **candidates in total** | | **25** | |

Two things the guide names that are deliberately not in §3:

- **Colours and sizes.** That is `lint:tokens` and it is already a CI gate.
  Recorded at the foot of §3.
- **"Every control reachable by Tab."** That is a runtime check in gate 3's route
  probe, not a lint rule. Out of scope for UIG-1.

`tabIndex` on a div appears in the guide's gate 2 prose but not in the T11 table
row. I measured it anyway. The standing rule is that a rule the guide names is in
scope even where a ticket's example list forgot it.

**Total violations across the 17 app-facing rules: 200.** That is 198 from the
guide's 15 rules, plus 2 from `raw-textarea`. `raw-select` is 0 everywhere. The
four package-facing rules re-measure the same estiva-ui source from a different
angle, so they add nothing to that total.

That 200 is source files only. §10 counts the stories and tests the ticket's file
set leaves out.

---

## §9 Five things I found that the ticket did not ask for

### ⛔ 1. We cannot turn on the link rule. We have no Link component.

14 raw `<a>` across Peek and Ship. There is no Link component in the package, in
Peek, or in Ship. I checked all three.

`NavItem`, `RailItem` and `Breadcrumb` each take an `href`, but none of them fits
what these 14 do. They are three different jobs:

- **A whole card or row made clickable.** Ship's `Board.tsx:24`,
  `IssueRow.tsx:66`, `IssuesTable.tsx:84`, `ProjectCard.tsx:55`.
- **An external link inside prose.** Peek's `MessageBody.tsx:51` (`BodyLink`).
- **A small inline link.** Peek's `ThreadReplyCard.tsx:500`.

An error message that cannot name a component is a rule people switch off. So
`raw-anchor` waits until the package has a link component. That is a UIG-7
dependency nobody had written down.

There is a second trap here. Ship's `<a>` elements spread `{...linkTo(href)}`,
the wrapper from SHI-20 that stops every click reloading the whole app. Whatever
replaces them has to carry that, or the navigation bug comes straight back.

### ⚠️ 2. The guide names the wrong Base UI package.

The guide says `@base-ui-components/*`. The installed package is
`@base-ui/react`. A rule written from the guide's spelling would match nothing
and pass, silently.

Against the real name: **22 imports in estiva-ui**, which is correct because that
is the package's job, and **0 in either app**. So the rule is free to turn on and
can never regress.

Fix the guide when UIG-2 commits it.

### ✅ 3. `CommandLauncher.tsx` is where the rules will actually hurt.

**Done by UIG-29, 16 September:** the file is on the package's `CommandPalette` (peek PR #233), every count below replaced, none escaped. See §0, UIG-29: building it.

One file holds 4 of Peek's 12 raw `<button>`, 1 of its 4 raw `<input>`, 1 of its
2 `createPortal`, 1 of its 2 `overflow-auto`, 1 of its 7 hand-made empty states,
and 5 of its 28 copied class lists.

Its copied class lists match `DialogShell`, `ChipInput` and `SearchInput`. In
plain terms: it has hand-built a dialog, chips and a search box that the package
already has.

It is 1,655 lines. It needs its own ticket, whatever the verdicts are. Do not let
it hold up turning the rules on everywhere else.

### 4. The package copies its own class lists.

All 14 of estiva-ui's `no-copied-class-list` hits are the package copying itself.
`TextInput.tsx:26` and `Textarea.tsx:24` share 7 classes out of 7. Also
`Chip.tsx:36` ≈ `Reaction.tsx:64`, `IconButton.tsx:63` ≈ `RailItem.tsx:35`,
`SearchInput.tsx:34` ≈ `Select.tsx:144`, `SectionHeader.tsx:96` ≈
`Skeleton.tsx:22`.

This is a different problem from an app re-typing a component. These are sibling
primitives that should share a constant. UIG-25 is not aimed at it. Noting it so
it does not get lost.

### ⚠️ 5. "Peek has 5 pages and 0 page stories" is out of date.

The guide says it twice, and T17 is costed on it.

Peek has 5 pages and **3** page stories. `stories/layouts/Pages.stories.tsx` runs
Desk, Topics and People through a `PeekApp` harness on seed data.

The gap is still real, just smaller and more specific:

- **`FoldersPage` has no story.** Neither does `ObjectPage`. Folders is the page
  all eight defects were on.
- **No page has an empty or loading state.** The file says so itself: "Empty /
  first-login states arrive with the Convex data layer."

So T17 still stands. It is "2 of 5 pages missing, and only the happy path", not
zero. Fix the guide alongside finding 2.

---

## §10 Stories and tests

**You asked why I excluded `*.stories.tsx` and `*.test.tsx`.**

Because UIG-1's Scope line said to. Nothing in the guide asks for it. That was my
wording when I wrote the ticket, and I think it was wrong.

### What the guide says a story is

| where | what it says |
|---|---|
| T9 | "Storybook as the doc surface. Every registry row links to a live story. One place to look, not three ports." |
| Gate 0 | Every registry entry carries "a link to its live story". |
| Gate 0, *Catches* | "A component with no story and no explanation." |
| Gate 3 | "Every story shot in both themes", diffed, and you accept or reject each canvas. |

So a story is the documentation, it is where gate 1 sends people, and it is what
gate 3 photographs for your review. Exempting it means the surface we built to
teach people is the one surface allowed to get it wrong.

### The count

Same 17 rules, split by what kind of file the violation is in.

| repo | source files | story files | test files |
|---|---|---|---|
| estiva-ui | 48 | 46 | 30 |
| peek | 205 | 59 | 91 |
| ship | 114 | 20 | 50 |

*Source + tests is the 51 / 254 / 130 in §2. The ticket excludes `*.test.tsx` but
not `*.test.ts`, so 3 / 49 / 16 test files were counted as source there.*

| rule | estiva-ui *src/story/test* | peek | ship |
|---|---|---|---|
| raw-button | 8 / **1** / 31 | 12 / **7** / 1 | 0 / 0 / 0 |
| raw-input | 1 / 0 / 1 | 4 / 0 / 0 | 2 / 0 / 0 |
| raw-anchor | 3 / 0 / 2 | 7 / 0 / 0 | 7 / 0 / 0 |
| raw-textarea | 2 / 0 / 0 | 0 / **1** / 0 | 0 / 0 / 0 |
| no-base-ui-import | 22 / 0 / 1 | 0 / 0 / 0 | 0 / 0 / 0 |
| no-tabindex-on-div | 0 / **1** / 0 | 0 / 0 / 0 | 1 / 0 / 0 |
| no-overflow-class | 1 / 0 / 1 | 2 / **1** / 0 | 1 / 0 / 0 |
| no-handmade-empty-state | 0 / **1** / 0 | 7 / 0 / 0 | 2 / 0 / 0 |
| no-native-title | 0 / 0 / 0 | 3 / **3** / 0 | 3 / 0 / 0 |
| no-copied-class-list | 14 / **2** / 0 | 28 / **1** / 0 | 2 / 0 / 0 |
| **className-placement-only** | 9 / **19** / 0 | 33 / 0 / 0 | 15 / **1** / 0 |
| **total, all 17 rules** | 63 / **24** / 36 | 104 / **13** / 1 | 33 / **1** / 0 |

*Rules with nothing in any column are left out of this table.*

**200 in source. 38 in stories. 37 in tests.**

### The finding

**estiva-ui's stories break the className rule 19 times. Its source breaks it 9
times.** The package's documentation is twice as bad as the package.

Three examples:

**`Person.stories.tsx:34-37`** is the *Sizes* story. It shows four Persons, and
changes the type size on each one with `className="text-caption"`,
`text-body-2`, `text-body-1`. That is the doc page teaching people to do the
thing the rule forbids. `Property.stories.tsx:31` and `:45` go further and push
raw `text-[12px] leading-[120%]` through.

**`ScrollArea.stories.tsx`** passes `rounded-lg border border-border-default
bg-bg-surface` into `ScrollArea` in six stories. Ship's `IssuesTable.tsx:47` does
the same thing in the app. The story taught it and the app copied it.

**`ReactionPicker.stories.tsx:100`** writes "Nothing here yet." by hand instead
of using `EmptyState`.

### Tests look different

31 of estiva-ui's 36 test violations are one rule in one place: raw `<button>` in
`Button.compose.test.tsx` and its neighbours, mounting bare elements to check
that composition works.

That is a test doing its job. Tests are not documentation and nobody copies them.

### What I recommend

| | |
|---|---|
| ✅ | **Stories in.** 38 violations across all three repos. A day's work. |
| ❌ | **Tests out.** 37 violations, 31 of them a test legitimately mounting a raw element. Exclude `*.test.tsx` and `*.test.ts`. |

Three of the story violations should get an escape marker rather than a fix. They
are good arguments for having the escape hatch at all:

- **`Checkbox.stories.tsx:43`** wraps a `Checkbox` in a raw `<button>`. That is
  your own "the row is the control" ruling.
- **`Popover.stories.tsx:169`** puts `tabIndex={-1}` on a `<p>`, with a written
  reason and "measured" next to it. This one also tells us the rule is too broad.
  `tabIndex={-1}` is the correct way to make something focusable by script.
  Only `tabIndex={0}` or higher adds a Tab stop. UIG-8 should flag those.
- **`peek/src/stories/SignalTheme.stories.tsx`** has 6 raw `<button>`, a
  `<textarea>` and 3 native `title=`. It is a Storybook-only theme preview with
  its own `<style>` block and `sig-*` CSS. It is deliberately not built from our
  components, and it already carries a file-level `eslint-disable` for the token
  lint for the same reason. Give it one file-level escape. Not a folder
  exemption, for the reason in §6.

✅ **Katerina said yes, 13 September. Stories in, tests out.** Every lint rule
from UIG-3 onwards checks `*.stories.tsx` and skips `*.test.ts` and `*.test.tsx`.
UIG-3's Peek count goes from **12 to 19**.

---

## §11 Four more candidates the guide does not name

**Katerina asked whether this is really the full rule set. It is not.**

§3 covers everything the guide's gate 2 names, and §8 proves that. But the guide
wrote gate 2 as four families of examples, not as a finished specification. Here
are four more candidates I found while counting. All four are measured. None of
them has a verdict yet.

### ⚠️ G1. Arbitrary values walk straight through the token gate

> 🚧 **UIG-28 builds this rule, and G2's.** The counts below are UIG-1's, from 13 September; UIG-28's recount, its prefix list and its reconciliation are in §0, **UIG-28: building it**.

This is the important one.

`lint:tokens` has been a CI gate since D36 and D55. It blocks `text-sm`, blocks
Tailwind's palette, and blocks a raw colour inside an arbitrary value.

**It does not block `text-[14px]`.**

I proved it rather than assuming it. `npx eslint --config eslint.tokens.config.js
src/components/CommandLauncher.tsx` exits 0. Line 891 of that file is:

```
<div className="text-[14px] font-normal leading-[1.4] text-text-primary truncate">
```

So the type ramp can be written by hand, today, and the gate we already trust
says nothing.

Counted across source files, arbitrary values that are not colours and that sit
on a type or spacing prefix:

| repo | all arbitrary values | of those, type or spacing |
|---|---|---|
| estiva-ui | 75 | **33** |
| peek | 290 | **157** |
| ship | 21 | **12** |

Peek's 157 is the number that matters. `CommandLauncher.tsx` alone writes
`text-[14px] leading-[1.4]`, `text-[12px] leading-[1.2]`, `text-[13px]`. That is
the ramp, re-typed.

The package does it too: `Breadcrumb.tsx:72` and `Kbd.tsx:33` both carry
`text-[14px] leading-[140%]`.

**My recommendation: this belongs in UIG-9, and it is worth more than most of
§3.** A rule that blocks `text-sm` but allows `text-[14px]` is not a gate, it is
a speed bump. Proposed message:

`text-[14px] is the type ramp written by hand. Use text-body-2. If no token
fits, add one to tokens.css.`

Spacing and size arbitraries (`h-[240px]`, `gap-[3px]`) are a weaker case and
probably want *warn*, not *on*. A one-off panel height is a real thing.

### G2. Inline `style={{ }}`

Not named by the guide. It is the same reach as a hand-written class, and it is
invisible to every class rule we have, including `lint:tokens`.

| repo | source | stories |
|---|---|---|
| estiva-ui | 7 | 0 |
| peek | 20 | 43 |
| ship | 6 | 0 |

Most of them are legitimate: a width computed from a prop (`Avatar.tsx:81`,
`ProgressBar.tsx:32`, `Sidebar.tsx:92`). Those cannot be a class and should not
be.

The ones worth catching are the colours: `HighlightsCard.tsx:169` and
`HighlightPill.tsx:20` and `:33` set `backgroundColor` inline, which is outside
the token system completely.

**Recommendation: narrow rule, not a broad one.** Flag inline `style` only when
it sets a colour, a font size, or a border. Let computed geometry through.

### G3. The same component name in more than one repo

The guide's T3 wants a near-duplicate scan. I ran the cheapest version of it:
which component names are defined in more than one repo.

**17 names.** But most are not what you would think, and this is why T3 needs
care before it becomes a rule.

**Legitimate wrappers, 10 of them.** Peek's `Avatar`, `EmptyState`, `Person`,
`Reaction`, `SearchInput`, `AvatarGroup` are thin files that import the package's
component and add data to it. `peek/src/components/ui/Avatar.tsx` is 20 lines and
its whole job is to feed `useAvatarSrc` into the package's `Avatar`. That is the
right pattern, not a duplicate.

**Real duplicates, 5.** `ColorGrid`, `RadiusGrid`, `SemanticGrid`, `ShadowGrid`,
`TypeRamp` exist in both `peek/src/stories/Swatches.tsx` and
`ship/web/src/stories/Swatches.tsx`. The same swatch page, copied.

**One that matters, 1.** `Reference` is hand-built in both Peek and Ship. Both
copies carry the same three native `title=` attributes I flagged in §3 family C.
**The same bug, twice, because the component was copied instead of shared.** That
is a candidate to promote into the package, and it belongs on UIG-17 and UIG-18's
promote lists.

**Recommendation: T3 needs a wrapper carve-out** or it reports 17 things where 6
are real. A file that imports the same-named component from `@estiva-app/ui` is a
wrapper, not a duplicate.

### G4. The docs contract is already met

The guide's T2 says a component page without *When*, *When not* and *How* should
fail CI.

I checked all 46 `.mdx` pages in the package.

| section | missing from |
|---|---|
| When | **0** |
| When not | **0** |
| How | **0** |
| Props | 1 — `Skeleton.mdx` |

So T2 is free to switch on, same as `raw-select` and `raw-textarea`. It costs
nothing today and it stops the next component shipping without a rule.

Whether `Props` joins the required set is a small call. `Skeleton` exports three
things and has no props of its own, so it may be correct as it is.

### Where this leaves the rule set

| | |
|---|---|
| §3 | 15 rules, from the guide. Complete against the guide. |
| §4 | 2 rules I added from UIG-7's own wording. |
| §5 | 4 package-facing rules, from UIG-5. |
| **§11** | **4 more that nobody had written down.** |
| **total** | **25 candidates** |

I do not think §11 is the last of them. A lint rule set for a design system is
something you grow for a year. What §3 to §5 gives you is the set the guide
committed to, and §11 is what one careful pass over the code turned up on top of
it. If you want, the honest next step is to run the same exercise once more after
UIG-3 proves the chain, when we know what a rule costs to add.

---

## §12 What UIG-1 did not do, and an ordering question

Katerina expected UIG-1 to read every component and write the rule for each one.
It did not, and the reason is a naming problem in our own documents.

**"Rules" means two different things in this project.**

| | |
|---|---|
| **Lint rules** | A machine blocks bad code. "No raw `<button>`." This is UIG-1, §3 to §11. |
| **Usage rules** | A written page per component. What it is for, when to use it, when not to. This is UIG-12 to UIG-19. |

Nothing separates those two words anywhere in the guide, the backlog or the
tickets. They should be named differently from here on.

### estiva-ui already has its usage rules

All 44 components have an `.mdx` page with *When*, *When not*, *How* and a story.
I checked all 46 pages (§11 G4).

They are good. `Popover.mdx` under *When not* sends you to `Menu` for a list of
actions, `Select` for one value from a set, `WithTooltip` for a word about a
control, and says why each. That is the standard the rest should match.

### The gap is Peek and Ship

| repo | exported components | doc pages | real files with no story |
|---|---|---|---|
| estiva-ui | 63 | **46** | 0 |
| peek | 113 | **0** | 37 |
| ship | 55 | **0** | 25 |
| **total** | **231** | **46** | **62** |

Peek and Ship have four `.mdx` files between them: `Introduction` and
`DesignTokens`, twice. **No component page in either app.**

So the usage-rule work is **168 components across Peek and Ship**. That is
UIG-17 and UIG-18, and they are the two biggest tickets in the project.

*(190 real component files hold those 231 exports. Peek has 16 pure re-export
files and Ship has 31, which is why the file counts and the component counts
differ.)*

### ⚠️ The ordering question

The guide calls gate 0 plus gate 1 — the catalogue and the usage rules — "the
single biggest lever on the problem you described."

Our ticket order puts the lint wall in phase 1, Leaf in phase 2, and the
catalogue and usage rules in phase 3.

The guide's own verdict on building the wall alone: *"it refuses the wrong thing
without teaching the right one."*

**UIG-1 produced evidence for that.** §9.1 found a rule I cannot write.
`raw-anchor` has 14 violations and no error message, because no Link component
exists to name. The rule is blocked by missing "know" work.

That will happen again. Every lint message has to name a component. Deciding
which component to name *is* the usage-rule work. Doing the wall first means
writing messages before we have decided what they should say.

**My recommendation: bring the estiva-ui half of gate 0 forward.** UIG-12 (the
registry) and UIG-14 to UIG-16 (estiva-ui's usage rules) are cheap, because the
package's 44 pages already exist — those tickets are mostly reconciling what is
written with what the code does. Doing them before UIG-3 means every lint message
in phase 1 can point at a decided answer.

UIG-17 and UIG-18, the 168 app components, are the expensive half and can stay in
phase 3.

✅ **Ruled 13 September: keep the order.**

My recommendation changed before she ruled, and the reason is worth keeping.
UIG-27 now builds the missing Link component. So the one lint rule that was stuck
for lack of a decided answer is not stuck any more, and every other phase-1 rule
already has a component to name. Moving the usage pages earlier would have cost
her a review of 44 components' *When not* lines before phase 1 could start, for
no rule that needed it. Look at this again after phase 1.

---

## §13 Does every finding here actually get fixed?

Katerina asked. I checked each one against the ticket text rather than assuming.

**Mostly yes. Six things had no ticket at all. They all have one now** — see the
tables below, closed 13 September.

The tickets are written better than I had assumed. UIG-7, UIG-8, UIG-9 and UIG-25
all define their target set by reading the code, not by a list, and each says the
examples are not the scope. So most findings here land somewhere by construction.

### Findings that have a home

| finding | lands in | why it is safe |
|---|---|---|
| raw button / input / dialog counts | UIG-3, UIG-4, UIG-7 | UIG-7 derives the element list from the package's exports, so `<select>` and `<textarea>` (§4) are in without being named. |
| forbid-the-reach counts | UIG-8 | Its target set is "every behaviour the package owns", enumerated from Base UI imports. Wider than my list. |
| the wider `role=` finds | UIG-8 | It already names `menu`, `listbox`, `tooltip`, `tab`. |
| className allow-list | UIG-9 | Target set is import analysis over both apps. |
| copied class lists in the apps | UIG-25 | Reads the registry, covers all 233 components. |
| hand-made header, empty state, native tooltip | UIG-22, UIG-23, UIG-24 | One ticket each. |
| the docs contract (§11 G4) | UIG-19 | Locks it in CI. |
| `Reference` duplicated in both apps (§11 G3) | UIG-17, UIG-18 | Both produce a promote list. |
| escape-boundary numbers | UIG-3, UIG-7 | Feeds the escape design. |
| the tracer recommendation | UIG-5 | Its ticket says UIG-1 names it. |

### ✅ The six with no ticket — closed, 13 September

Katerina said to create them before phase 1 starts. Three became new tickets.
Three were folded into tickets that already existed, because the work belonged
inside them.

| # | finding | where it lives now |
|---|---|---|
| **1** | No Link component. 14 raw `<a>`. | **UIG-27** (new). `Link` is in the package since 0.13.0; the count grew to 20 (§0), and all 20 are fitted: peek PR #218, ship PR #151. Also **UIG-7** now waits on it, and its acceptance says all 14 anchors are replaced or escaped — **not** recorded as "allowed". |
| **2** | `CommandLauncher.tsx`, 1,655 lines. | **UIG-29** (new). Runs alongside phase 1 and is explicitly told never to block it. ✅ **Fixed 16 September**: on `CommandPalette`, 14 of 14 replaced, 0 escaped (§0, UIG-29: building it). |
| **3** | Arbitrary values outside a package component. Peek 157. | **UIG-28** (new). ✅ Done: estiva-ui PR #34 (0.14.0), peek PR #222, ship PR #153 (§0). |
| **4** | Inline `style` that sets a colour. | **UIG-28** (new), same ticket. ✅ Same. |
| **5** | estiva-ui copying its own class lists. 14. | **UIG-25**, target set widened to include `estiva-ui/src`, with a second message for a primitive copying a sibling. |
| **6** | "Rules" means two things. | **UIG-2**, item 5c. A wording pass over the guide, the Ship brief and every ambiguous ticket. |

The two smaller ones went with them: **ProgressBar** and **EmptyState's padding
prop** are both in UIG-27, and UIG-8 now waits on UIG-27 for the
`role="progressbar"` branch. ProgressBar is in the package since 0.13.0;
EmptyState gets no padding prop, by Katerina's ruling (§0, ruling 6).

### ✅ The three that were only recorded here — now in their tickets

| finding | added to |
|---|---|
| `tabIndex={-1}` must pass; only `0` and up is a violation | **UIG-8** |
| P2 (no doc page) and P3 (no story) are free at zero — switch them on | **UIG-5** |
| The near-duplicate scan needs a wrapper carve-out, or it reports 17 where 6 are real | **UIG-25** |

### ✅ Four errors found inside the tickets themselves, corrected

Reading the ticket text to answer this question turned up four mistakes that had
nothing to do with UIG-1's count.

| | |
|---|---|
| **UIG-2** | Its acceptance said the committed guide must be "identical in substance to the artifact", which would have **forced it to commit the two errors §9.2 and §9.5 found**. Rewritten: identical *except* the corrections, each listed with its evidence. |
| **UIG-8** | Said "UIG-11's registry". The registry is **UIG-12**. UIG-11 is the Leaf repo. |
| **UIG-5** | Same wrong reference, same fix. |
| **UIG-5** | Said the package's four numbers "do not agree". They do. 44 `.tsx`, 46 `.mdx`, 46 stories, 45 export lines — the two extra are `FieldLine` and `MenuItem`, exported from a sibling file. Corrected. |

### UIG-28: what building it found

| | finding | where it goes |
|---|---|---|
| ⛔ | **The raw-colour rule in Peek and Ship has matched nothing since it landed** (Ship 8 September, `3601f68`; Peek 11 September, `2edde1f`). Their pattern writes `[[][^]]*`, and in JavaScript `[^]` means "any one character", so `bg-[#5c69dc]` passes. estiva-ui's copy writes `\[[^\]]*` and works. The same probe gives 0 errors in Peek and Ship, 3 in estiva-ui. It hides 5 raw colours in Peek, 0 in Ship. | ✅ Katerina ruled the fix (R1); fixed in peek PR #222 and ship PR #153. Peek's 5: 3 fixed, 2 escaped (UIG-29) |
| ✅ | **The token lint cannot see a class list in a variable it does not know.** It reads `className`, `cn()`/`clsx()` and maps named `…Classes`/`…Styles`. UIG-28's own example `IssuesTable.tsx:37` is a `const TH`; Ship's `prose.ts` is an array; estiva-ui's `AttachmentCard` held `NAME`, `NOTE` and `TILE`; Peek's TipTap `editorProps.attributes.class` holds `text-sm`, which also slips past the type-ramp rule. | R5. estiva-ui's renamed in UIG-28; the apps' in their PRs (`TH_CLASSES`, `PROSE_BLOCK_CLASSES`, `PEEK_EDITOR_CLASSES`, `HIGHLIGHT_FILL_CLASSES` / `HIGHLIGHT_TEXT_CLASSES`) |
| ✅ | **The lint cannot read a class list through `.join()`** either: Ship's `prose.ts` was `[...].join(' ')`, and a probe proved a string, an array and a template are read while the joined array is not. The list is a named array now, joined into the export. | ship PR #153 |
| ✅ | **Both apps' Design Tokens pages drew every label and every type specimen at 16px** (measured, both mains): Storybook's docs container sets 16px on every `div` at the same specificity as a token class. The package's page had already fixed it with `<Unstyled>`. The app pages had also drifted from the tokens (no `text-small`). Katerina's call: deleted, the package's page is the one (§0, A4). | peek PR #222, ship PR #153 |
| ✅ | **No story draws Peek's reference-widget text field**, the one field migration stage 6 changed there. A throwaway story photographed it before and after; it was not committed. | recorded |
| ✅ | **Both app mains moved while the PRs were open** (Peek: FOL-25, PEE-31; Ship: SHI-25). Each branch was merged with its new main locally and linted before the PRs were merged: 0 errors. | recorded |
| ✅ | **The ticket's reason for the package's hand-written sizes was out of date.** `cn()` names the ramp for tailwind-merge since 1 September, so a size token beside a text colour survives. Nothing in the package needed an escape for it. | recorded |
| ✅ | **`eslint.tokens.js` and `lint:tokens` exist only in Peek.** Ship and estiva-ui keep the token rules inline in `eslint.config.js` and run `npm run lint`. The ticket named Peek's layout for all three. | recorded |
| ✅ | **The preset has no spacing token.** Heights and spacing use Tailwind's default scale, so the warning names a step of that scale, not `tokens.css`. `InlineChip`'s `h-[1.4em]` and `h-[19.6px]` (§0, UIG-27's findings) are heights: warnings, no escape. | recorded |
| ✅ | **The older rules' variant part `(?:[a-z0-9-]+:)*` misses arbitrary variants and named groups.** The new block does not copy it. | the four older rules stay as they are (ticket) |
| ✅ | `EnterHint`'s `target` is passed by nothing: no app, no story. | recorded |
| ✅ | `src/MenuItem.stories.tsx` has `\r\r\n` on three lines, so ESLint's line numbers there run three ahead of an editor's. | matters only when placing an escape |

### UIG-29: what building it found

| | finding | where it went |
|---|---|---|
| ✅ | Base UI `Autocomplete` moves the highlight on Home and End, and keeps the highlight's position rather than its row when rows arrive above it. | fixed in `CommandPalette` (0.16.0, 0.16.1), each pinned by a test |
| ✅ | The approved prototype had three bugs: focus to the wrong missing field, focus lost after Ctrl+Enter, a footer naming keys that did nothing. | not carried into the build |
| ✅ | A message search hit dropped the tags naming its thread, so a reply could not be opened at. | fixed in peek PR #233 (`MessageHit.root`) |
| ⬜ | C5 is half built: a created issue lands in the composer as raw `nostr:naddr…` text, and nothing records in the thread that it was created there (the issue event has no thread tag; a reply has no `a` tag). | Katerina, 16 September: a new session builds the composer chip and the thread line; the line as a real record needs Jan (`@estiva-app/protocol`) |
| ⬜ | The Make proposal card's two lines are token classes inside `Card`, not a palette part. | recorded; a palette part when next touched |

### What is still true

Nothing in this document is now waiting on a ticket that does not exist.

Three things still wait on **Katerina**, and they are in §0: the verdict column,
stories in or out, and the ordering question in §12.

---

## §14 Katerina's rulings — 13 September 2026

She was given the rules in four groups, with a recommendation for each, and ruled
on all of them. **24 on, 2 warn, 0 dropped.**

### Group A — nothing to fix today

| | rule | verdict | ticket |
|---|---|---|---|
| A1 | No plain `<dialog>` | **on** | UIG-7 |
| A2 | No plain `<select>` | **on** | UIG-7 |
| A3 | No plain `<textarea>` | **on** | UIG-7 |
| A4 | Apps don't import Base UI directly | **on** | UIG-8 |
| A5 | No hand-made dialog (`role="dialog"`) | **on** | UIG-8 |
| A6 | Every package component has a doc page with *When*, *When not*, *How* | **on** | UIG-5, locked in CI by UIG-19 |
| A7 | Every package component has a story | **on** | UIG-5 |

### Group B — small, clear fixes

| | rule | verdict | ticket |
|---|---|---|---|
| B1 | No plain `<button>` | **on** | UIG-3 (Peek), UIG-4 (Ship) |
| B2 | No plain `<input>` | **on** | UIG-7 |
| B3 | No hand-made floating layer (`createPortal`) | **on** | UIG-8 |
| B4 | No hand-written keyboard listener | **on** | UIG-8 |
| B5 | No browser scrollbar (`overflow-auto`) | **on** | UIG-8 |
| B6 | No browser tooltip (`title=`) | **on** | UIG-24 |
| B7 | No hand-made panel header | **on** | UIG-22 |
| B8 | Only position and spacing pass into our components | **on** | UIG-9 |
| B9 | No hand-made list option (`role="option"`) | **on** | UIG-8 |
| B10 | No focusable `<div>` (`tabIndex` 0 and up) | **on** | UIG-8 |
| B11 | No colours in inline `style` | **on** | UIG-28 |
| B12 | No hand-written font sizes like `text-[14px]` | **on** | UIG-28 |
| B13 | Package: no plain element that isn't wrapping anything | **on** | UIG-5, the tracer |

### Group C — rules that guess

| | rule | verdict | ticket |
|---|---|---|---|
| C1 | Hand-made empty state | **on** — *overruled my advice of warn* | UIG-23 |
| C2 | Styling copied from one of our components | **warn** | UIG-25 |
| C3 | Hand-written heights and spacing like `h-[240px]` | **warn** | UIG-28 |

### Group D — waiting on something

| | rule | verdict | ticket |
|---|---|---|---|
| D1 | No plain link `<a>` | **on** — "we will build it" | UIG-27 builds Link, then UIG-7 |
| D2 | No hand-made progress bar | **on** — "we will build it" | UIG-27 builds ProgressBar, then UIG-8 |
| D3 | Package: no hand-made positioning | **on** — "we will fix it" | see below |

### Stories and order

- **Stories in, tests out.** Every rule from UIG-3 on checks `*.stories.tsx` and
  skips `*.test.ts` and `*.test.tsx`. UIG-3's Peek count goes from 12 to 19.
- **Keep the order.** The usage pages stay in phase 3. §12 explains why the
  recommendation changed before she ruled.

### What the rulings change

**C1 is on, so UIG-23 has to be exact.**
I had advised *warn* because the rule, as UIG-1 measured it, guesses from the
words. It flagged `CommandLauncher.tsx:1498` — *"Nothing is created until you
submit it."* — which is a hint, not an empty state. A warning can afford a
mistake like that. A blocking rule cannot: every false alarm stops a merge.
Katerina ruled *on*, so UIG-23 must not match on wording alone. It has to look at
what the element is and where it sits, and that line must pass.

**C2 and C3 are warnings, not errors.**
UIG-25 builds a rule that reports and does not block. UIG-28 splits its
arbitrary-value rule in two: font sizes block, heights and spacing warn. That was
the split UIG-28 said needed her ruling, and she has given it.

**D3 already has its fix, in two parts, and neither is a new ticket.**

- **`ChipInput` is fixed by stage 5 of the migration: estiva-ui PR #22**, built
  13 September by another session in a separate worktree. **Merged, and released
  as `0.12.7`.** `fit.ts` is deleted, `ChipInput` no longer imports it, the two
  `window` listeners are gone, and the raw `<input>` is gone. The one
  `createPortal` left in the file is inside a comment. Checked, not assumed.
- **`Toast` moves onto Base UI's `Toast` at stage 6** of the migration. Not built.
  Her standing ruling is that the gates come before the migration, so `Toast`
  keeps its hand-made portal until then. When UIG-5 switches the rule on,
  `Toast.tsx` carries an escape whose reason names stage 6.

**PR #22 changes UIG-5's tracer count.** Two of the four tracer violations were
in `ChipInput`. PR #22 removes the raw `<input>` (`:205`) and keeps the raw
`<button>`, which moves from `:43` to `:49`. PR #22 has now merged, so the tracer
is expected to be **3**, not 4. UIG-5 must re-count on current `main` before it
reconciles.

### Tickets updated to match

UIG-3, UIG-4, UIG-5, UIG-23, UIG-25 and UIG-28. UIG-7 and UIG-8 already pointed
here for the stories answer, and this section gives it, so they were left alone.

### Later: UIG-28's rulings, 15 September

R1 to R5 — the raw-colour fix, corners and shadows as errors and widths as
warnings, one `text-small` token for Signal's small labels, her pick on every
size close to a token, and the renamed class maps — are in §0, **UIG-28:
building it**.

## §15 The route — phases and the tickets

UIG-2 wrote this. Ship holds each ticket's full text. `gates:status` holds each
ticket's status, read from the code. This section holds what neither does: the
phases, who owns each ticket, and what counts as evidence.

**No status is written here on purpose.** A status in a document goes stale the
day it is written. Run `npm run gates:status` for it.

### The phases

| phase | tickets | when it is done |
|---|---|---|
| 0 · count and track | UIG-1, UIG-2 | The lint rules are chosen from real numbers, and every ticket after is tracked from the code. |
| before 1 | UIG-27, UIG-28 | The package has Link and ProgressBar, and the token lint has no hole for `text-[14px]`. |
| 1 · the wall | UIG-3 to UIG-9 | Nobody can write or merge code that reaches past the system, in any of the three repos. |
| alongside 1 | UIG-29 | `CommandLauncher.tsx` is on the package's components, with no key behaving differently. |
| 2 · Leaf's road | UIG-10, UIG-11, UIG-32 | Leaf starts, behind the wall, at zero violations, and every gate piece has one copy, in the package. |
| 3 · the catalogue | UIG-12 to UIG-19 | One list of every component in the three libraries, and a usage rule for every reusable one. |
| 4 · make it read | UIG-20, UIG-21 | A session searches the catalogue before it builds, and `CLAUDE.md` is an index. |
| 5 · the fingerprints | UIG-22 to UIG-25 | The shapes of mistake that reached Katerina cannot reach her again. |
| close | UIG-26 | The package carries every gate, an app made from it passes them all, Leaf has every rule, and the numbers are measured. |

The phases come from the roadmap artifact, revision 5. UIG-27, UIG-28 and UIG-29
were added by UIG-1's findings on 13 September. UIG-30 was added while UIG-27 was
planned, the same day, and runs after it. UIG-32 was added on 17 September by Katerina's ruling in §23.

### The tickets, who owns each, and what gates:status checks

Every ticket is **owned by exactly one repo**. That repo's `gates:status` prints
it as its own row. A ticket that touches other repos has **parts** there, checked
where the files live and joined into the one row when estiva-ui runs.

**How the owner was chosen:** the repo the ticket names as holding its main
work. A lint rule's code lives in estiva-ui, so every lint rule ticket that runs
in all repos is owned by estiva-ui. A ticket whose work is in one app is owned by
that app. A ticket spread evenly over all repos is owned by estiva-ui.

| ticket | title | owner | parts in | what counts as evidence today |
|---|---|---|---|---|
| UIG-1 | Count every candidate lint rule across all three repos | estiva-ui | | GATES.md §3 (the counts) and §14 (her verdicts) |
| UIG-2 | The tracking rails | estiva-ui | peek, ship | the guide committed, no wrong Base UI name, §15 exists, `gates:status` wired in all three |
| UIG-3 | Tracer bullet — one rule, end to end, blocking in Peek | peek | estiva-ui | the plugin in `src/eslint` with `no-raw-button` and an `./eslint` export; in Peek: the gate config loads, `lint:rules`, CI, the hook, `.gates-count.json`, and a lint probe: a raw `<button>` is an error in source and in a story, not in a test |
| UIG-4 | The same chain, blocking in Ship | ship | | in `ship/web`: the gate config loads, `lint:rules`, CI runs it, `.gates-count.json`, and lint probes (a raw `<button>` is an error naming Button in source and in a story, not in a test); the hook in the top folder's `.claude/settings.json`; `docs/GATES-DEBT.md` (confirmed by UIG-4, 16 September) |
| UIG-5 | The same chain inside estiva-ui, pointed inward | estiva-ui | | the chain (config, `lint:rules`, CI, the hook, `.gates-count.json`) and six probes: a nested raw element is an error and a component's own outermost element is not, a Base UI `render` prop is not, hand-rolled behaviour is, a component with no page and one with no story are errors naming the file they want, and `FieldLine` and `MenuItem` are not orphans (confirmed by UIG-5, 16 September) |
| UIG-6 | Branch protection | estiva-ui | peek, ship | in each repo: `main` requires exactly the check `gate` (rulesets and classic protection, read the way anyone who can read the repo may), and CI's job `gate` runs `lint:rules` (confirmed by UIG-6, 16 September) |
| UIG-7 | Lint rule — every remaining raw element | estiva-ui | peek, ship | in estiva-ui: the apps get exactly `no-raw-element`, every part its mapping names is exported, `Form`, `FilePicker` and `Checkbox`'s `label` exist, and the command palette's form is `<Form enterSends={false}>`; in Peek and Ship, probes: `<input>` names TextInput, `<a>` Link, `<form>` Form and a file input FilePicker, `<textarea>`/`<select>`/`<dialog>`/`<label>` their parts, an element with no part says to ask, an escape passes while the same element is refused, and a real page gets no error (confirmed by UIG-7, 16 September) |
| UIG-8 | Lint rule — forbid the reach | estiva-ui | peek, ship | in estiva-ui: the apps get exactly `no-raw-element` and `no-rebuilt-behaviour`, every part the rule names is exported, `OWNED_BEHAVIOURS` exported, `Checkbox` has `row`, `ScrollArea`'s bar is `z-10`; in Peek and Ship, probes: a Base UI import names `Popover`, `createPortal` names `DialogShell`, a key listener in a `.ts` file is an error, arrow keys are and Enter is not, `role="option"` names `Select`, `tabIndex={0}` names `Button` and `{-1}` passes, `overflow-y-auto` names `ScrollArea`, an escape passes against its control, a real page gets none (confirmed by UIG-8, 16 September) |
| UIG-9 | Lint rule — the className allow-list | estiva-ui | peek, ship | in estiva-ui: the apps get exactly `no-raw-element`, `no-rebuilt-behaviour` and `no-restyled-part`, the rule is in the package's own set, `PART_LOOK_PROPS` and `PLACEMENT` exported, a look passed into a part is an error naming it, placement is not, padding on `EmptyState` is an error, an escape passes, the new props exist; in Peek and Ship, probes: a border into `Button` names Button, placement passes, a re-export, a props-handing wrapper and a className-handing component are followed, an escape passes against its control, a real page gets none (confirmed by UIG-9, 17 September) |
| UIG-10 | create-app | estiva-ui | peek, ship | the package's bins are `create-estiva-app` and `estiva-gates`; `src/gates/create-app.ts` names no sibling repo (`../peek`, `../ship`, `GATES_PEEK`, `GATES_SHIP`); `@estiva-app/ui/gates` exports the token lint, the gate config, the count, the hook, the status engine and `appChecks`, and `./gates` is in `exports`; `gates:compare` is wired (confirmed by UIG-10, 17 September); `src/gates/create-app.ts` writes the three relay packages and `src/relay/client.ts` with one `createLiveClientHolder()` (reopened, 18 September). In every app, from `appChecks`: one module-level client holder and no socket of its own |
| UIG-11 | Create the Leaf repo from it | estiva-ui | | `estiva-app/leaf` exists on GitHub; a `leaf` checkout beside estiva-ui |
| UIG-12 | The registry, thin and proved | estiva-ui | | `registry.json` committed at schema 1, with `entries + excluded` equal to the value exports of `index.ts`, no entry without a purpose, and every entry carrying the props it declares (not only its word-choices, which are a view of them); `ui:find` wired; the catalogue ships in the package (the `estiva-ui` bin, the `./registry` export, `registry.json` in `files`); CI runs `registry:check`, which rebuilds and fails on a difference; the builder reads `OWNED_BEHAVIOURS` rather than a list of its own (confirmed by UIG-12, 18 September) |
| UIG-13 | The registry widens to Peek's and Ship's | estiva-ui | peek, ship | in estiva-ui: `buildAppRegistry` and `findInRegistries` exported; `registry.json` is the package's own at schema 2, with no app entry (the package is public); `ui:find` passes `--also peek=` and `--also ship=`; create-app writes `ui:find`, `registry:check` in job `gate` and ignores `registry.json`. In each app (appChecks, confirmed by UIG-13, 18 September): `ui:find` and `registry:check` run the package's commands, CI's job `gate` runs `registry:check`, the app's folder ignores `registry.json`, and `h.catalogue` builds it: every part described and sorted |
| UIG-14 | Usage rules — every page (UIG-15 and UIG-16 folded in, 18 September) | estiva-ui | peek, ship | every component importing `@base-ui/react` keeps the page contract — an opening line, When, When not, How with code, What it owns — and `src/pages.test.ts` reads What it owns against `OWNED_BEHAVIOURS` |
| UIG-15 | Folded into UIG-14 | estiva-ui | | `EmptyState.mdx` keeps the page contract; this record walks the eight Folders mistakes, D1 to D8; `ContainerHeader.mdx` states 48px, 20px in and 16px from the right |
| UIG-16 | Folded into UIG-14 | estiva-ui | | every component page keeps the page contract; table R in this record lists every page; the record holds the rule on exports that are not parts |
| UIG-17 | Usage rules — Peek's own components | peek | | `PendingAttachmentChip.mdx` has the five sections; every Peek registry entry has a class |
| UIG-18 | Usage rules — Ship's own components | ship | | every **reusable** part has a page keeping the package's contract — an opening line, When, When not, How with code, What it owns (four headings, not five: "what it is" is the opening line); `DescriptionEditor.mdx` and `BlockAnchorNote.mdx` too, by Katerina's ruling of 22 September; every page either carries its own stories or says where it is seen; `.storybook/main.ts` globs `src/components/**/*.mdx`; `ForeignObject`, `RichText`, `ConversationCount` and `BlockAnchorNote` each have a story file; every entry in Ship's catalogue has `app.class` (confirmed by UIG-18, 22 September) |
| UIG-35 | Lightbox — one attachment part that opens a picture full screen, for both apps | estiva-ui | peek, ship | `Lightbox` exported and on Base UI's `Dialog`; `no-rebuilt-behaviour.ts` names it as an owner; `--scrim-strong` in all four themes; `AttachmentCard` has `remoteSrc`, `remoteFullSrc`, `fetchImage`, `download` and `alt`; `Lightbox.mdx` keeps the page contract and has a story; and, read from each checkout, Peek keeps no `ui/FileAttachmentCard.tsx` and draws the package's card, Ship's `Attachment.tsx` draws it and fetches nothing by hand (8 checks; confirmed by UIG-18's audit, 22 September) |
| UIG-19 | Lock the contract in CI (re-scoped 23 September) | estiva-ui | peek, ship | `src/registry/cli.ts` runs the contract and the links; the package's `gate` job runs `registry:check`; neither app keeps its own copy of the section check; in each app, the installed package carries the contract and `gate` runs it |
| UIG-36 | Estiva ID gets its own Storybook, and leaves Peek's | estiva-ui | | estiva-id has `.storybook/main.ts` and `storybook` on :6009; Peek's `.storybook/main.ts` loads no other repo; `styles.css` styles the email field, a field with no type, and `ul.plain` |
| UIG-20 | The Claude skill | estiva-ui | peek, ship | a committed `SKILL.md` that runs `ui:find` |
| UIG-21 | CLAUDE.md becomes an index | estiva-ui | peek, ship | `.claude/rules/*.md` with `paths:` frontmatter |
| UIG-22 | Fingerprint — hand-made header row | estiva-ui | peek, ship | probe: a padded row at the top of a pane names ContainerHeader (Peek) or SectionHeader (Ship) |
| UIG-23 | Fingerprint — hand-made empty state | estiva-ui | peek, ship | probe: "Nothing here" in place of an empty list names EmptyState, in all three repos |
| UIG-24 | Fingerprint — browser tooltip | estiva-ui | peek, ship | probe: `title=` names WithTooltip |
| UIG-25 | Fingerprint — component copied by hand | estiva-ui | peek, ship | probe: SectionLabel's class list typed by hand is a **warning**, in all three repos |
| UIG-26 | Re-run the starter, close the loop | estiva-ui | | every other ticket is done (worked out by estiva-ui's run) |
| UIG-27 | Link, ProgressBar, EmptyState padding | estiva-ui | peek, ship | `Link`, `InlineChip`, `ProgressBar`, `Card` and `AttachmentCard` exported (0.13.0); `EmptyState.mdx` places a section's empty state inside its rows' box (no padding prop, Katerina, 14 September); each app installs a version that has them and its hand-made progress bar is gone; Peek's `inlineChip.ts` and `PendingAttachmentChip.tsx` stay deleted and a posted file draws `AttachmentCard`; Ship's mentions draw `InlineChip` and its files `AttachmentCard` (15 September) |
| UIG-28 | The two holes in the token contract | estiva-ui | peek, ship | probes on each repo's token lint (7 in the package, 8 in each app): `text-[14px]`, a hand-written line height behind an arbitrary variant and an inline colour are errors; `h-[240px]` is a warning and not an error; a width and height from a prop pass; a test file is not checked while source is; in the apps, a raw colour in a class is an error (R1). Each check of a rule was seen to fail with its rule removed (15 September) |
| UIG-29 | CommandLauncher | peek | | the file passes the gate lint with no escape naming UIG-29, and imports `CommandPalette` from the package (it read `DialogShell` until UIG-29 found DialogShell did not fit, 16 September) |
| UIG-30 | RichText | estiva-ui | peek, ship | `RichText` exported (a first guess, until UIG-30 is built) |
| UIG-31 | Editor menus | estiva-ui | peek | the package exports the editor-menu part; Peek's SlashMenu keeps no escape naming UIG-31 (a first guess, 16 September) |
| UIG-32 | Peek and Ship take their gate pieces from the package | estiva-ui | peek, ship | the package exports `./gates`; and, read from estiva-ui in each app: its gate config and its full lint config import `@estiva-app/ui/gates`, its committed hook runs the package's `cli.js`, its `gates:status` runs the package's engine, and it keeps no copy of the hook, the status engine, the count, `eslint.gates.js` or `eslint.tokens.js` (11 checks). In each app, `appChecks` checks the same of itself (1 each) — 13 in all |
| UIG-33 | Link — a whole row that is one link | estiva-ui | peek, ship | first guess: `Link` takes `row`, or a row part is exported |
| UIG-34 | A tree part — Peek's file tree and folder list | estiva-ui | peek | first guess: `index.ts` exports `Tree` |

The contract is an opening line saying what it is, then *When*, *When not*, *How* (with code) and
*What it owns*, from UIG-14; `src/pages.test.ts` holds it.

**Evidence for a ticket not yet built is a first guess, taken from its own
text.** A ticket's code may name things differently. The ticket that builds it
changes its checks in `scripts/gates-checks.mjs` and its row here, in the same
session. Since §23, a check every app runs belongs in the package's shared list,
not pasted into each repo's file. Every ticket already says so in its acceptance criteria.

### The arithmetic

| | |
|---|---|
| tickets | **32** |
| owned by estiva-ui | **27** — UIG-1, 2, 5 to 16, 19 to 28, 30, 31, 32 |
| owned by peek | **3** — UIG-3, 17, 29 |
| owned by ship | **2** — UIG-4, 18 |
| **27 + 3 + 2** | **32** ✅ |
| parts checked in estiva-ui | 1 — UIG-3 |
| parts checked in peek | 19 (UIG-10 and UIG-13 counted from 18 September) |
| parts checked in ship | 18 (UIG-10 and UIG-13 counted from 18 September) |

`gates:status` proves this on every run rather than trusting this table. It
fails loudly if a ticket is claimed twice, claimed by nobody, claimed by a repo
the list does not name, or if a repo checks a part the list does not give it.
On 13 September it printed: *Each ticket is owned by exactly one repo, and every
repo agrees.*

### "The same row set" is now "the same gate checks"

UIG-10, UIG-11 and UIG-26 said a new app's `gates:status` must report "the same
row set as Peek's and Ship's". That cannot be true once each ticket has one
owner: Peek owns UIG-3 and Ship owns UIG-4, so their rows differ. What those
tickets meant is that a new app carries every gate the apps carry. All three now
say **the same gate checks**. UIG-2 decided one owner per ticket, so the three
tickets were aligned to it rather than the other way round.

---

## §16 The five seams

A seam is a decision made now, cheaply, so a later phase builds on top with no
rework. They come from the roadmap artifact, §07.

| | seam | the decision | why it was chosen | built by |
|---|---|---|---|---|
| **S1** | The lint rules are a plugin, not config | A publishable plugin inside estiva-ui from the first commit, with its own tests. **Widened 17 September (§23):** every piece that switches a rule on ships in the package too — the hook, the count, the status engine, the shared checks, the token settings. | Leaf gets every lint rule written after it launches through an ordinary version bump. The hook runs the same rule code as the lint, so the two cannot disagree. | UIG-3 |
| **S2** | The registry is a data source | A versioned schema with stable field names, read by machines first and rendered second. One per repo, merged into an index. | The MCP server, the duplicate scan and any public docs file read it and nothing else. A Markdown generator would need three parsers. | UIG-12, UIG-13 |
| **S3** | Every lint run writes its count | `.gates-count.json` per repo, committed from day one, even though nothing compares it yet. The count is each repo's; the script that writes it ships in the package (§23). | The later ratchet is one CI step comparing two numbers, and the history of the number falling starts at the first commit. | UIG-3, UIG-4, UIG-5 |
| **S4** | The escape marker is machine-readable | `// @estiva-escape: <reason>` — a fixed shape, parsed and reported. Never a free comment, never `eslint-disable`. | The adoption number can subtract sanctioned exceptions honestly, and the report lists every escape with its reason and age. | UIG-3 |
| **S5** | The starter is generated from the package, never copied | **Corrected 17 September (§23).** It reads only `@estiva-app/ui`, where every gate piece ships, and writes thin files that import them. It never reads Peek or Ship. Until then this row said "assembled from the live repos": Peek and Ship are private, and reading them carries their history into every new app. **Built 17 September:** `create-estiva-app`, in 0.21.0 (UIG-10). | Anyone with npm can run it, and a gate added later reaches a made app through a version bump. A copied folder would be stale the next day. | UIG-10, UIG-26 |

**S4 since UIG-3.** The plugin reads the marker: a rule of `@estiva-app/ui/eslint`
is escaped only by `// @estiva-escape: <reason>` or
`{/* @estiva-escape: <reason> */}` directly above, with 10 characters of reason,
and the count sees every one. The token lint's rules are not the plugin's, so
ESLint's own directive still switches them off, and their escapes stay
`eslint-disable-next-line <rule> -- @estiva-escape: <reason>` (A2; Katerina, 15
September: leave them alone). After UIG-3 there are 37 of those — 3 in the
package, 32 in Peek (29 in `CommandLauncher.tsx`, naming UIG-29), 2 in Ship — and
1 plugin escape, in Peek.

**S1, one reach it does not have.** The hook reaches a Claude session started in
the repository's folder, not one started above it (§0, UIG-3's first finding),
nor one started in a folder below it: in Ship, a session started in `web/` does
not get the hook in the top folder (UIG-4, measured with two real sessions).

S1 and S5 together are why building the starter before the catalogue costs
nothing: every later lint rule, and every later gate piece, reaches Leaf through
the package (§23).

---

## §17 How gates:status reads the code

### The files

| repo | files | run it |
|---|---|---|
| estiva-ui | `scripts/gates-status.mjs`, `scripts/gates-checks.mjs` | `npm run gates:status` — all 29 tickets, joining in `../peek` and `../ship` |
| peek | the same two | `npm run gates:status` — Peek's 3 tickets and its 15 parts |
| ship | the same two, at the repo root | `npm run gates:status` — Ship's 2 tickets and its 15 parts |

`gates-status.mjs` is **the same file in all three repos**. estiva-ui's run
compares the copies and warns when they differ. `gates-checks.mjs` is each repo's
own list. Neither file reaches estiva-ui's published package: its `files` list
does not include `scripts/`.

**Ruled a defect, 17 September (§23).** The engine, and the checks every app
runs, move into the package in UIG-10; each repo keeps a one-line script and a
list of the checks about its own code. UIG-32 moves Peek and Ship onto them.

**Since UIG-32 (0.21.1) every repo runs the one engine.** `npm run gates:status`
runs `estiva-gates status`, the engine in `@estiva-app/ui/gates`
(`src/gates/status.ts`); only `gates-checks.mjs` stays in the repo, and it is
`appChecks(h, …)` plus the checks about that repo's own code — Peek 12, Ship 7,
a made app none yet. The checks file sits **beside the app**, because it imports
the package: `scripts/` in Peek and in a made app, `web/scripts/` in Ship, whose
install is in `web/`; everything it names is still read from the repo's top
folder, and Ship's hook and `gates:status` say `--app web`. estiva-ui reads a
sibling through the engine that sibling has installed, and would read one still
carrying `scripts/gates-status.mjs` through that copy — none does now. The line
under each sibling says which.

Flags: `-- --detail` prints every check under every row. `-- --json` prints
machine output; estiva-ui's run reads the other repos that way. `GATES_PEEK`,
`GATES_SHIP` and `GATES_LEAF` point at a checkout that is not in the usual place.

### How a row is decided

| | when |
|---|---|
| ✅ | every check passes |
| 🚧 | some pass |
| ⬜ | none pass |
| ❔ | a check could not run: a repo is missing, GitHub cannot be asked, or the lint config would not load |

A missing repo is ❔, never ✅. A ticket cannot read done while any of its parts
is unread.

### What counts as evidence

| kind | example | how it is read |
|---|---|---|
| a file exists | `docs/GATES-DEBT.md` | on disk |
| a file is committed | `.gates-count.json` | `git ls-files` |
| a config loads | `eslint.gates.config.js` | imported for real |
| a script is wired | `lint:rules` | `package.json` |
| CI runs it | `npm run lint:rules` | a step in `.github/workflows/*.yml` — a word in a comment does not count |
| the hook runs it | the gates hook | `PreToolUse` in `.claude/settings.json` — any other hook does not count |
| a lint rule fires | a raw `<button>` | a line of code is linted **in memory, never written to disk**, with the repo's own config, the way the hook will |
| CI has the job | the job `gate` | a job by its id under `jobs:` in `.github/workflows/*.yml`, with a step that runs the script — a comment line does not count |
| a GitHub setting | branch protection | `gh api` on `rules/branches/<branch>` and `branches/<branch>`, which anyone who can read the repo may ask — not `…/protection`, which answers only an admin and knows no rulesets; ❔ without `gh` |

**Nothing is read from a list someone ticks.** GATES.md itself is read only for
UIG-1 and UIG-2, whose deliverable is this document.

### Proved, 13 September

**A built thing, deleted, flips its row back.** In Peek, an
`eslint.gates.config.js` and a `lint:rules` script were added, then deleted:

| step | UIG-3's row |
|---|---|
| before | ⬜ 0 of 8 |
| config and script added | 🚧 2 of 8 — the config loads, the script is wired; the other six fail and say why |
| both deleted | ⬜ 0 of 8 |

**A lint probe can tell pass from fail.** On Peek's real token config, `text-sm`
is an error and `text-[14px]` is not. So UIG-28's ⬜ is the hole itself, not a
broken check.

**The status files break no existing check.** Both lint clean in estiva-ui and
Peek. Peek's `eslint .` has 0 errors in them. Ship's `tsc --noEmit` includes
`scripts/` but not `.mjs`, and still exits 0.

**A fresh session can answer "where are we?" from these sources alone.** A new
agent, with none of the conversation behind UIG-2, was given only this file, the
guide, `npm run gates:status` and the Ship project, and told to read nothing
else. It answered all of these correctly, quoting the source for each:

| question | its answer |
|---|---|
| done, in progress | UIG-1 done; UIG-2 built on the branch, waiting to merge; 27 not started |
| waiting on Katerina | merge PRs #24, #204, #148; paste §19's wording into the Ship description |
| next | UIG-27 and UIG-28, then UIG-3 to UIG-9 in order, UIG-29 alongside |
| how many, who owns | 29; estiva-ui 24, peek 3, ship 2 |
| where the true status is | `npm run gates:status`, with `-- --detail` |

It also found three things, all now handled:

| | it said | now |
|---|---|---|
| 1 | `gates:status` shows UIG-2 ✅, but the Ship description paste is part of UIG-2 and no check can see it | §0 says so. A setting in Ship is not code; the ticket closes in Ship. |
| 2 | The sources do not show the memory note was written | Written at the end of the session, after the proof ran. §0 lists it. |
| 3 | §9.2 and §13 still say what UIG-1 wrote | §22 already records both as stale, and why they are left. |

It could not tell whether the PRs are still open. That is right: a merge is not
in the code, so check GitHub.

### Four false passes, caught while building

Each would have shown a ticket as started that was not.

| | the check | what went wrong | fixed |
|---|---|---|---|
| 1 | CI runs the usage-page contract (UIG-19) | estiva-ui's `check.yml` has the words "token contract" in a comment | matches an `npm run` step only |
| 2 | a test file is not linted (UIG-3, UIG-4) | a config that lints nothing passes it | passes only once source files are linted |
| 3 | `tabIndex={-1}` is not an error (UIG-8) | same: a config that lints nothing passes it | passes only once `tabIndex={0}` is caught |
| 4 | no escape still names UIG-29 (UIG-29) | true today, because no escapes exist yet | passes only once the gate lint passes the file |

The lesson for whoever adds a check: **a check that expects nothing must first
prove something is being checked.**

### Limits

- It reads the **checked-out branch** in each repo, not `main`.
- It reads **installed** packages. A stale `node_modules` gives a stale answer;
  Ship's `web/node_modules` is one today (§0).
- Lint probes need `node_modules` installed. The run takes about 25 seconds.

---

## §18 The guide, committed — what changed and why

`docs/GATES-GUIDE.md` is the guide artifact, version `1789170129-badc`, written
12 September. It went in as two commits, so each change shows in the diff.

### The proof

| step | result |
|---|---|
| 1. A script converted the HTML to Markdown. No sentence was retyped. | 509 lines |
| 2. A second script took every word from both and diffed them. | **4,572** words each, **0** places that differ |
| 3. Changing one word in a test copy | reported exactly **1** |
| 4. The approved changes were applied, each an exact match that must occur once | **36** changes |
| 5. The same diff, after | **49** places differ, and every one belongs to one of the 36 |

Both scripts were throwaway, as UIG-1's were. This table is their record.

### The ticket expected three corrections. One was not in the guide.

| | the ticket said | what was true |
|---|---|---|
| a | The guide says `@base-ui-components/*` | **The guide never names a Base UI package.** It says "Base UI" three times. The wrong spelling was in **UIG-1's and UIG-8's ticket text**, and UIG-8 was already corrected on 12 September. GATES.md §9.2 was wrong to say the guide had it. `grep` finds 0 in `docs/GATES-GUIDE.md`. |
| b | "Peek has 5 pages and 0 page stories", twice | True that it was wrong. It was there **four** times. F2 to F5. |
| c | "Rules" means two things | True, and there was a third meaning. §19. |

### Wrong facts about our code — Katerina approved fixing all of them

Every number and fact about Estiva in the guide was checked against the code,
GitHub or the git history as of 12 September. The reasoning, the plans and the
research were left word for word.

| | where | the guide said | now says | evidence |
|---|---|---|---|---|
| ✏️ **F1** | §01 step 2 | 43 components in the package | 44 components in the package | `v0.12.3`, the version the guide names, has 44 component files in `src/`. `v0.12.6` and `main` have 44 too. |
| ✏️ **F2** | §01 step 5 | and Peek's 5 pages have 0 stories between them. | and Peek's 5 pages have 3 stories between them, none for Folders and none empty or loading. | `src/stories/layouts/Pages.stories.tsx` draws Desk, Topics and People. It was added on 13 July (`6c44b6b`), so "0" was never true. `FoldersPage` and `ObjectPage` have no story. No page story has an empty or loading state. |
| ✏️ **F3** | §04 gate 3 | Peek has 5 pages and 0 page stories; every one | Peek has 5 pages and 3 page stories, none for Folders and none empty or loading; every one | Same evidence as F2. |
| ✏️ **F4** | §05 T17 | Peek has 5 pages and 0 page stories. \| M \| ours \| | Peek has 5 pages and 3 page stories, none for Folders and none empty or loading. \| M \| ours \| | Same evidence as F2. |
| ✏️ **F5** | footer | Peek has 5 pages and 0 page stories, 58 story files | Peek has 5 pages and 3 page stories, 58 story files | Same evidence as F2. |
| ✏️ **F6** | §04 gate 2 | Peek's 79 existing lint errors | Peek's 80-odd existing lint errors | `npx eslint src` in Peek: 81 errors at every `main` commit from PR #193's merge (`c618250`, 11 September) to `f3d97f4` (12 September 09:24 UTC), then 86 from `2fa9116`. Never 79. The same setup reproduced PR #193's own recorded 81. |
| ✏️ **F7** | §04 gate 2, catches | - The Folders scroll bug (`overflow`) | - A hand-rolled scrolling box (`overflow-auto`) | The Folders column had **no** scroll container at all. Peek commit `3dc663b` says so: "a column that should scroll and never did has none to find". A lint rule that looks for `overflow-auto` cannot catch a missing class. |
| ✏️ **F8** | §04 gate 2, cannot catch | - Spacing, rhythm, hierarchy, taste / - That is gate 3, and then you | - Spacing, rhythm, hierarchy, taste / - The Folders scroll bug: a column with no scroll container has no class for a lint rule to find / - That is gate 3, and then you | Same evidence as F7. Gate 3's route probe checks it: "every scroll container is a package viewport", with tall data. |
| ✏️ **F9** | §07 Ship | Retrofitted. PR #130, then #132, then #133, then #139. / Four pull requests to reach a package it could have started on. | Retrofitted. PRs #78, #92, #99, #108, #113, #130, #132 and #133. / Eight pull requests to reach a package it could have started on. | Ship's merged PRs that took `@estiva-app/ui`, up to 12 September: #78 (2 Sept), #92, #99, #108, #113, #130, #132, #133 (9 Sept). #139 is not one: it removed Storybook's theme picker (D58) and changes only `web/.storybook/preview.tsx`. |
| ✏️ **F10** | §07 Peek | PR #193 — 29 commits, 0.9.0 to 0.12.3, and a month. | PR #193 — 29 commits, 0.9.0 to 0.12.3, over two days. | PR #193's first commit is 9 September 17:35 UTC and it merged on 11 September 17:59 UTC. It has 29 commits and moves `@estiva-app/ui` from `^0.9.0` to `^0.12.3`. |
| ✏️ **D1** | §04 gate 2 | `<dialog>` outside a shim folder); forbid the reach | `<dialog>`, with no folder exempt: an exception is one marked line); forbid the reach | UIG-1 §6: app `components/ui` folders mix one-line re-exports with real components, so exempting the folder would hide the 7 real components that hold raw elements, `PendingAttachmentChip` among them. UIG-3 builds per-line escapes only. Ruled 13 September. |
| ✏️ **D2** | §05 T10 | No `<button>`, `<input>`, `<a>`, `<dialog>` outside a shim folder. Error names the component. | No `<button>`, `<input>`, `<a>`, `<dialog>` in an app, and no folder is exempt: an exception is one marked line. Error names the component. | Same as D1. |
| ✏️ **G1** | §04 gate 2; §05 T14 | in every Claude session, mine or anyone's. · in every Claude session in the repo. | in every Claude session started in that repo, mine or anyone's. A session started in a folder above the repo does not load it; the repo's CLAUDE.md, CI and branch protection cover that one. · in every Claude session started in the repo. | Added by UIG-3, 16 September (§0, its first finding): Claude Code reads a project's `.claude/settings.json` only from the folder a session starts in (code.claude.com/docs/en/settings). Katerina said yes to correcting it. |

### Facts checked and kept

| | the guide says | checked against |
|---|---|---|
| ✅ | `estiva-ui 0.12.3` | It was current until `v0.12.4` was tagged at 14:48 UTC on 12 September. |
| ✅ | Peek PR #192 replaced a working `ContainerHeader` with a hand-made row | PR #192's diff: `<ContainerHeader …/>` out, `flex items-center gap-2 px-3 py-2` in. |
| ✅ | 1,219 tests, two typechecks, two lints, 323 stories | PR #193's own record: "1219 of 1219 green", `tsc -b` and `tsc -p convex`, token lint and lint, "323, none throws". |
| ✅ | eight defects on Folders | PR #193: "found eight defects". |
| ✅ | `lint:tokens` a CI gate since D55 | DECISIONS.md D55. |
| ✅ | `PendingAttachmentChip` lives in Peek | `peek/src/components/ui/PendingAttachmentChip.tsx`. |
| ✅ | `shots-themed.mjs` and `diff.mjs` | `peek/.verify-shots/`. |
| ✅ | three Storybooks on three ports | 6006, 6007, 6008. |
| ✅ | sixteen of twenty-three tactics ship | counted in the table. |
| ❔ | 58 story files | Peek had 58 until 09:24 UTC on 12 September and 59 after. The time the guide was written is not recorded, so it stays. |
| ❔ | 115 components | The counting method is not recorded, and UIG-1 counted 113 exported components a different way. It stays. |
| ❔ | Gate 2 today: "colours & sizes only"; gate 3 today: "components, not pages" | Summaries, not counts. UIG-28 records the size hole; F2 records the page stories. They stay. |

### The design point Katerina ruled on

D1 and D2 in the table above. The guide allowed raw elements "outside a shim
folder". UIG-1 §6 showed a folder exemption hides real components, and UIG-3 was
already built on per-line escapes. Katerina ruled on 13 September: no folder is
exempt, and an exception is one marked line.

---

## §19 "Rules" is three words now

### The three words

| word | means | tickets |
|---|---|---|
| **lint rule** | A machine blocks bad code. "No raw `<button>`." | UIG-3 to UIG-9, UIG-22 to UIG-25, UIG-28 |
| **usage rule** | A written page per component: what it is for, when to use it, when not. | UIG-12 to UIG-19 |
| **instruction** | What we tell Claude, in `CLAUDE.md`, a skill or `AGENTS.md`. Claude Code calls path-scoped ones "rules"; we call them instructions. | UIG-20, UIG-21 |

Katerina chose "instructions" on 13 September. A check CI runs that is not a lint
rule, like the usage-page contract, is a **CI check**.

"Rule" is left alone where it is plain English — "a far easier rule to hold",
"people respect a rule that has an honest way out" — or already says which kind.

### In the guide: 43 uses, 25 changed, 18 left

| | where | the guide said | now says | meaning |
|---|---|---|---|---|
| ✏️ **W1** | §01 step 3 | The rules live in prose, in documents nobody opens mid-task. | The usage rules live in prose, in documents nobody opens mid-task. | usage rules |
| ✏️ **W2** | §03, 74% | or people will disable the rules. See §06. | or people will disable the lint rules. See §06. | lint rules |
| ✏️ **W3** | §03, 3 layers | `AGENTS.md` (always-on rules) | `AGENTS.md` (always-on instructions) | instructions |
| ✏️ **W4** | §03, skill vs MCP | the skill gives it *the rules*. | the skill gives it *the usage rules*. | usage rules |
| ✏️ **W5** | §04 gate 0 | Two rules make it honest. | Two CI checks make it honest. | CI checks, not rules |
| ✏️ **W6** | §04 gate 1 | plus *path-scoped rules* (`paths:` frontmatter) so page-specific rules only load | plus *path-scoped instructions* (`paths:` frontmatter; Claude Code calls them rules) so page-specific instructions only load | instructions |
| ✏️ **W7** | §04 gate 1, catches | - Rules being forgotten mid-task | - Usage rules being forgotten mid-task | usage rules |
| ✏️ **W8** | §04 gate 2 | runs the same rules on the content of an Edit or Write | runs the same lint rules on the content of an Edit or Write | lint rules |
| ✏️ **W9** | §04 gate 2 | give the new rules **their own config | give the new lint rules **their own config | lint rules |
| ✏️ **W10** | §04 gate 3 | *The backstop for everything a rule can't judge. | *The backstop for everything a lint rule can't judge. | lint rule |
| ✏️ **W11** | §05 T2 | Turns your docs template into a rule. | Turns your docs template into a CI check. | CI check, not a rule |
| ✏️ **W12** | §05 T6 | Procedures move out to skills; rules get `paths:` scoping | Procedures move out to skills; instructions get `paths:` scoping | instructions |
| ✏️ **W13** | §05 T22 | Without it, people switch the rules off. | Without it, people switch the lint rules off. | lint rules |
| ✏️ **W14** | §06 plan A | - The rules lint, its own config, green from day one | - The lint rules, their own config, green from day one | lint rules |
| ✏️ **W15** | §06 plan B | rules that enforce it | lint rules that enforce it | lint rules |
| ✏️ **W16** | §07 T23 | the rules lint and its config | the lint rules and their config | lint rules |
| ✏️ **W17** | §08 | So the rules should ship | So the lint rules should ship | lint rules |
| ✏️ **W18** | §08, careful | a rule with no exit gets forked or disabled | a lint rule with no exit gets forked or disabled | lint rule |
| ✏️ **W19** | §09 | turns one rule off for one line | turns one lint rule off for one line | lint rule |
| ✏️ **W20** | §09 | the first time a rule blocks something genuinely new | the first time a lint rule blocks something genuinely new | lint rule |
| ✏️ **W21** | §10 Q2 | Should I show you the rule list with counts | Should I show you the lint rule list with counts | lint rule |
| ✏️ **W22** | §10 Q2 | I can run every proposed rule over Peek and Ship | I can run every proposed lint rule over Peek and Ship | lint rule |
| ✏️ **W23** | §10 Q5 | Does Jan get a say in the rule list? | Does Jan get a say in the lint rule list? | lint rule |
| ✏️ **W24** | §10 Q5 | Worth him seeing the rules before they're a gate | Worth him seeing the lint rules before they're a gate | lint rules |

W6 held two uses. So 24 changes cover 25 uses.

**The 18 left as they were:**

| why | where |
|---|---|
| plain English | "What no rule can judge", "It follows every rule and still looks wrong", "Anything a rule can't describe", "a far easier rule to hold", "People respect a rule" |
| already says which kind | "Lints put rules in their face", "a rule in a document", "a rule in a lint", "ESLint rules", "fingerprint rules" in gate 2, "Fingerprint rules" in the T12 row and in plan B, "The lint rules published", "Publish the lint rules" |
| refers back to "a lint rule" in the same sentence | "someone deletes the rule" |
| a column name in Q2's table | "rule, how many places break it" |
| a command or a link | `lint:rules`, the Anthropic article's URL |

That is 18. Two uses were added: "Claude Code calls them rules" (W6) and "a lint
rule to find" (F8). The guide has 39 uses now.

### In Ship: 14 tickets

**The test for changing a ticket:** "rule" could be read as the other kind —
because the ticket is about both kinds, or because it is a title in the list,
where "Rule — …" sat beside "Usage rules — …". A ticket about lint rules only
keeps the word.

| ticket | what changed |
|---|---|
| UIG-1 | title: "candidate rule" → "candidate lint rule" |
| UIG-7 | title: "Rule —" → "Lint rule —" |
| UIG-8 | title: "Rule —" → "Lint rule —" |
| UIG-9 | title: "Rule —" → "Lint rule —"; its Blocked-by line names UIG-1's new title |
| UIG-29 | title: "every rule" → "every lint rule" |
| UIG-12 | Blocked-by line names UIG-8's new title |
| UIG-15 | "broke a rule, because no rule existed" → usage rule |
| UIG-17 | "a written rule anywhere" → usage rule |
| UIG-20 | "The rules refuse the wrong thing" → lint rules |
| UIG-21 | every "rule" that means a `CLAUDE.md` instruction → instruction; its line counts measured (§22) |
| UIG-26 | "every rule written since", "the rules ship inside the package" → lint rule |
| UIG-27 | "two phase-1 rules", "a rule it could not write" → lint rule; the Blocked-by lines name UIG-7's and UIG-8's new titles |
| UIG-10, UIG-11 | "same row set" → "same gate checks" (§15); UIG-11 "every rule" → lint rule |

**UIG-3's title was left as it is:** "Tracer bullet — one rule, end to end,
blocking in Peek". Eleven other tickets name it in their Blocked-by lines, and
"blocking" already marks it as a lint rule. Renaming it would mean eleven more
rewrites for no gain in meaning.

Tickets that talk only about lint rules — UIG-3 to UIG-6, UIG-22 to UIG-25,
UIG-28 — keep "rule" in their bodies.

### ✅ The Ship project description — applied, 13 September

Katerina asked for these nine changes to be applied rather than pasted. They are
in the description now, and both of her screenshots are still in it.

**How, so nobody breaks it again.** The description is not text. It is a block
document, stored as JSON, with a `content-format` tag (`estiva-blocks-1`) on the
change that saves it. Ship draws it as rich text only when that tag is there.

| | step |
|---|---|
| 1 | Read the stored JSON. Change only the words of the text pieces, found by their own words; each must occur once. |
| 2 | Walk the old and new documents together: every node identical except those pieces' text. The screenshots deep-equal. (186 nodes, 10 pieces, 2 screenshots.) |
| 3 | Publish with the agent's `Store.setField` **and `contentFormat: 'estiva-blocks-1'`** — never the `edit-project` command or `ship_edit_project`, which send no tag. |
| 4 | Read it back: stored value equal byte for byte, `descriptionFormat` "blocks". |

Step 3 was first done with `edit-project`, and Ship drew raw JSON until the
republish three minutes later. §0 and §22.

The changes, as they look on screen:

| | find | replace with |
|---|---|---|
| 1 | each with a written rule for when to use it and when not | each with a written usage rule: when to use it and when not |
| 2 | These 26 tickets deliver gates 0, 1 and 2 | These 29 tickets deliver gates 0, 1 and 2 |
| 3 | its rules point inward at the package itself | its lint rules point inward at the package itself |
| 4 | their rules point at their callers | their lint rules point at their callers |
| 5 | because the rules ship inside the package | because the lint rules ship inside the package |
| 6 | UIG-1 is the first ticket and UIG-26 is the last. The reference number is the order. | There are 29 tickets, and the reference number is not the order. UIG-27, UIG-28 and UIG-29 were added after UIG-1. The running order is in estiva-ui docs/GATES.md §0. |
| 7 | the catalogue, and a written rule for using every component | the catalogue, and a written usage rule for every component |
| 8 | No rule is absolute. | No lint rule is absolute. |
| 9 | All 26 tickets closed | All 29 tickets closed |

Change 6 leaves the order table below it as it is; its groups are still right,
and §0 adds UIG-27, UIG-28 and UIG-29 to them.

---

## §20 Decisions, 13 September

§14 holds Katerina's rulings on the lint rules. These are the ones UIG-2 took.

| | decision | who |
|---|---|---|
| 1 | Fix every wrong fact about our code in the guide, not only the three the ticket named. The reasoning and the plans stay word for word. | Katerina |
| 2 | The guide says no folder is exempt from the raw-element lint rule; an exception is one marked line. | Katerina |
| 3 | The third word is **instructions**. | Katerina |
| 4 | Each repo's `CLAUDE.md` gets two lines pointing here, so a session of Jan's can find the project. | Katerina |
| 5 | Every ticket has one owner repo, and parts where its files live. UIG-10, UIG-11 and UIG-26 say "gate checks", not "row set". | UIG-2, from its own text |
| 6 | The owner is the repo that holds the ticket's main work; lint rule tickets across all repos belong to estiva-ui. | UIG-2 |
| 7 | Branch protection is read from GitHub with `gh`, because it is a setting, not a file. Without `gh` it is ❔. | UIG-2 |
| 8 | One status engine, the same file in every repo; one checks file per repo; estiva-ui warns when the engines differ. **Superseded 17 September (§23):** the engine and the checks every app runs ship in the package; the copies go with UIG-32. | UIG-2 |
| 9 | A check that expects nothing must first prove something is being checked. | UIG-2, after four false passes (§17) |
| 10 | UIG-3's title stays; UIG-1, UIG-7, UIG-8, UIG-9 and UIG-29 were renamed. | UIG-2 (§19) |
| 11 | The Ship project description was to be written out for Katerina to paste. She then asked for it to be applied; it was, with the method in §19. The standing rule is now: never through `edit-project` or `ship_edit_project`, only with the content-format tag and a byte-for-byte check. | Katerina |

---

## §21 The debt lists

A debt list is a file that cannot pass a gate yet, with a reason and a date.
Each repo keeps its own, at `docs/GATES-DEBT.md`.

| repo | debt list | created by |
|---|---|---|
| ship | `docs/GATES-DEBT.md`, 16 September, 0 entries (17 September, UIG-9: still 0; its 2 escapes are counted, not owed) | UIG-4 (ship PR #154) |
| peek | not yet | **no ticket names it** — see §22 |
| estiva-ui | `docs/GATES-DEBT.md`, 16 September, 0 entries (17 September, UIG-9: still 0; its 6 escapes are counted, not owed) | UIG-5, closing §22's open row |
| leaf | not yet | UIG-10's starter generates an empty one |

On 13 September there are **0** debt lists and **0** entries. On 16 September, after UIG-4 and UIG-5: **2** debt lists, Ship's and the package's, with **0** entries between them. Peek still has none, and no ticket names it (§22).

---

## §22 What UIG-2 found in other tickets

Reading every ticket turned up these. The ones marked ✅ are corrected in Ship.

| | ticket | what was wrong | now |
|---|---|---|---|
| ✅ | UIG-8 | Its acceptance said the lint rule must report the Folders scroll bug. Its own trap said a class rule could never find it. Peek commit `3dc663b` settles it: the column had no scroll container. | The acceptance asks `GATES.md` to show there was no overflow class, and hands the case to the route probe. The example line that repeated the claim is corrected too. |
| ✅ | UIG-10 | "the registry generator, once UIG-11 exists". UIG-11 is Leaf. | UIG-12. |
| ✅ | UIG-10 | "Ship was retrofitted over four pull requests. Peek … over 29 commits and a month". The same wrong facts as the guide's F9 and F10. | Eight pull requests; PR #193's 29 commits. |
| ✅ | UIG-10, UIG-11, UIG-26 | "the same row set as Peek's and Ship's" | "the same gate checks" (§15). |
| ✅ | UIG-26 | "all 25 rows", "All 25 preceding tickets", "UIG-1 to UIG-25" — written before UIG-27 to UIG-29 existed. | The 28 other tickets. |
| ✅ | UIG-21 | "All of ours have passed [200 lines]". `CLAUDE.md` alone: estiva-ui 189, Peek 136, Ship 168 — none has. Counted with the files each imports with `@`: Peek **273**, Ship **298**, estiva-ui **192**. | The measured numbers, a trap about imports, and "under 200 lines, counted with every file it imports". |
| ✅ | UIG-15 | "no page in Peek has a story or a test". Three pages have had a story since 13 July; `FoldersPage.test.tsx` arrived on 12 September. | The Folders page had no story and no test when its defects passed. |
| ⬜ | UIG-3, UIG-29 | Their traps quote Peek's lint as `eslint src` 79, `eslint .` 94. On 13 September, at `00bf06b`: **84** and **99**. | Not changed. Both tickets tell the session to quote the scope it ran; it must re-measure. |
| ⬜ | UIG-17 | "58 story files" — Peek has had 59 since 09:24 UTC on 12 September. | Not changed. The ticket counts before and after. |
| ⬜ | UIG-3, UIG-5 | The roadmap puts a `docs/GATES-DEBT.md` in every repo, and UIG-20 reads "all repos' `GATES-DEBT.md`". Only UIG-4 creates one. | **Open.** UIG-3 and UIG-5 should each create theirs, or UIG-20 reads less than it thinks. Worth a line in each when they start. |
| ⬜ | GATES.md §9.2 and §13 | §9.2 says the guide named the wrong Base UI package; it did not (§18). §13's last lines say three things wait on Katerina; §14 answered them. | Left as UIG-1 wrote them. This row and §0 are the correction. |
| ⚠️ | estiva-agent | `edit-project` and `edit-issue --description`, and the `ship_edit_project` / `ship_edit_issue` tools built on them, send a description with **no `content-format` tag**. A rich description edited that way is drawn as raw JSON. The vendored `Store.setField` already accepts `contentFormat`; the commands never pass it. It broke the UI Guardrails description for three minutes on 13 September. | **Open.** A fix belongs in estiva-agent — Jan's call. Until then, never edit a rich description with those commands. Plain-text ticket descriptions, like every UIG ticket's, are unaffected. |
| ⚠️ | peek | `src/components/CommandLauncher.live.test.tsx`, "the created object leaves a trace in the thread (PEE-2)": clicking the Project Select's option fails with "pointer-events: none" on a `div`. Failed on #204's first run and on `main` after #204 merged; passed on re-run and locally 10 of 10. Every failure is after PR #201 moved Peek to `@estiva-app/ui` `0.12.8`, whose Select changed (estiva-ui PR #23). **Corrected 14 September: not `0.12.8`.** It failed on `0.12.3` too; the cause was a Base UI timing race in the tests (§0). | ✅ **Fixed** in peek PR #205, no ticket (Katerina). |

---

*UIG-1, 13 September 2026. Measured at estiva-ui `93048cd` (0.12.6), peek
`d094006`, ship `e85de7f`. All three on main, all three clean.*

*UIG-2, 13 September 2026. Built on estiva-ui `214702c` (0.12.8), peek
`00bf06b`, ship `e85de7f`. The guide copied from its artifact, version
`1789170129-badc`.*

---

## §23 One copy, in the package — Katerina's ruling, 17 September

Planning UIG-10 found a mistake that ran through phase 1. This section records it, so no ticket repeats it.

### What she asked, and what was true

**"If a person outside of our team wants to create new repo using this command, they should not necessarily read ship and peek, right?"** Right. UIG-10 and seam S5 said the starter is "assembled from the live repos". Peek and Ship are private repositories; `@estiva-app/ui` is public on npm. A command that reads Peek and Ship works for nobody outside the team, and it carries each app's history into every new app: of the 65 different checks Peek and Ship run for finished tickets, 14 read code only one of them has, and 21 are the same check written two ways.

**"Our package doesn't cover all the checks? … What have we been doing all this time then exactly?"** The rules were always package code: `no-raw-element`, `no-rebuilt-behaviour`, `no-restyled-part`, the escape marker and the count all live in `@estiva-app/ui/eslint`, and no app defines a rule of its own (searched, 17 September). What was **copied into each repo** is everything that switches those rules on:

| piece | Peek | Ship | estiva-ui |
|---|---|---|---|
| the editor hook (`.claude/hooks/gates.mjs`) | 70 lines | 79 (its app is in `web/`) | — |
| the count writer (`gates-count.mjs`) | 48 | 48, only the name differs | 50 |
| the status engine (`gates-status.mjs`) | 392 | 392 | 392 — identical, copied by hand (§20, decision 8) |
| the check list (`gates-checks.mjs`) | 176 | 167 | 250 |
| which folders the rules check (`eslint.gates.js`, `eslint.gates.config.js`) | 76 | 77 | its own |
| the token lint settings (UIG-28) | the same block as Ship, byte for byte | the same block as Peek, byte for byte | the same patterns, seven messages worded for the package, and `d` for `[0-9]` twice |

Each copy was a reasonable step on its own day (UIG-3 proved the chain in one app; UIG-2 chose one engine file per repo; UIG-28 pasted the package's block). Nobody consolidated them while there were two apps. A third app turns them into a copying problem.

### The ruling

| | ruling |
|---|---|
| R1 | **Every piece an app needs to run a gate ships in `@estiva-app/ui`**: the rules, their settings, the hook, the count, the status engine, the shared check list, the "which folders" config. An app keeps only a thin file that imports it and names what is the app's own. **The same gate text pasted into more than one repo is a defect.** |
| R2 | **The starter reads only the package.** It never reads Peek or Ship. They are only the yardstick in a comparison test that proves a made app has the same gate checks. |
| R3 | A new app uses the **sidebar frame** (`AppShell` solid + `Sidebar` + `NavItem`), not the rail. |
| R4 | A new app has **one theme**, chosen from the package's themes when it is made, set on `<html>`, with no switcher. |
| R5 | UIG-10 moves the pieces into the package. **UIG-32** (new) moves Peek and Ship onto them. ✅ Both done, 17 September: 0.21.0 and 0.21.1, peek PR #245 and ship PR #161. |

### What changes for every later ticket

- A ticket that adds a gate adds it **to the package**, and the apps import it. "In all three repos" means "in the package, imported by all three".
- A check that every app runs (a probe of a rule) goes in the package's shared check list; only a check about an app's own code stays in that app's list.
- Say "the rules" for what stops code, and "the switch-on files" or "the status checks" for what proves a rule is on. One word for both is how this was missed in a message on 17 September.

### What was corrected on 17 September

Found by reading every UIG ticket in full, the project description, and every doc in estiva-ui, for text that contradicts the ruling or would lead a session to repeat the mistake.

| where | what changed |
|---|---|
| this file | §0 (this ruling, the table, and the "Next" line: UIG-25 reads the merged registry, so it waits for UIG-13 and **cannot be taken early**); "What is ready for the next tickets"; §15 (phase 2, UIG-10, UIG-26's close, UIG-32, the arithmetic, where checks go); §16 (S1 widened, S3, S5 rewritten); §17 (the copied engine marked a defect); §20 decision 8 superseded; the UIG-4 record marked a copy |
| `docs/GATES-GUIDE.md` | the skill and the hook ship in the package; T15's config ships in the package; T23's starter reads only the package, with the sidebar and one theme. Each change is marked, and the reasoning is untouched (§20, decision 1) |
| `README.md` | the count writer is still copied, and moves with UIG-10; it also said there are two lint rules — there are three |
| `scripts/gates-checks.mjs` | lists UIG-32, with a first-guess check |
| Ship, rewritten | **UIG-10**: package first, the pieces move into the package, the sidebar frame, one theme, proved with no Peek or Ship checkout present |
| Ship, created | **UIG-32**: Peek and Ship take their gate pieces from the package |
| Ship, corrected with a ruling note | UIG-11 (a gate fix goes into the package; sign-in on the real Estiva ID needs Leaf registered by Jan), UIG-13 (the registry generator ships in the package), UIG-19 (the contract check ships in the package), UIG-20 (the skill's text ships once), UIG-25 (the rule is registered once, in the package's configs), UIG-26 (a fresh app from the package; no gate text may leak) |
| Ship, done, marked superseded in part | UIG-2, UIG-3, UIG-4, UIG-5, UIG-28 — each ticket's file list is not to be copied into a new repo |
| the Ship project description | "the starter is generated, not copied" now reads "the starter reads only the package, never Peek or Ship"; a new app gets the whole set from the package; each repo reports its status with the package's tools. Applied with §19's method: 444 nodes, 5 text pieces changed, stored value read back identical, still blocks |
| the roadmap artifact | a correction note at P4b, S5 and the starter ticket |

Every ticket edit was made from the ticket's own stored text by exact replacement, each required to match once, and read back byte for byte.

**Still copied, for UIG-21:** each repo's `CLAUDE.md` carries its own version of the same gate paragraph. UIG-32 left it there on purpose — it is a paragraph a person reads, not a file a gate runs — and only corrected the line in each that named a hook file which no longer exists. Everything else this table lists is one copy now, in the package.

**Corrected the same evening, by measuring the whole block:** this section first said the token lint settings were "the same block, byte for byte, in all three repos". They are byte for byte the same in Peek and Ship; estiva-ui's has the same patterns with seven messages worded for the package (the first check compared only up to the first closing brace). The Ship tickets, the memory and the plan page were corrected with it. **For Plan C:** when the ratchet, visual regression and the route probe are built, their shared code follows R1 too.
