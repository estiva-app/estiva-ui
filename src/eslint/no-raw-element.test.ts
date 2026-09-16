import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noRawElement, RAW_ELEMENT_PARTS, RAW_INPUT_PARTS } from './no-raw-element'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  // A directive for a rule these cases do not load is not what they test.
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

const component = (body: string) => `export function Probe() {\n  return (\n${body}\n  )\n}\n`
const noPart = (element: string) => `@estiva-app/ui has no part for a raw ${element} yet. Do not build one here: ask Katerina, and it gets made in @estiva-app/ui.`

/** Every element the mapping names, drawn the simplest way that makes it a control. */
const withControls: Record<string, string> = { audio: '<audio controls />', video: '<video controls />', img: '<img usemap="#m" alt="" />' }
const mapped = Object.entries(RAW_ELEMENT_PARTS).map(([name, part]) => ({ name, part, code: withControls[name] ?? `<${name} />` }))

tester.run('no-raw-element', noRawElement, {
  valid: [
    { name: "the package's Button", code: component('<Button>Save</Button>') },
    { name: 'a member expression named button', code: component('<Foo.button>Save</Foo.button>') },
    { name: 'a name that starts with button', code: component('<buttonish />') },
    {
      name: 'the elements that are not controls',
      code: component('    <section>\n      <h1>Title</h1>\n      <p>Text <strong>and</strong> <em>more</em></p>\n      <ul><li>One</li></ul>\n      <img src="x.png" alt="" />\n      <hr />\n      <kbd>Enter</kbd>\n      <svg><path d="M0 0" /></svg>\n      <time dateTime="2026-09-16">today</time>\n    </section>'),
    },
    { name: 'a hidden input is data, not a control', code: component('<input type="hidden" name="id" value="1" />') },
    { name: "a summary is reported through its details, not twice", code: component('<Foo>\n<summary>More</summary>\n</Foo>') },
    { name: 'a fieldset and its legend are a frame', code: component('<fieldset><legend>Group</legend></fieldset>') },
    { name: 'an option and a datalist are parts of another control', code: component('<Foo><option value="a">A</option><datalist id="d" /></Foo>') },
    { name: 'a video with no controls is a picture that moves', code: component('<video src="a.mp4" autoPlay muted loop />') },
    { name: 'controls written as false', code: component('<audio src="a.mp3" controls={false} />') },
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
    {
      name: 'an element with no part, escaped',
      code: component('    // @estiva-escape: a map from another service, until the package has a frame\n    <iframe src="https://example.com" title="Map" />'),
    },
  ],
  invalid: [
    { name: 'a raw button', code: component('    <button type="button">x</button>'), errors: [{ messageId: 'raw', line: 3 }] },
    {
      name: 'an opening tag that spans lines (what grep misses)',
      code: component('    <input\n      type="text"\n      value={x}\n    />'),
      errors: [{ messageId: 'raw', line: 3 }],
    },
    {
      name: 'a raw element nested in other elements',
      code: component('    <div>\n      <span>\n        <a href="/x">x</a>\n      </span>\n    </div>'),
      errors: [{ messageId: 'raw', line: 5 }],
    },
    {
      name: "the button's message is UIG-3's, word for word",
      code: component('    <button>x</button>'),
      errors: [{ message: 'Use `Button` from @estiva-app/ui instead of a raw <button>.' }],
    },

    // Every element in the mapping names its part, or says there is none yet.
    ...mapped.map(({ name, part, code }) => ({
      name: part ? `<${name}> names ${part.use}` : `<${name}> has no part yet`,
      code: component(`    ${code}`),
      errors: [{ message: part ? `Use \`${part.use}\` from @estiva-app/ui instead of a raw <${name}>.${part.more ?? ''}` : noPart(`<${name}>`) }],
    })),
    ...Object.entries(RAW_INPUT_PARTS).map(([type, part]) => ({
      name: part ? `<input type="${type}"> names ${part.use}` : `<input type="${type}"> has no part yet`,
      code: component(`    <input type="${type}" />`),
      errors: [{ message: part ? `Use \`${part.use}\` from @estiva-app/ui instead of a raw <input type="${type}">.` : noPart(`<input type="${type}">`) }],
    })),

    { name: 'an input with no type is a text box', code: component('    <input />'), errors: [{ message: 'Use `TextInput` from @estiva-app/ui instead of a raw <input>.' }] },
    { name: 'an email box is a text box', code: component('    <input type="email" />'), errors: [{ message: 'Use `TextInput` from @estiva-app/ui instead of a raw <input>.' }] },
    { name: 'a type the browser does not know is a text box', code: component('    <input type="wibble" />'), errors: [{ message: 'Use `TextInput` from @estiva-app/ui instead of a raw <input>.' }] },
    { name: 'a type written in capitals', code: component('    <input type="CHECKBOX" />'), errors: [{ message: 'Use `Checkbox` from @estiva-app/ui instead of a raw <input type="checkbox">.' }] },
    { name: 'a type in braces', code: component("    <input type={'file'} />"), errors: [{ message: 'Use `FilePicker` from @estiva-app/ui instead of a raw <input type="file">.' }] },
    { name: 'a type in a template with nothing computed', code: component('    <input type={`search`} />'), errors: [{ message: 'Use `SearchInput` from @estiva-app/ui instead of a raw <input type="search">.' }] },
    {
      name: 'a computed type names every input part',
      code: component('    <input type={kind} />'),
      errors: [{ message: 'Use `TextInput` from @estiva-app/ui instead of a raw <input>. For a search, `SearchInput`; for a tick box, `Checkbox`; to pick files, `FilePicker`.' }],
    },
    { name: 'a video with controls', code: component('    <video src="a.mp4" controls={true} />'), errors: [{ message: noPart('<video>') }] },
    { name: 'an image map written the React way', code: component('    <img useMap="#m" alt="" />'), errors: [{ message: noPart('<img>') }] },

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
      code: component('    // eslint-disable-next-line rule-to-test/no-raw-element -- @estiva-escape: a preview drawn from its own palette\n    <button>x</button>'),
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
