import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noHandRolledBehaviour } from './no-hand-rolled-behaviour'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

tester.run('no-hand-rolled-behaviour', noHandRolledBehaviour, {
  valid: [
    { name: 'a Base UI part doing its own portalling', code: "import { Popover } from '@base-ui/react/popover'\nexport const Probe = () => <Popover.Portal />\n" },
    {
      name: "a virtual anchor handed to Base UI, as Popover's",
      code: 'export function probe(rect: DOMRect) {\n  return { getBoundingClientRect: () => rect }\n}\n',
    },
    {
      name: "an element's own handler, which is not a global listener",
      code: 'export function probe(el: HTMLElement) {\n  el.addEventListener("keydown", () => {})\n}\n',
    },
    {
      name: 'a listener for something no floating part owns',
      code: 'export function probe() {\n  window.addEventListener("online", () => {})\n}\n',
    },
    {
      name: 'the import of a portal, kept with its reason',
      code: "// @estiva-escape(no-hand-rolled-behaviour): the toast keeps its own portal until migration stage 6\nimport { createPortal } from 'react-dom'\nexport const Probe = () => null\n",
    },
    {
      name: 'the call, kept with its reason',
      code: 'export function probe(to: HTMLElement) {\n  // @estiva-escape(no-hand-rolled-behaviour): the toast keeps its own portal until migration stage 6\n  return createPortal(null, to)\n}\n',
    },
    {
      name: 'a global listener kept with its reason',
      code: 'export function probe() {\n  // @estiva-escape(no-hand-rolled-behaviour): the frame measures the window, which no floating part owns\n  window.addEventListener("resize", () => {})\n}\n',
    },
    { name: "the package's ScrollArea, its cap on the viewport", code: 'export const Probe = () => <ScrollArea viewportClassName="max-h-[50vh]" />\n' },
    { name: 'a box that clips, which draws no bar', code: 'export const Probe = () => <div className="overflow-hidden" />\n' },
    { name: 'the class named in a comment', code: '// a hand-made overflow-y-auto box never scrolled\nexport const Probe = () => null\n' },
    {
      name: 'a scroll class kept with its reason',
      code: "// @estiva-escape(no-hand-rolled-behaviour): a probe that keeps the browser bar on purpose\nexport const PROBE_CLASSES = 'overflow-y-auto'\n",
    },
  ],
  invalid: [
    {
      name: 'importing createPortal',
      code: "import { createPortal } from 'react-dom'\nexport const Probe = () => null\n",
      errors: [{ messageId: 'portal' }],
    },
    {
      name: 'calling createPortal',
      code: 'export function probe(to: HTMLElement) {\n  return createPortal(null, to)\n}\n',
      errors: [{ messageId: 'portal' }],
    },
    {
      name: 'following the anchor by hand',
      code: 'export function probe() {\n  window.addEventListener("scroll", () => {})\n}\n',
      errors: [{ messageId: 'listener', data: { event: 'scroll', target: 'window' } }],
    },
    {
      name: 'closing on an outside press by hand',
      code: 'export function probe() {\n  document.addEventListener("mousedown", () => {})\n}\n',
      errors: [{ messageId: 'listener', data: { event: 'mousedown', target: 'document' } }],
    },
    {
      name: 'closing on Escape by hand',
      code: 'export function probe() {\n  document.addEventListener("keydown", () => {})\n}\n',
      errors: [{ messageId: 'listener', data: { event: 'keydown', target: 'document' } }],
    },
    {
      name: "the comment box's long draft, as the review of 0.83 found it",
      code: "export const COMPOSE_EDITOR_CLASSES = 'outline-none max-h-[50vh] overflow-y-auto'\n",
      errors: [{ messageId: 'scroll', data: { what: 'overflow-y-auto' } }],
    },
    {
      name: 'a scroll class in a className, behind a variant',
      code: 'export const Probe = () => <div className="[&_pre]:overflow-x-auto" />\n',
      errors: [{ messageId: 'scroll', data: { what: '[&_pre]:overflow-x-auto' } }],
    },
    {
      name: 'a scroll class in a template',
      code: 'export const probe = (h: string) => `max-h-${h} overflow-auto`\n',
      errors: [{ messageId: 'scroll', data: { what: 'overflow-auto' } }],
    },
    {
      name: 'a style that scrolls',
      code: "export const Probe = () => <div style={{ overflowY: 'scroll' }} />\n",
      errors: [{ messageId: 'scroll', data: { what: "overflowY: 'scroll'" } }],
    },
  ],
})
