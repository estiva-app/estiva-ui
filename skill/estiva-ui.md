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
5. **An exception** carries `// @estiva-escape: <reason>` on the line above
   it. Never `eslint-disable`.

## Gotchas

<!-- GOTCHAS -->
