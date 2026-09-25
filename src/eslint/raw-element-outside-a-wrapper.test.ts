import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { rawElementOutsideAWrapper } from './raw-element-outside-a-wrapper'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

const component = (body: string) => `export function Probe() {\n  return (\n${body}\n  )\n}\n`

tester.run('raw-element-outside-a-wrapper', rawElementOutsideAWrapper, {
  valid: [
    // The two shapes the package is built out of.
    { name: "the component's own outermost element, as NavItem is an <a>", code: component('    <a href="/x">Issues</a>') },
    { name: "the component's own element with children inside it", code: component('    <a href="/x">\n      <span>Issues</span>\n    </a>') },
    {
      name: 'either branch of a component that returns one element or another, as EditableText does',
      code: 'export function Probe({ editing }: { editing: boolean }) {\n  if (editing) return <input aria-label="x" />\n  return <button type="button">x</button>\n}\n',
    },
    {
      name: 'handed to a Base UI render prop, as Menu.Item does',
      code: component('    <BaseMenu.Item render={<button type="button" />} className="row" />'),
    },
    {
      name: 'handed to a render prop while nested, as a part inside a part',
      code: component('    <BaseMenu.Positioner>\n      <BaseMenu.Item render={<button type="button" />} />\n    </BaseMenu.Positioner>'),
    },
    { name: 'a component, not an element', code: component('    <div>\n      <Button>Save</Button>\n    </div>') },
    { name: 'layout inside a component', code: component('    <div>\n      <span>Issues</span>\n    </div>') },
    {
      name: 'a nested element with its reason on the line above',
      code: component('    <div>\n      {/* @estiva-escape(raw-element-outside-a-wrapper): the trail is one line of text and an anchor keeps it */}\n      <a href="/x">Issues</a>\n    </div>'),
    },
  ],
  invalid: [
    {
      name: 'an anchor buried in a component, as the breadcrumb trail had',
      code: component('    <div>\n      <a href="/x">Issues</a>\n    </div>'),
      errors: [{ messageId: 'nested', data: { name: 'a' } }],
    },
    {
      name: 'a button buried in a component, as the toast had',
      code: component('    <div>\n      <p>Saved</p>\n      <button type="button">Undo</button>\n    </div>'),
      errors: [{ messageId: 'nested', data: { name: 'button' } }],
    },
    {
      name: 'inside a fragment, which is several children rather than one element',
      code: component('    <>\n      <span>x</span>\n      <input aria-label="x" />\n    </>'),
      errors: [{ messageId: 'nested', data: { name: 'input' } }],
    },
    {
      name: 'inside a component of the package, which is not a render prop',
      code: component('    <Card>\n      <button type="button">x</button>\n    </Card>'),
      errors: [{ messageId: 'nested', data: { name: 'button' } }],
    },
    {
      name: 'nested inside an element that was itself handed to a render prop',
      code: component('    <BaseMenu.Item render={<div><button type="button" /></div>} />'),
      errors: [{ messageId: 'nested', data: { name: 'button' } }],
    },
    {
      name: 'a reason too short to be a reason',
      code: component('    <div>\n      {/* @estiva-escape(raw-element-outside-a-wrapper): short */}\n      <a href="/x">Issues</a>\n    </div>'),
      errors: [{ messageId: 'escapeWithoutReason' }, { messageId: 'nested', data: { name: 'a' } }],
    },
    {
      name: 'an eslint-disable instead of a reason',
      // The tester runs the rule under its bare name; in a real lint the plugin
      // prefixes it, and `isEscaped` compares against whichever the rule has.
      code: component('    <div>\n      {/* eslint-disable-next-line rule-to-test/raw-element-outside-a-wrapper -- @estiva-escape(raw-element-outside-a-wrapper): the trail keeps its anchor */}\n      <a href="/x">Issues</a>\n    </div>'),
      // The directive silences the rule's own report, which is exactly why it is
      // refused: `countGates` sees the silenced report and the gate fails on it.
      errors: [{ messageId: 'escapeInDirective' }],
    },
  ],
})
