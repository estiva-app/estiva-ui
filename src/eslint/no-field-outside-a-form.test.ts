import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, it } from 'vitest'
import { noFieldOutsideAForm } from './no-field-outside-a-form'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/** An app on disk, so the app's re-exports are followed to their part, as Peek's are. */
const root = mkdtempSync(join(tmpdir(), 'no-field-outside-a-form-'))
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
write('app/package.json', '{ "name": "app" }')
write('app/src/components/ui/Field.tsx', "export { Field } from '@estiva-app/ui'\n")
write('app/src/components/ui/Textarea.tsx', "export { Textarea } from '@estiva-app/ui'\n")
write('app/src/components/ui/ConfirmDialog.tsx', "export { ConfirmDialog } from '@estiva-app/ui'\n")
const app = join(root, 'app/src/Probe.tsx')

const ui = (...parts: string[]) => `import { ${parts.join(', ')} } from '@estiva-app/ui'\n`
const component = (body: string, imports = '') => `${imports}export function Probe({ text, set }: { text: string; set: (v: string) => void }) {\n  return (\n${body}\n  )\n}\n`
const loose = (part: string) => [{ messageId: 'loose', data: { part } }]

tester.run('no-field-outside-a-form', noFieldOutsideAForm, {
  valid: [
    {
      name: "Peek's ResolveDialog: a DialogShell with a Form",
      code: component('<DialogShell title="Resolve" onClose={() => {}}>\n<Form onSubmit={() => {}}>\n<Field label="Message"><Textarea value={text} onChange={(e) => set(e.target.value)} /></Field>\n</Form>\n</DialogShell>', ui('DialogShell', 'Form', 'Field', 'Textarea')),
    },
    { name: 'a one-line field with its button', code: component('<Form onSubmit={() => {}}><TextInput value={text} onChange={(e) => set(e.target.value)} /></Form>', ui('Form', 'TextInput')) },
    { name: 'fields drawn from a list, inside the form', code: component("<Form onSubmit={() => {}}>{['a', 'b'].map((k) => <Field key={k} label={k}><TextInput value={text} /></Field>)}</Form>", ui('Form', 'Field', 'TextInput')) },
    { name: "the palette's form level is a Form (UIG-29)", code: component('<CommandPaletteForm submitLabel="Create" onSubmit={() => {}}><Field label="Title"><TextInput value={text} /></Field></CommandPaletteForm>', ui('CommandPaletteForm', 'Field', 'TextInput')) },
    { name: 'a field that saves itself as you leave it', code: component('<EditableText value={text} onCommit={set} />', ui('EditableText')) },
    { name: 'a field that filters a list', code: component('<SearchInput value={text} onChange={set} />', ui('SearchInput')) },
    {
      name: "a control handed to a Field from a function of its own: the Field is judged (Peek's ActionFormPanel)",
      code: `${ui('Field', 'TextInput')}const control = (text: string) => <TextInput value={text} />\nexport function Probe({ text }: { text: string }) {\n  return (\n<>\n{/* @estiva-escape(no-field-outside-a-form): the launcher's CommandPaletteForm holds these fields */}\n<Field label="Title">{control(text)}</Field>\n</>\n  )\n}\n`,
    },
    { name: "the app's own component is its own business", code: component('<ResolutionField value={text} />', "import { ResolutionField } from './ResolutionField'\n") },
    { name: 'an escape with its reason', code: component('<>\n{/* @estiva-escape(no-field-outside-a-form): the caller wraps this in its Form, in StartTopicDialog */}\n<Field label="Title"><TextInput value={text} /></Field>\n</>', ui('Field', 'TextInput')) },
  ],
  invalid: [
    {
      name: "Peek's ArchiveDialog at peek 3c4b799: a resolution in a ConfirmDialog",
      filename: app,
      code: component('<ConfirmDialog title="Archive?" confirmLabel="Archive topic" onClose={() => {}} onConfirm={() => {}}>\n<p>This hides the topic.</p>\n<Field label="Resolution (optional)">\n<Textarea value={text} rows={3} onChange={(e) => set(e.target.value)} />\n</Field>\n</ConfirmDialog>', "import { ConfirmDialog } from '@/components/ui/ConfirmDialog'\nimport { Field } from '@/components/ui/Field'\nimport { Textarea } from '@/components/ui/Textarea'\n"),
      errors: loose('Field'),
    },
    { name: 'a bare text input with no form', code: component('<TextInput value={text} onChange={(e) => set(e.target.value)} />', ui('TextInput')), errors: loose('TextInput') },
    { name: 'a textarea in a DialogShell with no form', code: component('<DialogShell title="Note" onClose={() => {}}><Textarea value={text} /></DialogShell>', ui('DialogShell', 'Textarea')), errors: loose('Textarea') },
    { name: 'an escape with no reason is not an escape', code: component('<>\n{/* @estiva-escape(no-field-outside-a-form) */}\n<Field label="Title"><TextInput value={text} /></Field>\n</>', ui('Field', 'TextInput')), errors: [{ messageId: 'escapeWithoutReason' }, ...loose('Field')] },
  ],
})
