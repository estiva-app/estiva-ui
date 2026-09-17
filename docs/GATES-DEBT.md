# GATES-DEBT.md — what cannot pass a gate yet

The package's debt list for the UI Guardrails (`docs/GATES.md` §21).

A file that cannot pass a gate yet is written here, with the gate, the reason
and the date it was written. A debt list is a promise; a file a gate skips
without a line here is a silent ignore, and that is a lie.

| file | gate | reason | since |
|---|---|---|---|

**Nothing is owed.** 17 September 2026, UIG-9: the rule the apps get,
`estiva/no-restyled-part`, runs inward too (Katerina, 17 September). It found
34 looks passed from one part of the package into another, 14 of them in
stories: 23 fixed with nothing to see, 5 through the props this release adds,
and 6 escaped with their reason — `Card` with `href` drawn on `Link`, and
`AttachmentCard`'s own states (a failed file's strong hairline, the loading
pulse, faded twice, Download shown on the card's hover).

Earlier, 16 September 2026, UIG-5: the inward gate
(`npm run lint:rules`) finds 0 of each of its four rules in `src`, stories
included, tests out, with no escapes.
