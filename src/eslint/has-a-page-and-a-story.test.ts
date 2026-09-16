import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RuleTester } from 'eslint'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { componentHasAPage, componentHasAStory } from './has-a-page-and-a-story'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/** Real files of this package, so the rules are tested against what they read. */
const src = (name: string) => fileURLToPath(new URL(`../${name}`, import.meta.url))
const code = 'export function Probe() {\n  return null\n}\n'
const escaped = '// @estiva-escape: a probe file that documents itself in its own page\nexport function Probe() {\n  return null\n}\n'

describe('the files these rules read', () => {
  it('Button has a page and a story beside it, and FieldLine and MenuItem have both without a component file', () => {
    expect(existsSync(src('Button.mdx'))).toBe(true)
    expect(existsSync(src('Button.stories.tsx'))).toBe(true)
    for (const name of ['FieldLine', 'MenuItem']) {
      expect(existsSync(src(`${name}.mdx`))).toBe(true)
      expect(existsSync(src(`${name}.stories.tsx`))).toBe(true)
      // The false positive to avoid: no component file of their own.
      expect(existsSync(src(`${name}.tsx`))).toBe(false)
    }
  })
})

tester.run('component-has-a-page', componentHasAPage, {
  valid: [
    { name: 'a component with its page beside it', code, filename: src('Button.tsx') },
    { name: 'a story file, which needs no page of its own', code, filename: src('Button.stories.tsx') },
    { name: 'a test file', code, filename: src('Button.test.tsx') },
    { name: 'a file that is not a component file at all', code, filename: src('index.ts') },
    { name: 'a component with its reason at the top', code: escaped, filename: src('NoPageProbe.tsx') },
  ],
  invalid: [
    { name: 'a component with no page', code, filename: src('NoPageProbe.tsx'), errors: [{ messageId: 'missing' }] },
  ],
})

tester.run('component-has-a-story', componentHasAStory, {
  valid: [
    { name: 'a component with its story beside it', code, filename: src('Button.tsx') },
    { name: 'a story file, which is not itself a component', code, filename: src('Button.stories.tsx') },
    { name: 'a component with its reason at the top', code: escaped, filename: src('NoStoryProbe.tsx') },
  ],
  invalid: [
    { name: 'a component with no story', code, filename: src('NoStoryProbe.tsx'), errors: [{ messageId: 'missing' }] },
  ],
})
