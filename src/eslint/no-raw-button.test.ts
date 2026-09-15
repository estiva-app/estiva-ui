import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noRawButton } from './no-raw-button'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  // A directive for a rule these cases do not load is not what they test.
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

const component = (body: string) => `export function Probe() {\n  return (\n${body}\n  )\n}\n`

tester.run('no-raw-button', noRawButton, {
  valid: [
    { name: "the package's Button", code: component('<Button>Save</Button>') },
    { name: 'a member expression named button', code: component('<Foo.button>Save</Foo.button>') },
    { name: 'a name that starts with button', code: component('<buttonish />') },
    {
      name: 'a line comment escape directly above',
      code: component('    // @estiva-escape: a preview drawn from its own palette\n    <button type="button">x</button>'),
    },
    {
      name: 'a JSX comment escape on the line above a child',
      code: component('    <div>\n      {/* @estiva-escape: a preview drawn from its own palette */}\n      <button type="button">x</button>\n    </div>'),
    },
    {
      name: 'a JSX comment escape over several lines',
      code: component('    <div>\n      {/*\n        @estiva-escape: a preview drawn from its own palette\n      */}\n      <button type="button">x</button>\n    </div>'),
    },
    {
      name: 'an escape above an opening tag that spans lines',
      code: component('    // @estiva-escape: a preview drawn from its own palette\n    <button\n      type="button"\n      onClick={() => {}}\n    >\n      x\n    </button>'),
    },
    {
      name: 'exactly ten characters of reason, spaces not counted',
      code: component('    // @estiva-escape: ab cd ef gh ij\n    <button>x</button>'),
    },
  ],
  invalid: [
    { name: 'a raw button', code: component('    <button type="button">x</button>'), errors: [{ messageId: 'raw', line: 3 }] },
    { name: 'a self-closing raw button', code: component('    <button />'), errors: [{ messageId: 'raw' }] },
    {
      name: 'an opening tag that spans lines (what grep misses)',
      code: component('    <button\n      type="button"\n    >\n      x\n    </button>'),
      errors: [{ messageId: 'raw', line: 3 }],
    },
    {
      name: 'a raw button nested in other elements',
      code: component('    <div>\n      <span>\n        <button>x</button>\n      </span>\n    </div>'),
      errors: [{ messageId: 'raw', line: 5 }],
    },
    {
      name: 'the message names the component',
      code: component('    <button>x</button>'),
      errors: [{ message: 'Use `Button` from @estiva-app/ui instead of a raw <button>.' }],
    },
    {
      name: 'an escape with no reason is an error, and hides nothing',
      code: component('    // @estiva-escape:\n    <button>x</button>'),
      errors: [
        { messageId: 'escapeWithoutReason', line: 3 },
        { messageId: 'raw', line: 4 },
      ],
    },
    {
      name: 'nine characters of reason is too short',
      code: component('    <div>\n      {/* @estiva-escape: ab cd ef gh i */}\n      <button>x</button>\n    </div>'),
      errors: [{ messageId: 'escapeWithoutReason' }, { messageId: 'raw' }],
    },
    {
      name: 'a marker with no colon and no reason',
      code: component('    // @estiva-escape\n    <button>x</button>'),
      errors: [{ messageId: 'escapeWithoutReason' }, { messageId: 'raw' }],
    },
    {
      name: 'an escape two lines above does not reach the element',
      code: component('    // @estiva-escape: a preview drawn from its own palette\n\n    <button>x</button>'),
      errors: [{ messageId: 'raw', line: 5 }],
    },
    {
      name: 'an escape above a sibling does not reach the next element',
      code: component('    <div>\n      {/* @estiva-escape: a preview drawn from its own palette */}\n      <span />\n      <button>x</button>\n    </div>'),
      errors: [{ messageId: 'raw', line: 6 }],
    },
    {
      name: 'a free comment is not an escape',
      code: component('    // a raw button, on purpose\n    <button>x</button>'),
      errors: [{ messageId: 'raw' }],
    },
    {
      name: 'a marker inside a directive that switches every rule off is refused',
      code: component('    // eslint-disable-next-line -- @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'),
      // The directive silences the element's own report; the refusal sits on the directive's line.
      errors: [{ messageId: 'escapeInDirective', line: 3 }],
    },
    {
      name: 'a marker inside a directive that names this rule is refused',
      code: component('    // eslint-disable-next-line rule-to-test/no-raw-button -- @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'),
      errors: [{ messageId: 'escapeInDirective', line: 3 }],
    },
    {
      name: "the token lint's note for another rule is not an escape of this one",
      code: component('    // eslint-disable-next-line no-console -- @estiva-escape: its hand-written type waits for that\n    <button>x</button>'),
      errors: [{ messageId: 'raw', line: 4 }],
    },
    {
      name: 'with reportEscapes on, a sanctioned escape is reported for the count',
      code: component('    // @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'),
      settings: { estiva: { reportEscapes: true } },
      errors: [{ messageId: 'escaped', data: { reason: 'a preview drawn from its own palette' }, line: 3 }],
    },
  ],
})
