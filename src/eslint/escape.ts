import type { AST, Rule } from 'eslint'

/**
 * The escape marker (UIG-3, seam S4 in docs/GATES.md §16): one written reason
 * why one element stays as it is.
 *
 * A line comment directly above the element, naming the rule it keeps off,
 *
 *     // @estiva-escape(no-raw-element): <reason>
 *
 * or, where the element is a JSX child, the JSX comment on the line above,
 *
 *     {/* @estiva-escape(no-raw-element): <reason> *\/}
 *
 * with at least ten characters of reason, spaces not counted. It escapes only
 * the rules it names (Katerina's ruling B3, 25 September: one reason used to
 * switch off every rule on the element, so a raw button that also wrote a
 * dialog's role by hand passed under one reason). Two rules on one element are
 * named together, `@estiva-escape(no-raw-element, no-rebuilt-behaviour)`, each
 * on purpose. A marker that names no rule escapes nothing, and says which name
 * to write.
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
  escapeWithoutReason: `An escape needs its reason, at least ${MIN_REASON} characters: \`// ${ESCAPE_MARKER}({{rule}}): <why this stays>\`. An escape with no reason hides nothing.`,
  escapeInDirective: `Write the escape as its own comment on the line above: \`// ${ESCAPE_MARKER}({{rule}}): <reason>\`. Inside an eslint-disable comment it switches the rule off instead of recording why.`,
  escapeWithoutRule: `Name the rule this escape keeps off: \`${ESCAPE_MARKER}({{rule}}): <reason>\`. An escape now keeps off only the rules it names.`,
  escaped: 'Escaped: {{reason}}',
} as const

/** A rule's name as a marker writes it: `no-raw-element` for `estiva/no-raw-element`. */
export const shortRuleName = (id: string) => id.slice(id.lastIndexOf('/') + 1)

/**
 * What a marker says, read from a comment's text: the rules it names (none when
 * it names none) and its reason. Null when the comment carries no marker.
 */
export function readMarker(text: string): { rules: string[]; reason: string } | null {
  const at = text.indexOf(ESCAPE_MARKER)
  if (at === -1) return null
  const rest = text.slice(at + ESCAPE_MARKER.length)
  const named = /^\s*\(([^)]*)\)/.exec(rest)
  const rules = named ? named[1].split(/[\s,]+/).filter(Boolean).map(shortRuleName) : []
  const reason = (named ? rest.slice(named[0].length) : rest).replace(/^\s*:/, '').trim()
  return { rules, reason }
}

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

  const marker = readMarker(comment.value)
  if (!marker) return false
  const rule = shortRuleName(context.id)

  const directive = DIRECTIVE.exec(comment.value)
  if (directive) {
    const rules = directiveRules(directive[1])
    // A directive for other rules (the token lint's notes) is not an escape of this one.
    if (rules.length > 0 && !rules.includes(context.id)) return false
    context.report({ loc: comment.loc, messageId: 'escapeInDirective', data: { rule } })
    return false
  }

  // Named, but not this rule: another rule on the element may be the one it keeps off.
  if (marker.rules.length > 0 && !marker.rules.includes(rule)) return false
  if (marker.rules.length === 0) {
    context.report({ loc: comment.loc, messageId: 'escapeWithoutRule', data: { rule } })
    return false
  }

  const { reason } = marker
  if (reason.replace(/\s/g, '').length < MIN_REASON) {
    context.report({ loc: comment.loc, messageId: 'escapeWithoutReason', data: { rule } })
    return false
  }

  const settings = context.settings[SETTINGS_KEY] as EstivaSettings | undefined
  if (settings?.reportEscapes) context.report({ loc: comment.loc, messageId: 'escaped', data: { reason } })
  return true
}
