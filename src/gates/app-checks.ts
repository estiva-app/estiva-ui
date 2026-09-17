/// <reference types="node" />
/**
 * The gate checks every app runs, written once (docs/GATES.md §23).
 *
 * Until UIG-10 Peek and Ship each wrote them into their own
 * `scripts/gates-checks.mjs`. 65 different checks for finished tickets, counted
 * on 17 September: 28 were identical in both, 21 were the same check written two
 * ways, 2 read each app's real page, and 14 read code only one app has. This is
 * the first three groups as one list. The fourth stays in the app's own checks
 * file, beside this list.
 *
 * Where Peek and Ship wrote one check two ways, the check here runs both, so it
 * passes wherever either did: the raw-link probe with both of their texts, the
 * token probes against each token config the app has.
 *
 * `scripts/gates-compare.mjs` holds this list to Peek's and Ship's: every check
 * of theirs must be here, or be about code only that app has, or the comparison
 * fails and names it.
 *
 * A check for a ticket not built yet is a first guess at the evidence, taken
 * from the ticket's own text; the ticket that builds it changes it here.
 */
import type { CheckResult, GateCheck, GateHelpers, GateTicket } from './status'

export interface AppCheckOptions {
  /** Where the app is inside the repository: `web` in Ship, `.` elsewhere. */
  app?: string
  /** A real page of the app, relative to the app, full of elements that are not controls. */
  page: string
  /** The ticket the gate chain is listed under, and whether this repo owns it: UIG-3 in Peek, UIG-4 in Ship. */
  chain?: { ref: string; owner: boolean }
  /** The token lint configs the app has, relative to the app. */
  tokenConfigs?: string[]
  /** The name of the app's header component a hand-made header row should name (UIG-22's first guess). */
  headers?: string[]
}

export const APP_TICKET_TITLES: Record<string, string> = {
  'UIG-2': 'The tracking rails — GATES.md, the status script, the guide committed',
  'UIG-3': 'Tracer bullet — one rule, end to end, blocking in Peek',
  'UIG-4': 'The same chain, blocking in Ship',
  'UIG-6': 'Branch protection — the backstop, all three repos',
  'UIG-7': 'Lint rule — every remaining raw element',
  'UIG-8': 'Lint rule — forbid the reach',
  'UIG-9': 'Lint rule — the className allow-list',
  'UIG-13': "The registry widens to Peek's 115 and Ship's 74, with classification",
  'UIG-19': 'Lock the contract in CI, and make the three Storybooks one search',
  'UIG-20': 'The Claude skill, reading the registry',
  'UIG-21': 'CLAUDE.md becomes an index, not a lecture',
  'UIG-22': 'Fingerprint — a hand-made header row',
  'UIG-23': 'Fingerprint — a hand-made empty state',
  'UIG-24': 'Fingerprint — a browser tooltip where ours belongs',
  'UIG-25': 'Fingerprint — a component copied out by hand',
  'UIG-27': 'The components the apps had to build themselves — Link, ProgressBar, EmptyState padding',
  'UIG-28': 'Close the two holes in the token contract — arbitrary values, and inline style',
  'UIG-30': 'RichText — one component that draws a message\'s text, for both apps',
  'UIG-32': 'Peek and Ship take their gate pieces from the package',
}

/** Run several checks as one: the first that does not pass is the answer. */
function all(h: GateHelpers, steps: (() => CheckResult | Promise<CheckResult>)[], label: string): () => Promise<CheckResult> {
  return async () => {
    for (const step of steps) {
      const r = await step()
      if (r.result !== 'pass') return r
    }
    return h.PASS(label)
  }
}

export function appChecks(h: GateHelpers, { app = '.', page, chain = { ref: 'UIG-3', owner: false }, tokenConfigs = ['eslint.tokens.config.js', 'eslint.config.js'], headers = ['ContainerHeader', 'SectionHeader'] }: AppCheckOptions): GateTicket[] {
  const WEB = app === '.' ? '' : `${app.replace(/\/$/, '')}/`
  const cwd = app === '.' ? undefined : app
  const PROBE = 'src/components/__gates_probe__.tsx'
  const GATES = 'eslint.gates.config.js'
  const at = (rel: string) => `${WEB}${rel}`
  const probe = (code: string, expect: 'error' | 'warning' | 'none', mentions?: string, file = PROBE, config = GATES) => () =>
    h.lint({ ...(cwd ? { cwd } : {}), config, file, code, expect, mentions })
  const component = (body: string) => `export function Probe() {\n  return ${body}\n}\n`
  const installed = at('node_modules/@estiva-app/ui/dist/index.d.ts')
  const realPage = (): Promise<CheckResult> => h.lint({ ...(cwd ? { cwd } : {}), config: GATES, file: page, code: h.read(at(page)), expect: 'none' })
  const button = component('<button type="button">x</button>')
  const ticket = (ref: string, checks: GateCheck[], owner = false): GateTicket => ({ ref, title: APP_TICKET_TITLES[ref], owner, checks })

  const tokenProbe = (code: string, expect: 'error' | 'warning' | 'none', mentions?: string, file = PROBE) =>
    all(h, tokenConfigs.map((config) => probe(code, expect, mentions, file, config)), `${tokenConfigs.join(' and ')}: as expected`)

  return [
    ticket('UIG-2', [
      { what: 'npm run gates:status is wired', run: () => h.script('package.json', 'gates:status') },
    ]),
    ticket(chain.ref, [
      { what: 'the gate lint config loads', run: () => h.loads(at(GATES)) },
      { what: `${at('package.json')} has lint:rules`, run: () => h.script(at('package.json'), 'lint:rules') },
      { what: 'CI runs lint:rules', run: () => h.ci('lint:rules') },
      { what: 'the committed hook runs the gate lint', run: () => h.hook('.claude/settings.json', 'gates') },
      { what: '.gates-count.json is committed and parses', run: () => h.json(h.exists('.gates-count.json') ? '.gates-count.json' : at('.gates-count.json')) },
      { what: 'a raw <button> is an error naming Button', run: probe(button, 'error', 'Button') },
      { what: 'the same in a story', run: probe(button, 'error', 'Button', 'src/stories/__gates_probe__.stories.tsx') },
      { what: 'a test file is not checked, while source is', run: async () => {
        const source = await probe(button, 'error', 'Button')()
        if (source.result !== 'pass') return h.FAIL(`source is not checked yet, so this proves nothing: ${source.detail}`)
        return probe(button, 'none', undefined, 'src/components/__gates_probe__.test.tsx')()
      } },
      { what: 'the debt list exists', run: () => h.file('docs/GATES-DEBT.md') },
    ], chain.owner),
    ticket('UIG-6', [
      { what: 'GitHub requires the check gate to merge into main', run: () => h.protectedBranch(/^gate$/) },
      { what: "CI's job gate runs lint:rules", run: () => h.ciJob('gate', 'lint:rules') },
    ]),
    ticket('UIG-7', [
      { what: 'a raw <input> is an error naming TextInput', run: probe(component('<input />'), 'error', 'TextInput') },
      { what: 'a raw <a> is an error naming Link', run: all(h, [probe(component('<a href="/topics">Topics</a>'), 'error', 'Link'), probe(component('<a href="/issues">Issues</a>'), 'error', 'Link')], 'a raw <a> is an error naming Link') },
      { what: 'a raw <form> is an error naming Form, and a file input one naming FilePicker', run: async () => {
        const form = await probe(component('<form />'), 'error', '`Form`')()
        if (form.result !== 'pass') return form
        return probe(component('<input type="file" />'), 'error', 'FilePicker')()
      } },
      { what: '<textarea>, <select>, <dialog> and <label> name Textarea, Select, DialogShell and Field', run: async () => {
        for (const [element, part] of [['textarea', 'Textarea'], ['select', 'Select'], ['dialog', 'DialogShell'], ['label', 'Field']]) {
          const one = await probe(component(`<${element} />`), 'error', `\`${part}\``)()
          if (one.result !== 'pass') return one
        }
        return h.PASS('all four are errors, each naming its part')
      } },
      { what: 'an element the package has no part for is an error that says to ask for one', run: probe(component('<iframe title="Map" />'), 'error', 'ask Katerina') },
      { what: 'an escaped element is not an error, while the same element is', run: async () => {
        const raw = await probe(component('<form />'), 'error')()
        if (raw.result !== 'pass') return h.FAIL(`a raw <form> is not caught yet, so this proves nothing: ${raw.detail}`)
        return probe('export function Probe() {\n  return (\n    // @estiva-escape: a probe that keeps its element on purpose\n    <form />\n  )\n}\n', 'none')()
      } },
      { what: 'a real page, full of elements that are not controls, gets no error', run: realPage },
    ]),
    ticket('UIG-8', [
      { what: 'a Base UI import is an error naming the part built on it', run: probe("import { Popover } from '@base-ui/react/popover'\nexport const Probe = Popover\n", 'error', '`Popover`') },
      { what: 'createPortal is an error naming the floating parts', run: probe("import { createPortal } from 'react-dom'\nexport const Probe = (to: HTMLElement) => createPortal(<span />, to)\n", 'error', '`DialogShell`') },
      { what: 'a key listener on the whole page is an error, in a .ts file too', run: probe("export function listen() {\n  window.addEventListener('keydown', () => {})\n}\n", 'error', '`DialogShell`', 'src/lib/__gates_probe__.ts') },
      { what: 'arrow keys by hand are an error; Enter in a field is not', run: async () => {
        const arrows = await probe("export const onKeyDown = (e: KeyboardEvent) => e.key === 'ArrowDown'\n", 'error', '`Menu`', 'src/lib/__gates_probe__.ts')()
        if (arrows.result !== 'pass') return arrows
        return probe("export const onKeyDown = (e: KeyboardEvent) => e.key === 'Enter'\n", 'none', undefined, 'src/lib/__gates_probe__.ts')()
      } },
      { what: 'a hand-written role="option" is an error naming Select', run: probe(component('<div role="option" />'), 'error', '`Select`') },
      { what: 'tabIndex={0} on a div is an error; tabIndex={-1} is not', run: async () => {
        const zero = await probe(component('<div tabIndex={0} />'), 'error', '`Button`')()
        if (zero.result !== 'pass') return h.FAIL(`tabIndex={0} is not caught yet, so this proves nothing: ${zero.detail}`)
        return probe(component('<div tabIndex={-1} />'), 'none')()
      } },
      { what: 'overflow-y-auto is an error naming ScrollArea', run: probe(component('<div className="h-64 overflow-y-auto" />'), 'error', '`ScrollArea`') },
      { what: 'an escaped listener is not an error, while the same listener is', run: async () => {
        const raw = await probe("export function listen() {\n  document.addEventListener('mousedown', () => {})\n}\n", 'error', undefined, 'src/lib/__gates_probe__.ts')()
        if (raw.result !== 'pass') return h.FAIL(`a page listener is not caught yet, so this proves nothing: ${raw.detail}`)
        return probe("export function listen() {\n  // @estiva-escape: a probe that keeps its listener on purpose\n  document.addEventListener('mousedown', () => {})\n}\n", 'none', undefined, 'src/lib/__gates_probe__.ts')()
      } },
      { what: 'a real page gets no error', run: realPage },
    ]),
    ticket('UIG-9', [
      { what: 'a border passed into Button is an error naming Button', run: probe(`import { Button } from '@estiva-app/ui'\n${component('<Button className="border">x</Button>')}`, 'error', 'on `Button` changes how it looks') },
      { what: 'placement passed into Button is not', run: probe(`import { Button } from '@estiva-app/ui'\n${component('<Button className="mt-2 w-full flex-1 relative">x</Button>')}`, 'none') },
      { what: 'an escaped look is not an error, while the same look is', run: async () => {
        const raw = await probe(`import { Link } from '@estiva-app/ui'\n${component('<Link href="/x" className="after:absolute after:inset-0">x</Link>')}`, 'error', '`Link`')()
        if (raw.result !== 'pass') return h.FAIL(`a restyled part is not caught yet, so this proves nothing: ${raw.detail}`)
        return probe(`import { Link } from '@estiva-app/ui'\nexport function Probe() {\n  return (\n    // @estiva-escape: a probe that keeps its row link on purpose\n    <Link href="/x" className="after:absolute after:inset-0">x</Link>\n  )\n}\n`, 'none')()
      } },
      { what: 'a real page gets no error', run: realPage },
    ]),
    ticket('UIG-13', [
      { what: 'registry.json is committed and has entries', run: () => h.json(h.exists('registry.json') ? 'registry.json' : at('registry.json'), (d) => ((d as { entries?: unknown[]; components?: unknown[] }).entries ?? (d as { components?: unknown[] }).components ?? []).length > 0, 'registry.json has entries') },
    ]),
    ticket('UIG-19', [
      { what: 'the usage-page contract runs in CI', run: () => h.ci(/[\w:-]*contract[\w:-]*/) },
    ]),
    ticket('UIG-20', [
      { what: 'a committed skill runs ui:find', run: () => (h.listFiles('.claude/skills', (n) => n === 'SKILL.md').some((f) => h.read(f).includes('ui:find')) ? h.PASS('a skill runs ui:find') : h.FAIL('no skill in .claude/skills runs ui:find')) },
    ]),
    ticket('UIG-21', [
      { what: 'path-scoped instructions exist', run: () => (h.listFiles('.claude/rules', (n) => n.endsWith('.md')).some((f) => /^paths:/m.test(h.read(f))) ? h.PASS('.claude/rules has paths: instructions') : h.FAIL('no .claude/rules file with paths:')) },
    ]),
    ticket('UIG-22', [
      { what: 'a hand-made header row is an error naming the header part', run: all(h, headers.map((name) => probe(component(`<section className="flex flex-col"><div className="flex items-center px-3 py-2"><span>${name === 'SectionHeader' ? 'Issues' : 'Folders'}</span></div><div /></section>`), 'error', name)), 'a hand-made header row is an error naming the header part') },
    ]),
    ticket('UIG-23', [
      { what: 'a hand-made empty line is an error naming EmptyState', run: probe("export function Probe({ items }: { items: string[] }) {\n  return <div>{items.length === 0 ? <p className=\"text-text-secondary\">Nothing here</p> : items.map((i) => <span key={i}>{i}</span>)}</div>\n}\n", 'error', 'EmptyState') },
    ]),
    ticket('UIG-24', [
      { what: 'a title= is an error naming WithTooltip', run: probe(`import { Button } from '@estiva-app/ui'\n${component('<Button title="Delete">x</Button>')}`, 'error', 'WithTooltip') },
    ]),
    ticket('UIG-25', [
      { what: "SectionLabel's class list, typed by hand, is a warning", run: probe(component('<span className="text-[10px] uppercase tracking-wide text-text-muted">Label</span>'), 'warning', 'SectionLabel') },
    ]),
    ticket('UIG-27', [
      { what: 'the installed package has Link', run: () => h.contains(installed, /\bLink\b/, 'the installed @estiva-app/ui exports Link') },
      { what: 'the installed package has ProgressBar', run: () => h.contains(installed, /\bProgressBar\b/, 'the installed @estiva-app/ui exports ProgressBar') },
    ]),
    ticket('UIG-28', [
      { what: 'text-[14px] is an error', run: tokenProbe(component('<div className="text-[14px]">x</div>'), 'error') },
      { what: 'a colour in an inline style is an error', run: tokenProbe(component("<div style={{ backgroundColor: '#ff0000' }}>x</div>"), 'error') },
      { what: 'h-[240px] is a warning', run: tokenProbe(component('<div className="h-[240px]">x</div>'), 'warning') },
      { what: 'h-[240px] is not an error', run: tokenProbe(component('<div className="h-[240px]">x</div>'), 'none') },
      { what: 'a hand-written line height behind an arbitrary variant is an error', run: tokenProbe(component('<div className="[&_p]:leading-[1.4]">x</div>'), 'error') },
      { what: 'a raw colour in a class is an error (the pattern that matched nothing, R1)', run: tokenProbe(component('<div className="bg-[#5c69dc]">x</div>'), 'error', 'raw colour') },
      { what: 'a width and height from a prop pass', run: tokenProbe("export function Probe({ size }: { size: number }) {\n  return <div style={{ width: size, height: size }}>x</div>\n}\n", 'none') },
      { what: 'a test file is not checked for hand-written values, while source is', run: all(h, tokenConfigs.map((config) => async () => {
        const code = component("<div className=\"text-[14px]\" style={{ color: 'red' }}>x</div>")
        const source = await probe(code, 'error', undefined, PROBE, config)()
        if (source.result !== 'pass') return h.FAIL(`source is not checked yet, so this proves nothing: ${source.detail}`)
        return probe(code, 'none', undefined, 'src/components/__gates_probe__.test.tsx', config)()
      }), 'a test file is not checked for hand-written values, while source is') },
    ]),
    ticket('UIG-30', [
      { what: 'the installed package has RichText', run: () => h.contains(installed, /\bRichText\b/, 'the installed @estiva-app/ui exports RichText') },
    ]),
    // Katerina's ruling of 17 September (docs/GATES.md §23): one copy, in the package. An app made
    // by create-estiva-app passes this from its first commit; Peek and Ship do once UIG-32 lands.
    ticket('UIG-32', [
      { what: 'the gate pieces come from the package, and no repo keeps a copy', run: all(h, [
        () => h.contains(at('eslint.gates.config.js'), /from '@estiva-app\/ui\/gates'/, 'the gate config imports @estiva-app/ui/gates'),
        () => h.hook('.claude/settings.json', '@estiva-app/ui/dist/gates/cli.js'),
        // `estiva-gates status` where npm can find the command; by path where it cannot,
        // because the install is in the app's folder and the script is in the repo's top one (Ship).
        () => h.contains('package.json', /"gates:status":\s*"[^"]*(?:estiva-gates|@estiva-app\/ui\/dist\/gates\/cli\.js)[^"]*status/, "gates:status runs the package's engine"),
        () => (h.exists('scripts/gates-status.mjs') ? h.FAIL('scripts/gates-status.mjs is a copy of the status engine: run estiva-gates status instead') : h.PASS('no copy of the status engine')),
      ], 'the gate config, the hook and gates:status are the package\'s; no copy of the engine') },
    ]),
  ]
}
