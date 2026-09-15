import type { AST, Rule } from 'eslint'

/**
 * The escape marker (UIG-3, seam S4 in docs/GATES.md §16): one written reason
 * why one element stays as it is.
 *
 * A line comment directly above the element,
 *
 *     // @estiva-escape: <reason>
 *
 * or, where the element is a JSX child, the JSX comment on the line above,
 *
 *     {/* @estiva-escape: <reason> *\/}
 *
 * with at least ten characters of reason, spaces not counted.
 *
 * Not `eslint-disable`. A directive switches a rule off without saying it was
 * meant, and the count of escapes (`.gates-count.json`) could not see it. A
 * marker written inside a directive that switches one of these rules off is
 * reported for that reason.
 *
 * The token lint's older notes (`eslint-disable-next-line <rule> -- @estiva-escape:
 * <reason>`, Katerina's ruling A2 of 15 September) are not read here: they
 * escape the token lint's rules, which are not this plugin's, and they stay as
 * they are (Katerina, 15 September).
 */
export const ESCAPE_MARKER = '@estiva-escape'

/** Characters of reason, spaces not counted. */
export const MIN_REASON = 10

/** The key under ESLint's `settings` this plugin reads. */
export const SETTINGS_KEY = 'estiva'

/**
 * Every rule spreads these into its `meta.messages`, because `isEscaped`
 * reports through the rule that called it.
 */
export const ESCAPE_MESSAGES = {
  escapeWithoutReason: `An escape needs its reason, at least ${MIN_REASON} characters: \`// ${ESCAPE_MARKER}: <why this stays>\`. An escape with no reason hides nothing.`,
  escapeInDirective: `Write the escape as its own comment on the line above: \`// ${ESCAPE_MARKER}: <reason>\`. Inside an eslint-disable comment it switches the rule off instead of recording why.`,
  escaped: 'Escaped: {{reason}}',
} as const

export interface EstivaSettings {
  /**
   * Report every sanctioned escape as a message with the id `escaped`, so a
   * count can read them. Off in the lint anyone runs; on only in the count.
   */
  reportEscapes?: boolean
}

interface Located {
  loc?: AST.SourceLocation | null
  range?: [number, number]
}

const DIRECTIVE = /^\s*eslint-disable(?:-next-line|-line)?(?=\s|$)([^]*)$/

/** The rules a directive names: what comes before its ` -- ` description. None means every rule. */
function directiveRules(rest: string): string[] {
  const dashes = rest.search(/(?:^|\s)--(?:\s|$)/)
  return (dashes === -1 ? rest : rest.slice(0, dashes)).split(/[\s,]+/).filter(Boolean)
}

/** Only spaces and a JSX expression's closing brace between the marker and the element. */
const BETWEEN = /^[\s}]*$/

/**
 * Whether the element at `node` carries a valid escape on the line above.
 *
 * Every rule of this plugin calls it before it reports. It reports, through
 * that rule, a marker with too short a reason and a marker inside an
 * eslint-disable directive for this rule; either way the element is not
 * escaped, so the rule reports it too.
 */
export function isEscaped(context: Rule.RuleContext, node: Located): boolean {
  const { sourceCode } = context
  if (!node.loc || !node.range) return false
  const line = node.loc.start.line
  const nodeStart = node.range[0]

  const comment = sourceCode
    .getAllComments()
    .find((c) => c.loc && c.range && c.loc.end.line === line - 1 && BETWEEN.test(sourceCode.text.slice(c.range[1], nodeStart)))
  if (!comment?.loc) return false

  const at = comment.value.indexOf(ESCAPE_MARKER)
  if (at === -1) return false

  const directive = DIRECTIVE.exec(comment.value)
  if (directive) {
    const rules = directiveRules(directive[1])
    // A directive for other rules (the token lint's notes) is not an escape of this one.
    if (rules.length > 0 && !rules.includes(context.id)) return false
    context.report({ loc: comment.loc, messageId: 'escapeInDirective' })
    return false
  }

  const reason = comment.value
    .slice(at + ESCAPE_MARKER.length)
    .replace(/^:/, '')
    .trim()
  if (reason.replace(/\s/g, '').length < MIN_REASON) {
    context.report({ loc: comment.loc, messageId: 'escapeWithoutReason' })
    return false
  }

  const settings = context.settings[SETTINGS_KEY] as EstivaSettings | undefined
  if (settings?.reportEscapes) context.report({ loc: comment.loc, messageId: 'escaped', data: { reason } })
  return true
}
