/// <reference types="node" />
/**
 * The token contract's inline-style check, where a selector cannot reach
 * (the second review's R9, 25 September). `no-restricted-syntax` reads a
 * `style={{ … }}` written in place; a style kept in a `const` and passed by name
 * got through every lint in all three repos:
 *
 *   const look = { background: 'red' }
 *   <div style={look} />
 *
 * This follows the name to its `const` in the same file and reads the keys
 * there, quoted or not. It reports on the key, where the value is written, so
 * an escape sits beside it. A style the code works out while it runs passes:
 * nothing can read it.
 */
import type { ESLint, Rule, Scope } from 'eslint'

/** The style keys outside the token contract: colours, a font size, borders and shadows. */
export const INLINE_STYLE_TOKEN_KEYS = /^(color|background|backgroundColor|backgroundImage|fill|stroke|fontSize|border|borderTop|borderRight|borderBottom|borderLeft|borderBlock|borderInline|borderStyle|boxShadow|textShadow)$|Color$/

export const INLINE_STYLE_MESSAGE =
  'An inline style that sets a colour, a font size, a border or a shadow is outside the token contract: use a token class. If the value is computed (a palette, a size from a prop), say why in an eslint-disable comment. Width, height and transforms are fine.'

interface Node {
  type: string
  [key: string]: unknown
}

const keyOf = (property: Node): string | undefined => {
  if (property.computed) return undefined
  const key = property.key as Node
  return key.type === 'Identifier' ? (key.name as string) : key.type === 'Literal' && typeof key.value === 'string' ? key.value : undefined
}

/** The object a `const` of this name holds, in this scope or one around it. */
function constObject(name: string, scope: Scope.Scope | null): Node | undefined {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name)
    if (!variable) continue
    const definition = variable.defs[0] as unknown as { type: string; node: Node; parent?: Node } | undefined
    if (variable.defs.length !== 1 || definition?.type !== 'Variable' || definition.parent?.kind !== 'const') return undefined
    let init = definition.node.init as Node | undefined
    while (init && (init.type === 'TSAsExpression' || init.type === 'TSSatisfiesExpression')) init = init.expression as Node
    return init?.type === 'ObjectExpression' ? init : undefined
  }
  return undefined
}

const noTokenStyle: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'No colour, font size, border or shadow in a style kept in a const' },
    schema: [],
    messages: { token: INLINE_STYLE_MESSAGE },
  },
  create(context) {
    const reported = new Set<unknown>()
    return {
      JSXAttribute(ruleNode: Rule.Node) {
        const attribute = ruleNode as unknown as Node
        if ((attribute.name as Node).name !== 'style') return
        const value = attribute.value as Node | null
        const expression = value?.type === 'JSXExpressionContainer' ? (value.expression as Node) : undefined
        if (expression?.type !== 'Identifier') return
        const object = constObject(expression.name as string, context.sourceCode.getScope(ruleNode))
        for (const property of (object?.properties as Node[] | undefined) ?? []) {
          if (property.type !== 'Property' || reported.has(property)) continue
          const key = keyOf(property)
          if (!key || !INLINE_STYLE_TOKEN_KEYS.test(key)) continue
          reported.add(property)
          context.report({ node: property as unknown as Rule.Node, messageId: 'token' })
        }
      },
    }
  },
}

/** The plugin, as the token lint registers it: `token-style/no-token-style`. */
export const tokenStylePlugin: ESLint.Plugin = { rules: { 'no-token-style': noTokenStyle } }
