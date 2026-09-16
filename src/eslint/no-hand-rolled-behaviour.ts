import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

/**
 * Behaviour Base UI already owns, written by hand inside the package (UIG-5,
 * P1 — the migration's standing rule D6 as a machine).
 *
 * This is the rule with the most to lose. A hand-made portal or a global
 * listener inside `DialogShell` is inherited by every caller in every app, and
 * nobody sees it from there.
 *
 * Two facts, both mechanical, both the signature of a floating part rebuilt by
 * hand:
 *
 * - **`createPortal`**, or importing it from `react-dom`. Base UI's parts carry
 *   their own portal.
 * - **a listener on `window` or `document`** for the events a floating part
 *   lives on — resize, scroll, an outside press, a key. Base UI's Positioner
 *   follows the anchor and its Root closes on an outside press and on Escape.
 *
 * What it deliberately does not try to read: measuring arithmetic. `Popover`
 * hands Base UI a virtual anchor with a `getBoundingClientRect`, which is the
 * documented way to anchor to a rectangle rather than an element, and a rule
 * that guessed at arithmetic would report it. Anything that shape is caught by
 * a reader, not by this.
 *
 * A place that keeps one says why on the line above: `// @estiva-escape: <why>`.
 */
const FLOATING_EVENTS = new Set(['resize', 'scroll', 'mousedown', 'pointerdown', 'keydown', 'keyup', 'focusin', 'focusout', 'click'])

interface Node {
  type: string
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
}

interface Identifier extends Node {
  name: string
}

interface ImportDeclaration extends Node {
  source: { value: unknown }
  specifiers: { type: string; imported?: { name?: string }; local?: { name?: string }; loc?: Rule.Node['loc']; range?: [number, number] }[]
}

interface CallExpression extends Node {
  callee: { type: string; name?: string; object?: { type: string; name?: string }; property?: { type: string; name?: string } }
  arguments: { type: string; value?: unknown }[]
  parent?: { type: string; loc?: Rule.Node['loc']; range?: [number, number]; parent?: CallExpression['parent'] }
}

/**
 * The statement a call sits in, which is what an escape is written above:
 * `return createPortal(…)` puts the call in the middle of its line, and a
 * comment above the line is above the statement.
 */
function statement(node: { loc: NonNullable<Rule.Node['loc']>; range: [number, number]; parent?: CallExpression['parent'] }): {
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
} {
  for (let p = node.parent; p; p = p.parent) {
    if (!/(Statement|Declaration)$/.test(p.type)) continue
    if (p.loc && p.range) return { loc: p.loc, range: p.range }
    break
  }
  return { loc: node.loc, range: node.range }
}

export const noHandRolledBehaviour: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Overlay behaviour written by hand where Base UI has a part (D6)' },
    schema: [],
    messages: {
      portal:
        'A portal written by hand. Base UI\'s parts carry their own (Popover, Menu, Select, Tooltip, Dialog, Toast): use the part, or say why this one stays.',
      listener:
        'A `{{event}}` listener on `{{target}}`. A floating part follows its anchor and closes on an outside press and on Escape by itself (Base UI Positioner and Root): use the part, or say why this one stays.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: Rule.Node) {
        const declaration = node as unknown as ImportDeclaration
        if (declaration.source.value !== 'react-dom') return
        for (const specifier of declaration.specifiers) {
          if (specifier.type !== 'ImportSpecifier' || specifier.imported?.name !== 'createPortal') continue
          // The escape goes above the import line, not above the name inside it.
          if (isEscaped(context, declaration)) return
          context.report({ loc: declaration.loc, messageId: 'portal' })
          return
        }
      },
      CallExpression(node: Rule.Node) {
        const call = node as unknown as CallExpression
        const { callee } = call

        if (callee.type === 'Identifier' && callee.name === 'createPortal') {
          if (isEscaped(context, statement(call))) return
          context.report({ loc: call.loc, messageId: 'portal' })
          return
        }

        if (callee.type !== 'MemberExpression' || callee.property?.name !== 'addEventListener') return
        const target = callee.object?.type === 'Identifier' ? callee.object.name : undefined
        if (target !== 'window' && target !== 'document') return
        const [first] = call.arguments
        const event = first?.type === 'Literal' && typeof first.value === 'string' ? first.value : undefined
        if (!event || !FLOATING_EVENTS.has(event)) return
        if (isEscaped(context, statement(call))) return
        context.report({ loc: call.loc, messageId: 'listener', data: { event, target } })
      },
    }
  },
}
