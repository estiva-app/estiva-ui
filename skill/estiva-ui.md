# Search before you build

Every screen here is built from parts: the package `@estiva-app/ui`, and each
app's own. Every reusable part has a Storybook page that says when to use it
and when not to. Most of what gets asked for already exists somewhere.

## When this applies

- Building or changing a screen, panel, list, row, header, dialog or menu.
- Adding a component, or a new file that draws one.
- Changing how something looks: its size, spacing, colour or type.

## Steps, in order

1. **Search before creating anything.** Run
   `npm run ui:find <what it does, in plain words>` in the repository you are
   in. Do it yourself; never ask the person to. With nothing else typed it
   searches the package and every app beside it, and prints a Storybook link
   for each match. Show the person what it found, with the links.
   - From a folder that holds several repositories, run it inside any one of
     them (`npm --prefix <repo> run ui:find <words>`): each searches them all.
   - Search again in other words before deciding nothing fits: "list column",
     then "scrolling list"; "panel header", then "title row".
2. **If something fits, read its page before using it:** the link, or the
   `.mdx` beside its file. Read its opening line, **When** and **When not**.
   *When not* names the part to use instead.
3. **If nothing fits, say so and ask.** Do not invent a component. Do not copy
   one from another app either: say which app has it, and ask whether it
   should move into the package.
4. **Never hand-roll what the package owns.** Its parts own their behaviour:
   keys, focus, floating, closing, scrolling, truncation. The editor gate
   refuses a raw element, a rebuilt behaviour or a restyled part, and its error
   names the part to use.
5. **An exception** carries its reason on the line above it. For the gate:
   `// @estiva-escape: <reason>`, never `eslint-disable`. For the token lint:
   `// eslint-disable-next-line <rule> -- @estiva-escape: <reason>`.

## Gotchas

The mistakes made here more than once, from the record (UIG-20 counted 542
recorded defects; these 24 cover the 111 that are screen work). Each says what
to do instead. Apps differ in frame and theme: never carry one app's layout,
sizes or colours into another; take them from tokens.

**Layout**

1. **A header row drawn by hand** at the top of a column → `ContainerHeader`.
   Its actions are `IconButton`s with tooltips. A whole list column is
   `ListColumn`, which draws the bar; a field that adds to the list goes in its
   `above`.
2. **A list with no scroll container**, cut off at the fold (no lint sees a box
   that was never built) → a list column is `ListColumn`, which scrolls its
   rows; anything else that grows goes in a `ScrollArea`. Check with more rows
   than fit.
3. **`EmptyState` at the wrong level** → `scope="page"` only when the whole
   page is empty, `scope="section"` for one part of it, placed inside the box
   its rows live in. Never wrap it in a box of your own that places it.
4. **`EditableText` rendering too large**: it has no size of its own and takes
   the size around it → put the text size on your own element around it. The
   same holds for `Person`, `Link`, `Card` and `SectionLabel`.
5. **Flex rows that move things**: loose children of an `items-start` row float
   at different heights; a scrolling flex column squashes rows → group them in
   one `items-center` row; give your own rows in a scrolling column `shrink-0`.
6. **A group heading drawn by hand** (a row holding a `SectionLabel`) →
   `SectionHeader` (`hover="none"` when nothing acts on it); a group that folds
   is `CollapsibleSection`.
7. **A line drawn by hand** (`border-t`, `<hr>`, a gap) → `Divider`; between a
   menu's groups, `MenuSeparator`, which brings its own room.

**Parts and props**

8. **The browser's tooltip** (`title=`), or an icon button with none →
   `WithTooltip` (`inline` inside text) or `IconButton`'s `tooltip`.
9. **A row of icon buttons laid out by hand** → `Toolbar` with `ToolbarButton`
   and `ToolbarLink` (they throw outside one). A row inside a `Popover` is a
   `Toolbar` with `surface={false}`.
10. **Fields sent by a hand-written Enter handler**, with no form → `Form`,
    which owns the keys, `busy` and focus. Clear a field's `error` when it
    changes, or the form will not send.
11. **A link to an in-app page as a bare `href`**: every click reloads the app
    → go through the app's router, as `NavItem` does.
12. **Wrong loading and failure states**: an `EmptyState` while data is still
    coming, a hand-made pulsing box → a skeleton shaped like what is coming
    (`SkeletonList`, `SkeletonRow`, `SkeletonBar`). Say a failure in
    words, never as "empty" and never in red; a failure toast or banner has
    the `error` tone.
13. **A floating panel mounted only while open** (`{open && <Popover…>}`), or
    capped with a class → keep it mounted and drive `open`; cap a long list with
    `Popover`'s `maxHeight`; never open a panel around an empty list.
14. **Deleting a part without checking what else it carried** → read everything
    the container holds first, and remove its imports, escapes and stories with it.

**Stories and usage pages**

15. **A story that shows one branch**: something drawn behind `{prop && …}` that
    no story passes, or data with no fixture → a story for every branch; one
    fixture holding what the backend really sends. `estiva-ui check` refuses
    the first.
16. **A screen with no story** is where mistakes hide: every gate was green on
    a page with eight → look at the running screen, or give it a story with
    more rows than fit, an empty state and a loading state.
17. **A story under a new heading, or named after its file** → use a heading
    the Storybook already has, name the entry after its part, give each meta its
    `component` (or the part's page a **Seen in** line).
18. **`{…}` in a usage page's prose** (MDX reads it as code and the page will
    not compile), or a description over two lines → backticks around braces; a
    part's description is one line.

**Working in these repositories**

19. **An escape with a false reason** ("no part does this" has been wrong
    twice) → search for the thing first. Write the escape on the line above
    the statement: a gate escape never inside `eslint-disable`, a token-lint
    one inside `eslint-disable-next-line <rule> --`.
20. **Classes the lint cannot see**: in a const not named `…_CLASSES` or
    `…Styles`, or in an array that is `.join()`ed → keep classes in
    `className` or `cn()`, or in a map with one of those names.
21. **The editor gate and this skill need a session started at the repository's
    top folder.** Started elsewhere, run the repository's `lint:rules` yourself
    before committing.
22. **`npm install` on Windows prunes Linux-only entries from the lockfile**, and
    CI dies at `npm ci` → never commit a lockfile Windows rewrote; restore it and
    bump only the package's own entry. Stop every dev server before `npm ci`.
23. **Storybook shows old code after a package bump** → delete
    `node_modules/.cache/storybook` and restart.
24. **A local checkout lags `origin/main`, and a conflicting PR shows no CI** →
    `git fetch` and read `origin/main`; when checks are missing, look for a
    conflict first.
