/**
 * What gates:status checks in estiva-ui, and the list of every ticket.
 *
 * `all` is every ticket, its title (copied from Ship, which stays the source
 * for titles), the one repo that owns it, and which other repos hold a part of
 * it. `tickets` is what this repo checks in its own files.
 *
 * A check for a ticket that is not built yet is a first guess at the evidence,
 * taken from the ticket's own text. The ticket that builds it confirms or
 * changes its checks, here and in GATES.md §15, in the same session.
 */
const PEEK_SHIP = ["peek", "ship"];

const all = [
  { ref: "UIG-1", owner: "estiva-ui", title: "Count every candidate lint rule across all three repos" },
  { ref: "UIG-2", owner: "estiva-ui", parts: PEEK_SHIP, title: "The tracking rails — GATES.md, the status script, the guide committed" },
  { ref: "UIG-3", owner: "peek", parts: ["estiva-ui"], title: "Tracer bullet — one rule, end to end, blocking in Peek" },
  { ref: "UIG-4", owner: "ship", title: "The same chain, blocking in Ship" },
  { ref: "UIG-5", owner: "estiva-ui", title: "The same chain inside estiva-ui, pointed inward" },
  { ref: "UIG-6", owner: "estiva-ui", parts: PEEK_SHIP, title: "Branch protection — the backstop, all three repos" },
  { ref: "UIG-7", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lint rule — every remaining raw element" },
  { ref: "UIG-8", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lint rule — forbid the reach" },
  { ref: "UIG-9", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lint rule — the className allow-list" },
  { ref: "UIG-10", owner: "estiva-ui", title: "create-app — a command that makes a new Estiva app that runs" },
  { ref: "UIG-11", owner: "estiva-ui", title: "Create the Leaf repo from it" },
  { ref: "UIG-12", owner: "estiva-ui", title: "The registry, thin and proved — estiva-ui first" },
  { ref: "UIG-13", owner: "estiva-ui", parts: PEEK_SHIP, title: "The registry widens to Peek's 115 and Ship's 74, with classification" },
  { ref: "UIG-14", owner: "estiva-ui", title: "Usage rules — estiva-ui's components that own a behaviour" },
  { ref: "UIG-15", owner: "estiva-ui", title: "Usage rules — estiva-ui's frame and layout components" },
  { ref: "UIG-16", owner: "estiva-ui", title: "Usage rules — the rest of estiva-ui, and close the 44" },
  { ref: "UIG-17", owner: "peek", title: "Usage rules — Peek's own components" },
  { ref: "UIG-18", owner: "ship", title: "Usage rules — Ship's own components" },
  { ref: "UIG-19", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lock the contract in CI, and make the three Storybooks one search" },
  { ref: "UIG-20", owner: "estiva-ui", parts: PEEK_SHIP, title: "The Claude skill, reading the registry" },
  { ref: "UIG-21", owner: "estiva-ui", parts: PEEK_SHIP, title: "CLAUDE.md becomes an index, not a lecture" },
  { ref: "UIG-22", owner: "estiva-ui", parts: PEEK_SHIP, title: "Fingerprint — a hand-made header row" },
  { ref: "UIG-23", owner: "estiva-ui", parts: PEEK_SHIP, title: "Fingerprint — a hand-made empty state" },
  { ref: "UIG-24", owner: "estiva-ui", parts: PEEK_SHIP, title: "Fingerprint — a browser tooltip where ours belongs" },
  { ref: "UIG-25", owner: "estiva-ui", parts: PEEK_SHIP, title: "Fingerprint — a component copied out by hand" },
  { ref: "UIG-26", owner: "estiva-ui", aggregate: true, title: "Re-run the starter, and close the loop" },
  { ref: "UIG-27", owner: "estiva-ui", parts: PEEK_SHIP, title: "The components the apps had to build themselves — Link, ProgressBar, EmptyState padding" },
  { ref: "UIG-28", owner: "estiva-ui", parts: PEEK_SHIP, title: "Close the two holes in the token contract — arbitrary values, and inline style" },
  { ref: "UIG-29", owner: "peek", title: "CommandLauncher — 1,655 lines that will fail almost every lint rule" },
  { ref: "UIG-30", owner: "estiva-ui", parts: PEEK_SHIP, title: "RichText — one component that draws a message's text, for both apps" },
  { ref: "UIG-31", owner: "estiva-ui", parts: ["peek"], title: "Editor menus — one shared part for the / @ [ menus" },
  { ref: "UIG-32", owner: "estiva-ui", parts: PEEK_SHIP, title: "Peek and Ship take their gate pieces from the package" },
];

// `app` is the folder a repo's app sits in, where its install and its checks file are (UIG-32).
const siblings = [
  { name: "peek", path: "../peek", env: "GATES_PEEK" },
  { name: "ship", path: "../ship", env: "GATES_SHIP", app: "web" },
  { name: "leaf", path: "../leaf", env: "GATES_LEAF" },
];

export default function define(h) {
  // A probe is linted as text at a path; nothing is written. That path is a real
  // component with a page and a story beside it, so UIG-5's component-has-a-page
  // and component-has-a-story do not report on every probe and turn a "this must
  // not be an error" check into a false failure. ORPHAN is the opposite — a path
  // with neither — which is how those two rules are proved.
  const PROBE = "src/Button.tsx";
  const ORPHAN = "src/__gates_probe__.tsx";
  const componentFiles = () => h.listFiles("src", (n) => /\.tsx$/.test(n) && !/\.(stories|test)\.tsx$/.test(n)).filter((f) => !f.includes("/", 4));
  const pages = () => h.listFiles("src", (n) => n.endsWith(".mdx")).filter((f) => !f.includes("/", 4));
  const gate = (code, expect, mentions) => () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code, expect, mentions });
  const fiveSections = (mdx) => ["What it is", "When", "When not", "How", "What it owns"].every((s) => new RegExp(`^#+\\s*${s}\\s*$`, "m").test(h.read(mdx)));

  // The chain every repo carries once its lint rules are live (UIG-3, UIG-4, UIG-5).
  const chain = () => [
    { what: "the gate lint config loads", run: () => h.loads("eslint.gates.config.js") },
    { what: "package.json has lint:rules", run: () => h.script("package.json", "lint:rules") },
    { what: "CI runs lint:rules", run: () => h.ci("lint:rules") },
    { what: "the committed hook runs the gate lint", run: () => h.hook(".claude/settings.json", "gates") },
    { what: ".gates-count.json is committed and parses", run: () => h.json(".gates-count.json") },
  ];

  const tickets = [
    { ref: "UIG-1", owner: true, checks: [
      { what: "GATES.md holds the count of every candidate lint rule", run: () => h.contains("docs/GATES.md", "## §3 The rule table", "GATES.md §3 is the rule table") },
      { what: "GATES.md holds Katerina's verdict on each one", run: () => h.contains("docs/GATES.md", "## §14 Katerina's rulings", "GATES.md §14 holds her rulings") },
    ] },
    { ref: "UIG-2", owner: true, checks: [
      { what: "the guide is committed", run: () => h.committed("docs/GATES-GUIDE.md") },
      { what: "the guide has no wrong Base UI name", run: () => h.lacks("docs/GATES-GUIDE.md", "@base-ui-components", "docs/GATES-GUIDE.md has no @base-ui-components") },
      { what: "GATES.md holds the route", run: () => h.contains("docs/GATES.md", "## §15 The route", "GATES.md §15 is the route") },
      { what: "npm run gates:status is wired", run: () => h.script("package.json", "gates:status") },
    ] },
    { ref: "UIG-3", owner: false, checks: [
      { what: "the lint plugin lives in src/eslint", run: () => h.listFiles("src/eslint", (n) => /^index\.(m?[jt]s)$/.test(n)).length ? h.PASS("src/eslint has an index") : h.FAIL("src/eslint has no index file") },
      { what: "package.json exports ./eslint", run: () => h.contains("package.json", '"./eslint"', "package.json exports ./eslint") },
      // UIG-3's rule was no-raw-button; UIG-7 made it no-raw-element, which still refuses a raw <button> naming Button.
      { what: "the plugin refuses a raw <button>, naming Button", run: () => h.contains("src/eslint/no-raw-element.ts", "button: { use: 'Button' }", "src/eslint/no-raw-element.ts maps <button> to Button") },
    ] },
    { ref: "UIG-5", owner: true, checks: [
      ...chain(),
      { what: "a raw element nested in a component is an error", run: gate("export function Probe() {\n  return <div><button type=\"button\">x</button></div>\n}\n", "error", "raw") },
      { what: "a component's own outermost element is not, while a nested one is", run: async () => {
        const nested = await gate("export function Probe() {\n  return <div><a href=\"/x\">x</a></div>\n}\n", "error", "raw")();
        if (nested.result !== "pass") return h.FAIL(`a nested element is not caught yet, so this proves nothing: ${nested.detail}`);
        return gate("export function Probe() {\n  return <a href=\"/x\">x</a>\n}\n", "none")();
      } },
      { what: "one handed to a Base UI render prop is not", run: gate("export function Probe() {\n  return <BaseMenu.Item render={<button type=\"button\" />} />\n}\n", "none") },
      { what: "behaviour Base UI owns, written by hand, is an error", run: gate("export function Probe() {\n  window.addEventListener('scroll', () => {})\n  return null\n}\n", "error", "Positioner") },
      { what: "a component with no page is an error naming it", run: () => h.lint({ config: "eslint.gates.config.js", file: ORPHAN, code: "export function Probe() {\n  return null\n}\n", expect: "error", mentions: "__gates_probe__.mdx" }) },
      { what: "a component with no story is an error naming it", run: () => h.lint({ config: "eslint.gates.config.js", file: ORPHAN, code: "export function Probe() {\n  return null\n}\n", expect: "error", mentions: "__gates_probe__.stories.tsx" }) },
      { what: "a page and a story with no component of their own are not orphans", run: () => {
        const both = ["FieldLine", "MenuItem"].filter((n) => h.exists(`src/${n}.mdx`) && h.exists(`src/${n}.stories.tsx`) && !h.exists(`src/${n}.tsx`));
        return both.length === 2
          ? h.PASS("FieldLine and MenuItem have a page and a story and no .tsx; both rules read the component file, never the page")
          : h.FAIL(`expected FieldLine and MenuItem to have a page and a story with no .tsx; found ${both.join(", ") || "neither"}`);
      } },
    ] },
    { ref: "UIG-6", owner: true, checks: [
      { what: "GitHub requires the check gate to merge into main", run: () => h.protectedBranch(/^gate$/) },
      { what: "CI's job gate runs lint:rules", run: () => h.ciJob("gate", "lint:rules") },
    ] },
    { ref: "UIG-7", owner: true, checks: [
      // UIG-8 added a second app rule after it; this ticket's evidence is that no-raw-element is the apps'.
      { what: "the apps get no-raw-element", run: () => h.contains("src/eslint/index.ts", /const appRules = \{\s*'no-raw-element': noRawElement,/, "src/eslint/index.ts gives the apps no-raw-element") },
      { what: "every part the mapping names is exported", run: () => {
        // A map's `use`, and the parts its messages name after it (`InlineChip`, `ConfirmDialog`…).
        const map = h.read("src/eslint/no-raw-element.ts");
        const named = [...new Set([...map.matchAll(/use: '(\w+)'|`([A-Z]\w+)`/g)].map((m) => m[1] ?? m[2]))];
        const exported = new Set([...h.read("src/index.ts").matchAll(/export \{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())));
        const missing = named.filter((n) => !exported.has(n));
        if (named.length === 0) return h.FAIL("the mapping names no part");
        return missing.length === 0 ? h.PASS(`${named.length} parts named, all exported: ${named.join(", ")}`) : h.FAIL(`named but not exported: ${missing.join(", ")}`);
      } },
      { what: "the command palette's form is the package Form, sending only on Ctrl+Enter", run: () => h.contains("src/CommandPalette.tsx", /<Form\b[^>]*\benterSends=\{false\}/, "CommandPaletteForm renders <Form enterSends={false}>") },
      { what: "Form, FilePicker and Checkbox's label exist for the apps' forms, file pickers and tick-box words", run: () => {
        const exported = new Set([...h.read("src/index.ts").matchAll(/export \{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())));
        const missing = ["Form", "FilePicker"].filter((n) => !exported.has(n));
        if (!/\blabel\?: string/.test(h.read("src/Checkbox.tsx"))) missing.push("Checkbox's label");
        return missing.length === 0 ? h.PASS("Form and FilePicker exported; Checkbox takes label") : h.FAIL(`missing: ${missing.join(", ")}`);
      } },
    ] },
    { ref: "UIG-8", owner: true, checks: [
      // UIG-9 added a third app rule after it; this ticket's evidence is that the apps get these two.
      { what: "the apps get no-raw-element and no-rebuilt-behaviour", run: () => h.contains("src/eslint/index.ts", /const appRules = \{\s*'no-raw-element': noRawElement,\s*'no-rebuilt-behaviour': noRebuiltBehaviour,/, "src/eslint/index.ts gives the apps no-raw-element and no-rebuilt-behaviour") },
      { what: "every part the rule names is exported", run: () => {
        const rule = h.read("src/eslint/no-rebuilt-behaviour.ts");
        // A component's name, PascalCase: not OWNED_BEHAVIOURS, which the rule's comments name too.
        const named = [...new Set([...rule.matchAll(/use: '(\w+)'|`([A-Z][a-z]\w*)`/g)].map((m) => m[1] ?? m[2]))];
        const exported = new Set([...h.read("src/index.ts").matchAll(/export \{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((x) => x.trim())));
        const missing = named.filter((n) => !exported.has(n));
        if (named.length === 0) return h.FAIL("the rule names no part");
        return missing.length === 0 ? h.PASS(`${named.length} parts named, all exported`) : h.FAIL(`named but not exported: ${missing.join(", ")}`);
      } },
      { what: "the behaviour enumeration is exported, for UIG-12's registry", run: () => h.contains("src/eslint/index.ts", /export \{ OWNED_BEHAVIOURS\b/, "@estiva-app/ui/eslint exports OWNED_BEHAVIOURS") },
      { what: "Checkbox has a row form, for a list you tick several from", run: () => h.contains("src/Checkbox.tsx", /\brow\?: boolean/, "Checkbox takes row") },
      { what: "ScrollArea's bar sits above sticky rows", run: () => h.contains("src/ScrollArea.tsx", /const BAR = '[^']*\bz-10\b/, "ScrollArea's bar is z-10") },
    ] },
    { ref: "UIG-9", owner: true, checks: [
      { what: "the apps' rules are no-raw-element, no-rebuilt-behaviour and no-restyled-part, and only those", run: () => h.contains("src/eslint/index.ts", /const appRules = \{\s*'no-raw-element': noRawElement,\s*'no-rebuilt-behaviour': noRebuiltBehaviour,\s*'no-restyled-part': noRestyledPart,\s*\}/, "src/eslint/index.ts gives the apps exactly the three rules") },
      { what: "the package runs no-restyled-part on itself too", run: () => h.contains("src/eslint/index.ts", /const packageRules = \{[^}]*'no-restyled-part': noRestyledPart,/, "src/eslint/index.ts puts no-restyled-part in the package's own set") },
      { what: "the look props and the placement list are exported, for UIG-12's registry", run: () => h.contains("src/eslint/index.ts", /export \{ PART_LOOK_PROPS, PLACEMENT \}/, "@estiva-app/ui/eslint exports PART_LOOK_PROPS and PLACEMENT") },
      { what: "a look passed into a part is an error naming the part", run: gate("import { Link } from './Link'\nexport function Probe() {\n  return <Link href=\"/x\" className=\"rounded-lg border\">x</Link>\n}\n", "error", "on `Link` changes how it looks") },
      { what: "placement passed into a part is not", run: gate("import { Link } from './Link'\nexport function Probe() {\n  return <Link href=\"/x\" className=\"mt-2 w-full flex-1 relative\">x</Link>\n}\n", "none") },
      { what: "padding on EmptyState is an error", run: gate("import { EmptyState } from './EmptyState'\nexport function Probe() {\n  return <EmptyState className=\"py-6\" message=\"Nothing yet\" />\n}\n", "error", "EmptyState takes no padding") },
      { what: "an escape passes the same look", run: gate("import { Link } from './Link'\nexport function Probe() {\n  return (\n    // @estiva-escape: a whole row that is one link, and no part does that yet\n    <Link href=\"/x\" className=\"after:absolute after:inset-0\">x</Link>\n  )\n}\n", "none") },
      { what: "the props that replaced the apps' classes exist", run: () => {
        const missing = [];
        const icon = h.read("src/IconButton.tsx");
        if (!/'current' \| 'resolve'/.test(icon)) missing.push("IconButton current, resolve");
        if (!/\bpressed\?: boolean/.test(icon) || !/\bglow\?: boolean/.test(icon)) missing.push("IconButton pressed, glow");
        if (!/'destructive' \| 'resolve'/.test(h.read("src/Button.tsx"))) missing.push("Button resolve");
        if (!/\bclip\?: boolean/.test(h.read("src/Card.tsx"))) missing.push("Card clip");
        if (!/tone\?: 'primary' \| 'secondary'/.test(h.read("src/SectionLabel.tsx"))) missing.push("SectionLabel tone");
        if (!/\btruncate\?: boolean/.test(h.read("src/Link.tsx"))) missing.push("Link truncate");
        return missing.length === 0 ? h.PASS("IconButton current, resolve, pressed, glow; Button resolve; Card clip; SectionLabel tone; Link truncate") : h.FAIL(`missing: ${missing.join("; ")}`);
      } },
    ] },
    // Confirmed by UIG-10, 17 September (GATES.md §23 and "UIG-10: building it").
    { ref: "UIG-10", owner: true, checks: [
      { what: "create-estiva-app is a command of the package", run: () => {
        const bin = JSON.parse(h.read("package.json")).bin ?? {};
        return bin["create-estiva-app"] === "dist/gates/create-app.js" && bin["estiva-gates"] === "dist/gates/cli.js"
          ? h.PASS("package.json has the bins create-estiva-app and estiva-gates")
          : h.FAIL("package.json has no create-estiva-app and estiva-gates bins");
      } },
      { what: "it reads only the package: no Peek, no Ship, no sibling checkout", run: () => h.lacks("src/gates/create-app.ts", /\.\.\/(peek|ship)\b|GATES_PEEK|GATES_SHIP/, "src/gates/create-app.ts names no sibling repo") },
      { what: "every gate piece an app needs ships in @estiva-app/ui/gates", run: () => {
        const index = h.read("src/gates/index.ts");
        const missing = ["tokenLint", "tokenValues", "gateLint", "gateConfig", "writeGateCount", "runHook", "runStatus", "appChecks"].filter((n) => !new RegExp(`\\b${n}\\b`).test(index));
        if (!JSON.parse(h.read("package.json")).exports?.["./gates"]) missing.push("the ./gates export");
        return missing.length === 0 ? h.PASS("the token lint, the gate config, the count, the hook, the status engine and the app checks") : h.FAIL(`missing: ${missing.join(", ")}`);
      } },
      { what: "the checks every app runs are held to Peek's and Ship's", run: () => h.script("package.json", "gates:compare") },
      // Reopened 18 September (GATES.md §0): a made app bakes in the relay packages and is connected.
      { what: "a made app bakes in protocol, platform and interop, and holds one relay client", run: () => h.contains("src/gates/create-app.ts", /'@estiva-app\/protocol': own\('@estiva-app\/protocol'\)[\s\S]*'src\/relay\/client\.ts'[\s\S]*const holder = createLiveClientHolder\(\)/, "create-app writes the three packages and src/relay/client.ts") },
    ] },
    { ref: "UIG-11", owner: true, checks: [
      { what: "the leaf repository exists on GitHub", run: () => h.gh(["repo", "view", "estiva-app/leaf", "--json", "name"], "estiva-app/leaf exists") },
      { what: "a leaf checkout sits beside estiva-ui", run: () => h.file("../leaf/package.json") },
    ] },
    { ref: "UIG-12", owner: true, checks: [
      { what: "registry.json is committed, versioned, and every export is accounted for", run: () => h.json("registry.json", (d) => d.schemaVersion === 1 && Array.isArray(d.entries) && d.entries.length > 0 && d.entries.length + (d.excluded?.length ?? 0) === d.builtFrom?.exports, "registry.json reconciles: entries + explained exclusions = the value exports of index.ts") },
      { what: "every entry says what it is for", run: () => h.json("registry.json", (d) => (d.entries ?? []).every((e) => typeof e.purpose === "string" && e.purpose.trim() !== ""), "no entry has an empty purpose") },
      { what: "every entry says what it can do — all its props, not only its word-choices", run: () => h.json("registry.json", (d) => {
        const entries = d.entries ?? [];
        const props = entries.reduce((n, e) => n + (e.props?.length ?? 0), 0);
        const variants = entries.reduce((n, e) => n + (e.variants?.length ?? 0), 0);
        // Built with variants alone it carried a tenth of the answer, so the
        // check is that props is the whole set and variants only a view of it.
        return props > 300 && props > variants * 5 && entries.every((e) => (e.variants ?? []).every((v) => (e.props ?? []).some((p) => p.name === v.prop)));
      }, "the entries carry every prop they declare, and variants is a view of those") },
      { what: "npm run ui:find is wired", run: () => h.script("package.json", "ui:find") },
      { what: "the catalogue ships in the package, not as a script pasted into each repo", run: () => {
        const pkg = JSON.parse(h.read("package.json"));
        const missing = [];
        if (pkg.bin?.["estiva-ui"] !== "dist/registry/cli.js") missing.push("the estiva-ui bin");
        if (!pkg.exports?.["./registry"]) missing.push("the ./registry export");
        if (!(pkg.files ?? []).includes("registry.json")) missing.push("registry.json in files");
        return missing.length === 0 ? h.PASS("bin estiva-ui, the ./registry export, and registry.json shipped") : h.FAIL(`missing: ${missing.join(", ")}`);
      } },
      { what: "CI rebuilds it and fails when the committed file has drifted", run: () => h.contains(".github/workflows/check.yml", /npm run registry:check/, "check.yml runs registry:check") },
      { what: "it reads UIG-8's behaviour enumeration rather than keeping a list of its own", run: () => h.contains("src/registry/build.ts", /OWNED_BEHAVIOURS/, "src/registry/build.ts reads OWNED_BEHAVIOURS") },
    ] },
    { ref: "UIG-13", owner: true, checks: [
      { what: "the merged registry lists Peek's and Ship's components", run: () => h.json("registry.json", (d) => ["peek", "ship"].every((r) => (d.entries ?? d.components ?? []).some((e) => e.repo === r)), "registry.json has entries from peek and ship") },
    ] },
    { ref: "UIG-14", owner: true, checks: [
      { what: "every component that imports Base UI has the five sections", run: () => {
        const owners = componentFiles().filter((f) => h.read(f).includes("@base-ui/react"));
        return h.share(owners, (f) => h.exists(f.replace(/\.tsx$/, ".mdx")) && fiveSections(f.replace(/\.tsx$/, ".mdx")), "pages with What it is, When, When not, How, What it owns");
      } },
    ] },
    { ref: "UIG-15", owner: true, checks: [
      { what: "EmptyState's page has the five sections", run: () => h.exists("src/EmptyState.mdx") && fiveSections("src/EmptyState.mdx") ? h.PASS("src/EmptyState.mdx has all five") : h.FAIL("src/EmptyState.mdx does not have all five yet") },
    ] },
    { ref: "UIG-16", owner: true, checks: [
      { what: "every component page has the five sections", run: () => h.share(pages(), fiveSections, "pages with What it is, When, When not, How, What it owns") },
    ] },
    { ref: "UIG-19", owner: true, checks: [
      { what: "the usage-page contract runs in CI", run: () => h.ci(/[\w:-]*contract[\w:-]*/) },
      { what: "Storybook composes Peek's and Ship's", run: () => h.contains(".storybook/main.ts", /refs\s*:/, ".storybook/main.ts composes other Storybooks") },
    ] },
    { ref: "UIG-20", owner: true, checks: [
      { what: "the package ships a skill that runs ui:find", run: () => [...h.listFiles("skills", (n) => n === "SKILL.md"), ...h.listFiles(".claude/skills", (n) => n === "SKILL.md")].some((f) => h.read(f).includes("ui:find")) ? h.PASS("a SKILL.md runs ui:find") : h.FAIL("no SKILL.md that runs ui:find") },
    ] },
    { ref: "UIG-21", owner: true, checks: [
      { what: "path-scoped instructions exist", run: () => h.listFiles(".claude/rules", (n) => n.endsWith(".md")).some((f) => /^paths:/m.test(h.read(f))) ? h.PASS(".claude/rules has paths: instructions") : h.FAIL("no .claude/rules file with paths:") },
    ] },
    { ref: "UIG-22", owner: true, checks: [] },
    { ref: "UIG-23", owner: true, checks: [
      { what: "a hand-made empty line is an error in the package too", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe({ items }: { items: string[] }) {\n  return <div>{items.length === 0 ? <p className=\"text-text-secondary\">Nothing here</p> : items.map((i) => <span key={i}>{i}</span>)}</div>\n}\n", expect: "error", mentions: "EmptyState" }) },
    ] },
    { ref: "UIG-24", owner: true, checks: [] },
    { ref: "UIG-25", owner: true, checks: [
      { what: "a copied class list is a warning in the package too", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe() {\n  return <span className=\"text-[10px] uppercase tracking-wide text-text-muted\">Label</span>\n}\n", expect: "warning", mentions: "SectionLabel" }) },
    ] },
    { ref: "UIG-26", owner: true, checks: [] },
    { ref: "UIG-27", owner: true, checks: [
      { what: "Link is in the package", run: () => h.contains("src/index.ts", /\bLink\b/, "src/index.ts exports Link") },
      { what: "InlineChip is in the package", run: () => h.contains("src/index.ts", /\bInlineChip\b/, "src/index.ts exports InlineChip") },
      { what: "ProgressBar is in the package", run: () => h.contains("src/index.ts", /\bProgressBar\b/, "src/index.ts exports ProgressBar") },
      // Katerina, 14 September: no padding prop — a section's empty state goes inside its rows' box, unpadded.
      { what: "EmptyState's page says where a section's empty state goes", run: () => h.contains("src/EmptyState.mdx", /inside the box its rows live in/, "EmptyState.mdx places it inside the rows' box") },
      { what: "Card is in the package", run: () => h.contains("src/index.ts", /\bCard\b/, "src/index.ts exports Card") },
      { what: "AttachmentCard is in the package", run: () => h.contains("src/index.ts", /\bAttachmentCard\b/, "src/index.ts exports AttachmentCard") },
    ] },
    { ref: "UIG-28", owner: true, checks: [
      { what: "text-[14px] is an error in the package", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe() {\n  return <div className=\"text-[14px]\">x</div>\n}\n", expect: "error" }) },
      { what: "a hand-written line height behind an arbitrary variant is an error", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe() {\n  return <div className=\"[&_p]:leading-[1.4]\">x</div>\n}\n", expect: "error" }) },
      { what: "h-[240px] is a warning", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe() {\n  return <div className=\"h-[240px]\">x</div>\n}\n", expect: "warning" }) },
      { what: "h-[240px] is not an error", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe() {\n  return <div className=\"h-[240px]\">x</div>\n}\n", expect: "none" }) },
      { what: "a colour in an inline style is an error", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe({ color }: { color: string }) {\n  return <div style={{ backgroundColor: color }}>x</div>\n}\n", expect: "error", mentions: "inline style" }) },
      { what: "a width and height from a prop pass (Avatar)", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe({ size }: { size: number }) {\n  return <div style={{ width: size, height: size }}>x</div>\n}\n", expect: "none" }) },
      { what: "a test file is not checked for hand-written values", run: () => h.lint({ config: "eslint.config.js", file: "src/__gates_probe__.test.tsx", code: "export function Probe() {\n  return <div className=\"text-[14px]\" style={{ color: 'red' }}>x</div>\n}\n", expect: "none" }) },
    ] },
    { ref: "UIG-30", owner: true, checks: [
      { what: "RichText is in the package", run: () => h.contains("src/index.ts", /\bRichText\b/, "src/index.ts exports RichText") },
    ] },
    // A first guess, from the ticket's text (much later: Katerina, 16 September).
    { ref: "UIG-31", owner: true, checks: [
      { what: "a shared editor-menu part is in the package", run: () => h.contains("src/index.ts", /\b(EditorMenu|SuggestionList|SuggestionMenu)\b/, "src/index.ts exports the editor-menu part") },
    ] },
    // Set by UIG-10, 17 September (GATES.md §23); widened by UIG-32, which moved both apps. Peek and
    // Ship are read from their checkouts: every piece the package ships, imported, and no copy left.
    { ref: "UIG-32", owner: true, checks: [
      { what: "the package exports its gate pieces for the apps to import", run: () => h.contains("package.json", '"./gates"', "package.json exports ./gates") },
      ...[
        { name: "Peek", dir: process.env.GATES_PEEK ?? "../peek", app: "" },
        { name: "Ship", dir: process.env.GATES_SHIP ?? "../ship", app: "web/" },
      ].flatMap(({ name, dir, app }) => {
        const at = (rel) => `${dir.replace(/\\/g, "/").replace(/\/$/, "")}/${rel}`;
        const found = (run) => () => (h.exists(at("package.json")) ? run() : h.UNKNOWN(`${name} is not at ${dir}`));
        return [
          { what: `${name}'s gate config comes from @estiva-app/ui/gates`, run: found(() => h.contains(at(`${app}eslint.gates.config.js`), "@estiva-app/ui/gates", `${name}'s eslint.gates.config.js imports @estiva-app/ui/gates`)) },
          { what: `${name}'s token settings come from the package`, run: found(() => h.contains(at(`${app}eslint.config.js`), "@estiva-app/ui/gates", `${name}'s eslint.config.js imports @estiva-app/ui/gates`)) },
          { what: `${name}'s editor hook is the package's`, run: found(() => h.contains(at(".claude/settings.json"), "@estiva-app/ui/dist/gates/cli.js", `${name}'s hook runs the package's cli.js`)) },
          { what: `${name}'s gates:status is the package's engine`, run: found(() => h.contains(at("package.json"), /"gates:status":\s*"[^"]*(?:estiva-gates|@estiva-app\/ui\/dist\/gates\/cli\.js)[^"]*status/, `${name}'s gates:status runs the package's engine`)) },
          { what: `${name} carries no copy of a gate piece`, run: found(() => {
            const copies = [".claude/hooks/gates.mjs", "scripts/gates-status.mjs", `${app}scripts/gates-count.mjs`, `${app}eslint.gates.js`, `${app}eslint.tokens.js`].filter((f) => h.exists(at(f)));
            return copies.length ? h.FAIL(`${name} still has ${copies.join(", ")}`) : h.PASS(`${name} has no copy`);
          }) },
        ];
      }),
    ] },
  ];

  return { repo: "estiva-ui", all, siblings, tickets };
}
