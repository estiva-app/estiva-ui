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
];

const siblings = [
  { name: "peek", path: "../peek", env: "GATES_PEEK" },
  { name: "ship", path: "../ship", env: "GATES_SHIP" },
  { name: "leaf", path: "../leaf", env: "GATES_LEAF" },
];

export default function define(h) {
  const PROBE = "src/__gates_probe__.tsx";
  const componentFiles = () => h.listFiles("src", (n) => /\.tsx$/.test(n) && !/\.(stories|test)\.tsx$/.test(n)).filter((f) => !f.includes("/", 4));
  const pages = () => h.listFiles("src", (n) => n.endsWith(".mdx")).filter((f) => !f.includes("/", 4));
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
      { what: "GATES.md holds the 29-ticket route", run: () => h.contains("docs/GATES.md", "## §15 The route", "GATES.md §15 is the route") },
      { what: "npm run gates:status is wired", run: () => h.script("package.json", "gates:status") },
    ] },
    { ref: "UIG-3", owner: false, checks: [
      { what: "the lint plugin lives in src/eslint", run: () => h.listFiles("src/eslint", (n) => /^index\.(m?[jt]s)$/.test(n)).length ? h.PASS("src/eslint has an index") : h.FAIL("src/eslint has no index file") },
      { what: "package.json exports ./eslint", run: () => h.contains("package.json", '"./eslint"', "package.json exports ./eslint") },
      { what: "the plugin has no-raw-button", run: () => h.listFiles("src/eslint", () => true).some((f) => h.read(f).includes("no-raw-button")) ? h.PASS("src/eslint defines no-raw-button") : h.FAIL("no no-raw-button in src/eslint") },
    ] },
    { ref: "UIG-5", owner: true, checks: [
      ...chain(),
      { what: "a raw element nested in a component is an error", run: () => h.lint({ config: "eslint.gates.config.js", file: PROBE, code: "export function Probe() {\n  return <div><button type=\"button\">x</button></div>\n}\n", expect: "error" }) },
    ] },
    { ref: "UIG-6", owner: true, checks: [
      { what: "GitHub requires the gate lint to merge", run: () => h.protectedBranch(/gate|lint:rules/i) },
    ] },
    { ref: "UIG-7", owner: true, checks: [] },
    { ref: "UIG-8", owner: true, checks: [] },
    { ref: "UIG-9", owner: true, checks: [] },
    { ref: "UIG-10", owner: true, checks: [
      { what: "a create-app command exists", run: () => {
        const bin = JSON.parse(h.read("package.json")).bin;
        const inBin = bin && (typeof bin === "string" || Object.keys(bin).some((k) => /create-app/.test(k)));
        const file = ["create-app", "packages/create-app"].some(h.exists) || h.listFiles("scripts", (n) => /^create-app\./.test(n)).length > 0;
        return inBin || file ? h.PASS("a create-app command is in the package") : h.FAIL("no create-app command yet");
      } },
    ] },
    { ref: "UIG-11", owner: true, checks: [
      { what: "the leaf repository exists on GitHub", run: () => h.gh(["repo", "view", "estiva-app/leaf", "--json", "name"], "estiva-app/leaf exists") },
      { what: "a leaf checkout sits beside estiva-ui", run: () => h.file("../leaf/package.json") },
    ] },
    { ref: "UIG-12", owner: true, checks: [
      { what: "registry.json is committed, versioned and has entries", run: () => h.json("registry.json", (d) => (d.schemaVersion ?? d.version) !== undefined && (d.entries ?? d.components ?? []).length > 0, "registry.json has a schema version and entries") },
      { what: "npm run ui:find is wired", run: () => h.script("package.json", "ui:find") },
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
    ] },
    { ref: "UIG-28", owner: true, checks: [
      { what: "text-[14px] is an error in the package", run: () => h.lint({ config: "eslint.config.js", file: PROBE, code: "export function Probe() {\n  return <div className=\"text-[14px]\">x</div>\n}\n", expect: "error" }) },
    ] },
    { ref: "UIG-30", owner: true, checks: [
      { what: "RichText is in the package", run: () => h.contains("src/index.ts", /\bRichText\b/, "src/index.ts exports RichText") },
    ] },
  ];

  return { repo: "estiva-ui", all, siblings, tickets };
}
