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
  { ref: "UIG-10", owner: "estiva-ui", parts: PEEK_SHIP, title: "create-app — a command that makes a new Estiva app that runs" },
  { ref: "UIG-11", owner: "estiva-ui", title: "Create the Leaf repo from it" },
  { ref: "UIG-12", owner: "estiva-ui", title: "The registry, thin and proved — estiva-ui first" },
  { ref: "UIG-13", owner: "estiva-ui", parts: PEEK_SHIP, title: "The registry widens to Peek's 115 and Ship's 74, with classification" },
  { ref: "UIG-14", owner: "estiva-ui", title: "Usage rules — estiva-ui's components that own a behaviour" },
  { ref: "UIG-15", owner: "estiva-ui", title: "Usage rules — estiva-ui's frame and layout components" },
  { ref: "UIG-16", owner: "estiva-ui", title: "Usage rules — the rest of estiva-ui, and close the 44" },
  { ref: "UIG-17", owner: "peek", title: "Usage rules — Peek's own components" },
  { ref: "UIG-18", owner: "ship", title: "Usage rules — Ship's own components" },
  { ref: "UIG-19", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lock the contract in CI" },
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
  { ref: "UIG-33", owner: "estiva-ui", title: "Link — a whole row that is one link" },
  { ref: "UIG-34", owner: "estiva-ui", title: "A tree part — Peek's file tree and folder list" },
  { ref: "UIG-35", owner: "estiva-ui", parts: PEEK_SHIP, title: "Lightbox — one attachment part that opens a picture full screen, for both apps" },
  { ref: "UIG-36", owner: "estiva-ui", title: "Estiva ID gets its own Storybook, and leaves Peek's" },
  { ref: "UIG-37", owner: "estiva-ui", parts: PEEK_SHIP, title: "The gates refuse a TypeScript eslint-disable comment — know the rule names, rules off" },
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
  // A page's contract (UIG-14): a line under the title saying what it is, then When, When not,
  // How with code, and What it owns — each once, in that order. src/pages.test.ts holds the rest.
  const contract = (mdx) => {
    const t = h.read(mdx).replace(/\r\n/g, "\n");
    const heads = [...t.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    const at = ["When", "When not", "How", "What it owns"].map((s) => heads.indexOf(s));
    const opening = (t.split(/^# .*$/m)[1] ?? "").split(/\n\s*\n/).map((s) => s.trim()).find((s) => s && !s.startsWith("<"));
    const how = t.split("\n## How\n")[1]?.split("\n## ")[0] ?? "";
    return Boolean(opening) && at.every((i) => i >= 0) && at.every((i, n) => n === 0 || i > at[n - 1]) && new Set(heads).size === heads.length && /```tsx?\n/.test(how);
  };

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
      // "Only those" held until UIG-22 added a fingerprint: the three come first, a fingerprint may follow.
      { what: "the apps' rules are no-raw-element, no-rebuilt-behaviour and no-restyled-part, then the fingerprints", run: () => h.contains("src/eslint/index.ts", /const appRules = \{\s*'no-raw-element': noRawElement,\s*'no-rebuilt-behaviour': noRebuiltBehaviour,\s*'no-restyled-part': noRestyledPart,\s*(?:'no-[a-z-]+': \w+,\s*)*\}/, "src/eslint/index.ts gives the apps the three rules, then the fingerprints") },
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
      { what: "registry.json is committed, versioned, and every export is accounted for", run: () => h.json("registry.json", (d) => d.schemaVersion >= 1 && Array.isArray(d.entries) && d.entries.length > 0 && d.entries.length + (d.excluded?.length ?? 0) === d.builtFrom?.exports, "registry.json reconciles: entries + explained exclusions = the value exports of index.ts") },
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
    // Built 18 September. Katerina: Peek's and Ship's catalogues stay private, built
    // fresh in each app and put together only on a machine that has all three.
    { ref: "UIG-13", owner: true, checks: [
      { what: "the package builds an app's catalogue, and one search reads several", run: () => h.contains("src/registry/index.ts", /buildAppRegistry[\s\S]*findInRegistries/, "@estiva-app/ui/registry exports buildAppRegistry and findInRegistries") },
      { what: "the public package holds no app's parts", run: () => h.json("registry.json", (d) => d.schemaVersion === 2 && d.builtFrom?.kind === "package" && (d.entries ?? []).every((e) => e.repo === "estiva-ui" && e.app === null), "registry.json is the package's own, schema 2, and no entry is an app's") },
      // Since UIG-20, `find` brings in every app beside it by itself; naming them with
      // `--also` is what this check asked for before, and now the thing to avoid.
      { what: "ui:find here brings in Peek and Ship when they sit beside it", run: () => {
        const finds = h.contains("src/registry/cli.ts", /findSiblings\(workspaceOf\(root\)/, "estiva-ui find finds its neighbours");
        return finds.result !== "pass" ? finds : h.lacks("package.json", /"ui:find":[^\n]*--also/, "ui:find names no neighbour: find brings in every app beside it (UIG-20)");
      } },
      { what: "a made app gets ui:find, registry:check in its job gate, and ignores registry.json", run: () => {
        const made = h.read("src/gates/create-app.ts");
        const missing = [
          [/'ui:find': 'estiva-ui find'/, "the ui:find script"],
          [/'registry:check': 'estiva-ui check'/, "the registry:check script"],
          [/run: npm run registry:check/, "the step in job gate"],
          [/'\.gitignore': \[[^\]]*'registry\.json'/, "registry.json in .gitignore"],
        ].filter(([re]) => !re.test(made)).map(([, what]) => what);
        return missing.length ? h.FAIL(`create-app lacks ${missing.join(", ")}`) : h.PASS("create-app writes the scripts, the gate step and the ignore line");
      } },
    ] },
    { ref: "UIG-14", owner: true, checks: [
      { what: "every component that imports Base UI keeps the page contract", run: () => {
        const owners = componentFiles().filter((f) => h.read(f).includes("@base-ui/react"));
        return h.share(owners, (f) => h.exists(f.replace(/\.tsx$/, ".mdx")) && contract(f.replace(/\.tsx$/, ".mdx")), "pages with an opening line, When, When not, How with code, What it owns");
      } },
      { what: "the contract is a test that reads What it owns against the checker", run: () => h.exists("src/pages.test.ts") && /OWNED_BEHAVIOURS/.test(h.read("src/pages.test.ts")) ? h.PASS("src/pages.test.ts reads OWNED_BEHAVIOURS") : h.FAIL("no src/pages.test.ts reading OWNED_BEHAVIOURS") },
    ] },
    { ref: "UIG-15", owner: true, checks: [
      { what: "EmptyState's page keeps the contract (folded into UIG-14)", run: () => h.exists("src/EmptyState.mdx") && contract("src/EmptyState.mdx") ? h.PASS("src/EmptyState.mdx keeps it") : h.FAIL("src/EmptyState.mdx does not keep it yet") },
      // The ticket's own test: each of the eight Folders mistakes, walked one by one in the record.
      { what: "the record walks the eight Folders mistakes, one by one", run: () => {
        const g = h.read("docs/GATES.md");
        const missing = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !new RegExp(`^\\| D${n} \\|`, "m").test(g));
        return missing.length ? h.FAIL(`docs/GATES.md lacks ${missing.map((n) => `D${n}`).join(", ")}`) : h.PASS("docs/GATES.md walks D1 to D8");
      } },
      // "Where a number is the contract, the page says the number": the ticket's example part.
      { what: "ContainerHeader's page states its numbers", run: () => {
        const t = h.read("src/ContainerHeader.mdx");
        const missing = ["48px", "20px in", "16px from the right"].filter((n) => !t.includes(n));
        return missing.length ? h.FAIL(`src/ContainerHeader.mdx does not say ${missing.join(", ")}`) : h.PASS("src/ContainerHeader.mdx says 48px, 20px in, 16px from the right");
      } },
    ] },
    { ref: "UIG-16", owner: true, checks: [
      { what: "every component page keeps the contract (folded into UIG-14)", run: () => h.share(pages(), contract, "pages with an opening line, When, When not, How with code, What it owns") },
      // The reconciliation table: every page there is, today and the next one, has its row.
      { what: "table R in the record lists every page", run: () => {
        const g = h.read("docs/GATES.md").replace(/\r\n/g, "\n");
        const at = g.indexOf("#### Table R");
        const table = at < 0 ? "" : g.slice(at).split("\n\n").find((block) => block.startsWith("|")) ?? "";
        const missing = pages().map((f) => f.slice(4, -4)).filter((name) => !table.includes(`| \`${name}\` |`));
        return missing.length ? h.FAIL(`table R lacks ${missing.join(", ")}`) : h.PASS(`table R lists all ${pages().length} pages`);
      } },
      { what: "the record holds the decision on exports that are not parts", run: () => h.contains("docs/GATES.md", /Exports that are not parts/, "docs/GATES.md states the rule") },
    ] },
    { ref: "UIG-19", owner: true, checks: [
      // The contract and the story links run inside `estiva-ui check`, which every
      // repo's CI already runs as `registry:check` (UIG-13): nothing new to wire.
      { what: "estiva-ui check runs the usage-page contract and the story links", run: () => {
        const cli = h.read("src/registry/cli.ts");
        return /contractProblems\(/.test(cli) && /checkLinks\(/.test(cli) ? h.PASS("src/registry/cli.ts runs contractProblems and checkLinks") : h.FAIL("src/registry/cli.ts does not run the contract and the links");
      } },
      // The gate job, not merely CI: merging requires `gate` alone (UIG-6), and
      // until 23 September a page without "When not" failed `check` here and
      // could still merge (proved on estiva-ui #78).
      { what: "the package's gate job runs it, so it blocks a merge", run: () => h.ciJob("gate", "registry:check") },
      // Composition was dropped on 23 September (Katerina): the one search is
      // `estiva-ui find`, and running it unasked is UIG-20's. What replaced the
      // check: the section check lives once, here, not pasted into each app.
      { what: "no app keeps its own copy of the usage-page section check", run: () => {
        const copies = [["peek", process.env.GATES_PEEK ?? "../peek", "scripts/gates-checks.mjs"], ["ship", process.env.GATES_SHIP ?? "../ship", "web/scripts/gates-checks.mjs"]]
          .filter(([, dir, f]) => h.exists(`${dir.replace(/[\\/]+$/, "")}/${f}`) && /"When not"/.test(h.read(`${dir.replace(/[\\/]+$/, "")}/${f}`)))
          .map(([name]) => name);
        return copies.length ? h.FAIL(`${copies.join(" and ")} still check the sections in their own gates-checks.mjs`) : h.PASS("neither app checks the sections itself");
      } },
    ] },
    // The Claude skill (UIG-20). Its text ships once, here; each repository commits
    // a loader that reads it in (docs/GATES-SKILL.md holds the Gotchas' record).
    { ref: "UIG-20", owner: true, checks: [
      { what: "the skill's text ships in the package, once", run: () => h.exists("skill/estiva-ui.md") && /"skill"/.test(h.read("package.json")) ? h.PASS("skill/estiva-ui.md is in the package's files") : h.FAIL("skill/estiva-ui.md is missing, or not in the package's files") },
      { what: "its first step is the search, over every catalogue", run: () => h.contains("skill/estiva-ui.md", /Search before creating anything\.\*\* Run\s+`npm run ui:find/, "step one runs npm run ui:find") },
      { what: "find searches every app beside this one, with nothing typed", run: () => h.contains("src/registry/cli.ts", /findSiblings\(workspaceOf\(root\)/, "estiva-ui find finds its neighbours") },
      { what: "this repository's loader reads the package's text", run: () => h.contains(".claude/skills/estiva-ui/SKILL.md", '!`cat "${CLAUDE_PROJECT_DIR}/skill/estiva-ui.md"`', "the loader reads skill/estiva-ui.md") },
      { what: "estiva-ui check refuses a missing or drifted loader", run: () => h.contains("src/registry/cli.ts", /const loaded = checkLoader\(\)/, "check runs checkLoader") },
      { what: "the gate job holds the skill to the catalogue and the record", run: () => h.ciJob("gate", "skill:check") },
      { what: "the hook asks for a search before a new part", run: () => h.contains("src/gates/hook.ts", /searchFirst\(call, file, text/, "runHook runs searchFirst") },
      { what: "an app made by the starter gets the loader", run: () => h.contains("src/gates/create-app.ts", "'.claude/skills/estiva-ui/SKILL.md': loaderText(", "create-app writes the loader") },
      { what: "every recorded defect is a Gotcha or excluded with a reason", run: () => h.contains("docs/GATES-SKILL.md", /\*\*542\*\* \| \*\*111\*\* \| \*\*431\*\*/, "docs/GATES-SKILL.md reconciles 542 = 111 + 431") },
    ] },
    // What loads into every Claude session (UIG-21). The apps' half is appChecks'.
    { ref: "UIG-21", owner: true, checks: [
      { what: "CLAUDE.md is under 200 lines, and every rule file is scoped", run: () => h.instructions(200) },
      { what: "CI's job gate runs the token lint", run: () => h.ciJob("gate", "lint") },
      { what: "a plain tailwind-merge is an error naming src/cn.ts", run: () => h.lint({ config: "eslint.config.js", file: "src/__gates_probe__.ts", code: "import { twMerge } from 'tailwind-merge'\nexport const merged = twMerge('p-2', 'p-3')\n", expect: "error", mentions: "src/cn.ts" }) },
    ] },
    // UIG-22: the rule reads a shape, so it is proved on shapes (src/eslint/no-handmade-header.test.ts).
    { ref: "UIG-22", owner: true, checks: [
      { what: "the apps' gate carries no-handmade-header", run: () => h.contains("src/eslint/index.ts", /'no-handmade-header': noHandmadeHeader[\s\S]*recommended[\s\S]*no-handmade-header`\]: 'error'/, "no-handmade-header is an app rule, on in recommended") },
      { what: "it is tested on both Folders panes and on a shape with other class names", run: () => h.contains("src/eslint/no-handmade-header.test.ts", /the shape, not the class names/, "the rule's tests hold the shape") },
    ] },
    // UIG-23: the rule reads where a line sits, so it is proved on places (src/eslint/no-handmade-empty-state.test.ts).
    { ref: "UIG-23", owner: true, checks: [
      { what: "the apps' gate carries no-handmade-empty-state", run: () => h.contains("src/eslint/index.ts", /'no-handmade-empty-state': noHandmadeEmptyState[\s\S]*recommended[\s\S]*no-handmade-empty-state`\]: 'error'/, "no-handmade-empty-state is an app rule, on in recommended") },
      { what: "it is tested on the four Folders states, the two false alarms and the three open lines", run: () => h.contains("src/eslint/no-handmade-empty-state.test.ts", /7f22e5e~1[\s\S]*CommandLauncher\.tsx:1498[\s\S]*FolderContentsView\.tsx:101[\s\S]*ReadStatePanel\.tsx:65[\s\S]*CommandLauncher\.tsx:1514/, "the rule's tests hold the ticket's cases") },
      { what: "a hand-made empty line is an error in the package too", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe({ items }: { items: string[] }) {\n  return <div>{items.length === 0 ? <p className=\"text-text-secondary\">Nothing here</p> : items.map((i) => <span key={i}>{i}</span>)}</div>\n}\n", expect: "error", mentions: "EmptyState" }) },
    ] },
    // UIG-24: the rule reads the attribute, never the page (src/eslint/no-native-title.test.ts).
    { ref: "UIG-24", owner: true, checks: [
      { what: "the apps' gate carries no-native-title", run: () => h.contains("src/eslint/index.ts", /'no-native-title': noNativeTitle[\s\S]*recommended[\s\S]*no-native-title`\]: 'error'/, "no-native-title is an app rule, on in recommended") },
      { what: "it never fires on an svg's <title>, and is tested on the Folders timestamp", run: () => h.contains("src/eslint/no-native-title.test.ts", /svg[\s\S]*3dc663b~1/, "the rule's tests hold the ticket's cases") },
      { what: "a title= is an error in the package too", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe({ at }: { at: string }) {\n  return <span title={at}>{at}</span>\n}\n", expect: "error", mentions: "WithTooltip" }) },
    ] },
    // UIG-25: a copied look warns, never blocks (Katerina, 13 September); the parts' looks travel in the catalogue.
    { ref: "UIG-25", owner: true, checks: [
      { what: "the apps' gate carries no-copied-look, as a warning", run: () => h.contains("src/eslint/index.ts", /'no-copied-look': noCopiedLook[\s\S]*recommended[\s\S]*no-copied-look`\]: 'warn'/, "no-copied-look is an app rule, a warning in recommended") },
      { what: "the catalogue carries each part's looks", run: () => h.contains("registry.json", /"name": "SectionLabel"[\s\S]*?"looks": \[\s*"text-h5/, "registry.json records SectionLabel's looks") },
      { what: "it is tested on the package copying itself, a wrapper left alone, and a part added later", run: () => h.contains("src/eslint/no-copied-look.test.ts", /TextInput ≈ Textarea[\s\S]*a new part is covered the day it is added/, "the rule's tests hold the ticket's cases") },
      { what: "a copied look is a warning in the package too", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe() {\n  return <span className=\"text-h5 leading-3 signal:font-mono signal:text-small signal:uppercase signal:tracking-widest text-text-secondary\">Label</span>\n}\n", expect: "warning", mentions: "SectionLabel" }) },
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
    // First guesses, from the tickets' text (UIG-14 findings C10 and L; Katerina, 19 September).
    { ref: "UIG-33", owner: true, checks: [
      { what: "the package draws a whole row as one link", run: () => /\brow\?:/.test(h.read("src/Link.tsx")) || /\b(RowLink|LinkRow)\b/.test(h.read("src/index.ts")) ? h.PASS("Link takes row, or a row part is exported") : h.FAIL("no whole-row link in the package yet") },
    ] },
    { ref: "UIG-34", owner: true, checks: [
      { what: "a tree part is in the package", run: () => h.contains("src/index.ts", /\bTree\b/, "src/index.ts exports Tree") },
    ] },
    // UIG-35 closed on 21 September and left no record at all: the status script
    // did not carry the ticket, so nothing read its code back. These do. Both
    // apps' halves are read from their checkouts, the way UIG-32 reads them.
    { ref: "UIG-35", owner: true, checks: [
      { what: "the package has a picture viewer, and it is exported", run: () => h.contains("src/index.ts", /export \{ Lightbox\b/, "src/index.ts exports Lightbox") },
      { what: "the viewer is Base UI's Dialog, not a layer built by hand", run: () => h.contains("src/Lightbox.tsx", "@base-ui/react/dialog", "Lightbox.tsx is on Base UI's Dialog") },
      { what: "a viewer built by hand is refused by name", run: () => h.contains("src/eslint/no-rebuilt-behaviour.ts", /owners: \[[^\]]*'Lightbox'/, "no-rebuilt-behaviour.ts names Lightbox as an owner") },
      { what: "a picture dims harder than a dialog, in every theme", run: () => {
        const n = (h.read("tokens.css").match(/--scrim-strong:/g) ?? []).length;
        return n === 4 ? h.PASS("--scrim-strong is in all four themes") : h.FAIL(`--scrim-strong is in ${n} themes, not four`);
      } },
      { what: "the card fetches, opens and saves by itself", run: () => {
        const t = h.read("src/AttachmentCard.tsx");
        const missing = ["remoteSrc", "remoteFullSrc", "fetchImage", "download", "alt"].filter((p) => !t.includes(`\n  ${p}?:`));
        return missing.length ? h.FAIL(`AttachmentCard has no ${missing.join(", ")}`) : h.PASS("remoteSrc, remoteFullSrc, fetchImage, download and alt are the card's own");
      } },
      { what: "the viewer keeps the page contract and has a story", run: () => (h.exists("src/Lightbox.mdx") && contract("src/Lightbox.mdx") && h.exists("src/Lightbox.stories.tsx") ? h.PASS("Lightbox.mdx keeps the contract and Lightbox.stories.tsx draws it") : h.FAIL("Lightbox.mdx is missing or out of contract, or there is no story")) },
      { what: "Peek draws the package's card and keeps no viewer of its own", run: () => {
        const dir = (process.env.GATES_PEEK ?? "../peek").replace(/[\\/]+$/, "");
        if (!h.exists(`${dir}/package.json`)) return h.UNKNOWN(`Peek is not at ${dir}`);
        if (h.exists(`${dir}/src/components/ui/FileAttachmentCard.tsx`)) return h.FAIL("Peek still has ui/FileAttachmentCard.tsx");
        return h.contains(`${dir}/src/components/ConversationCard.tsx`, /\bAttachmentCard\b/, "Peek's ConversationCard draws the package's AttachmentCard");
      } },
      { what: "Ship draws the package's card and fetches nothing by hand", run: () => {
        const dir = (process.env.GATES_SHIP ?? "../ship").replace(/[\\/]+$/, "");
        const f = `${dir}/web/src/components/ui/Attachment.tsx`;
        if (!h.exists(`${dir}/web/package.json`)) return h.UNKNOWN(`Ship is not at ${dir}`);
        if (!h.exists(f)) return h.FAIL("Ship has no web/src/components/ui/Attachment.tsx");
        if (/\buseBlobUrl\b|\bsaveFile\b/.test(h.read(f))) return h.FAIL("Ship's Attachment.tsx still fetches or saves by hand");
        return h.contains(f, /\bAttachmentCard\b/, "Ship's Attachment.tsx draws the package's AttachmentCard");
      } },
    ] },
    // UIG-36, 23 September (Katerina): Estiva ID runs its own Storybook and
    // Peek's stops reaching into it. Both halves are read from the checkouts.
    // estiva-id is not a gated repo, so its half has no status of its own.
    { ref: "UIG-36", owner: true, checks: [
      { what: "Estiva ID has a Storybook of its own", run: () => {
        const dir = (process.env.GATES_ESTIVA_ID ?? "../estiva-id").replace(/[\\/]+$/, "");
        if (!h.exists(`${dir}/package.json`)) return h.UNKNOWN(`Estiva ID is not at ${dir}`);
        if (!h.exists(`${dir}/.storybook/main.ts`)) return h.FAIL("estiva-id has no .storybook/main.ts");
        return h.contains(`${dir}/package.json`, /"storybook": "storybook dev -p 6009/, "estiva-id runs `pnpm storybook` on :6009");
      } },
      { what: "Peek's Storybook loads nothing from estiva-id", run: () => {
        const dir = (process.env.GATES_PEEK ?? "../peek").replace(/[\\/]+$/, "");
        if (!h.exists(`${dir}/package.json`)) return h.UNKNOWN(`Peek is not at ${dir}`);
        // What loaded them: the sibling path, the variable holding it, and the
        // heading prefix. The word alone is not enough — the comment says where they went.
        return h.lacks(`${dir}/.storybook/main.ts`, /\.\.\/estiva-id|estivaIdRoot|titlePrefix/, "Peek's .storybook/main.ts loads no other repo's stories");
      } },
      { what: "the fields and the list Peek's reset hid are styled", run: () => {
        const dir = (process.env.GATES_ESTIVA_ID ?? "../estiva-id").replace(/[\\/]+$/, "");
        const f = `${dir}/web/src/styles.css`;
        if (!h.exists(f)) return h.UNKNOWN(`Estiva ID is not at ${dir}`);
        const css = h.read(f);
        const missing = [['input[type="email"]', "the email field"], ["input:not([type])", "a field with no type"], ["ul.plain", "the bots list"]]
          .filter(([sel]) => !css.includes(sel)).map(([, what]) => what);
        return missing.length ? h.FAIL(`styles.css does not style ${missing.join(", ")}`) : h.PASS("styles.css covers the email field, a field with no type, and the bots list");
      } },
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
    // UIG-37, 23 September: Peek PR #324's first version failed Peek's token lint on a correct
    // `eslint-disable-line @typescript-eslint/no-explicit-any`. The apps' half is appChecks'.
    { ref: "UIG-37", owner: true, checks: [
      { what: "the package exports tokenConfig, the token lint on its own", run: () => h.contains("src/gates/index.ts", /\btokenConfig\b/, "src/gates/index.ts exports tokenConfig") },
      { what: "a TypeScript eslint-disable comment is no error in the gate", run: gate("// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const probe: any = 1\n", "none") },
    ] },
  ];

  return { repo: "estiva-ui", all, siblings, tickets };
}
