import { existsSync } from 'node:fs'
import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

/**
 * A component of the package with no page, and one with no story (UIG-5, P2 and
 * P3).
 *
 * A component nobody can read about is a component nobody uses correctly, and
 * one nobody can look at is one nobody reviews. Both were at zero when these
 * were switched on; they are here so the next component cannot arrive without
 * them.
 *
 * The pair is by file name, beside the component, which is how this package is
 * laid out: `Button.tsx`, `Button.mdx`, `Button.stories.tsx`, `Button.test.tsx`
 * side by side in `src/`.
 *
 * **The false positive to avoid** (UIG-1 confirmed it is real): `FieldLine` and
 * `MenuItem` have a page and a story but no `.tsx` of their own — they are
 * exported from a sibling. These rules read a component file and ask for its
 * page and its story, never the other way round, so a page without a component
 * is not this rule's business.
 *
 * A file that stays without one says why at its top: `// @estiva-escape: <why>`.
 */
interface ProgramNode {
  body: { loc?: Rule.Node['loc']; range?: [number, number] }[]
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
}

/** A component file: a `.tsx` in the package's source that is not a story or a test. */
function componentFile(filename: string): boolean {
  return filename.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(filename)
}

function sibling(filename: string, extension: string): string {
  return filename.replace(/\.tsx$/, extension)
}

/**
 * Report on the file's first statement, so the escape is a comment at the top of
 * the file — the only place a reason for a missing page could go.
 */
function reportOnFile(context: Rule.RuleContext, program: ProgramNode, messageId: string, data: Record<string, string>): void {
  const anchor = program.body[0] ?? program
  if (anchor.loc && anchor.range && isEscaped(context, { loc: anchor.loc, range: anchor.range })) return
  context.report({ loc: anchor.loc ?? program.loc, messageId, data })
}

export const componentHasAPage: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Every component of the package has a usage page beside it' },
    schema: [],
    messages: {
      missing: '{{name}} has no page. Write {{page}} beside it — what it is, when, when not, how, and what it owns — or say why not at the top of the file.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename
        if (!componentFile(filename)) return
        const page = sibling(filename, '.mdx')
        if (existsSync(page)) return
        const name = filename.split(/[\\/]/).pop() ?? filename
        reportOnFile(context, node as unknown as ProgramNode, 'missing', { name, page: page.split(/[\\/]/).pop() ?? page })
      },
    }
  },
}

export const componentHasAStory: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Every component of the package has a story beside it' },
    schema: [],
    messages: {
      missing: '{{name}} has no story. Write {{story}} beside it, so it can be seen and reviewed, or say why not at the top of the file.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename
        if (!componentFile(filename)) return
        const story = sibling(filename, '.stories.tsx')
        if (existsSync(story)) return
        const name = filename.split(/[\\/]/).pop() ?? filename
        reportOnFile(context, node as unknown as ProgramNode, 'missing', { name, story: story.split(/[\\/]/).pop() ?? story })
      },
    }
  },
}
