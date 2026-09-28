/**
 * The token contract, read inside a class list joined by hand (UIG-42):
 *
 *   <div className={['text-sm', open && 'bg-gray-100'].join(' ')} />
 *
 * The Tailwind plugin stops at a function call, so it never reads the list in
 * front of `.join(' ')`, and no setting can make it: a call it is told about is
 * read at its arguments, which here is the `' '`. This rule reads the list and
 * tests each class against the same patterns, with the same messages, as the
 * rule it stands in for. It registers once per rule it mirrors, so an error
 * stays an error and a warning a warning (`token-joined/classes`, `/values`,
 * `/spacing`).
 *
 * A list joined with anything but one space is not a class list, and a
 * sentence built this way passes unless one of its words is itself such a
 * class, as in `'set text-sm here'`. Only strings written in the list are
 * read, directly or behind `cond && …`, `a ? … : …` and a template's fixed
 * parts; a list worked out while it runs cannot be read.
 */
import type { ESLint, Rule } from 'eslint'

/** One pattern and its message, the shape `no-restricted-classes` takes. `$0` is the class. */
export interface Restriction {
  pattern: string
  message: string
}

interface Node {
  type: string
  [key: string]: unknown
}

const isOneSpace = (node: Node | undefined) => node?.type === 'Literal' && node.value === ' '

/** `.join` on a list, through any `.filter(…)` between them. */
function joinedList(call: Node): Node | undefined {
  const callee = call.callee as Node
  if (callee.type !== 'MemberExpression' || callee.computed || (callee.property as Node).name !== 'join') return undefined
  if ((call.arguments as Node[]).length !== 1 || !isOneSpace((call.arguments as Node[])[0])) return undefined
  let list = callee.object as Node
  while (list.type === 'CallExpression' && (list.callee as Node).type === 'MemberExpression' && ((list.callee as Node).property as Node).name === 'filter') {
    list = (list.callee as Node).object as Node
  }
  return list.type === 'ArrayExpression' ? list : undefined
}

/** The strings written in one item of the list, each with the node an escape sits above. */
function stringsIn(node: Node | null, out: { node: Node; text: string }[] = []) {
  if (!node) return out
  if (node.type === 'Literal' && typeof node.value === 'string') out.push({ node, text: node.value })
  else if (node.type === 'TemplateLiteral') for (const quasi of node.quasis as Node[]) out.push({ node: quasi, text: String((quasi.value as { cooked: string }).cooked ?? '') })
  else if (node.type === 'ConditionalExpression') stringsIn(node.consequent as Node, out), stringsIn(node.alternate as Node, out)
  else if (node.type === 'LogicalExpression') {
    if (node.operator !== '&&') stringsIn(node.left as Node, out)
    stringsIn(node.right as Node, out)
  } else if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') stringsIn(node.expression as Node, out)
  return out
}

const joinedListRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'The token contract, inside a class list joined with .join(" ")' },
    schema: [
      {
        type: 'object',
        properties: { restrict: { type: 'array', items: { type: 'object', properties: { pattern: { type: 'string' }, message: { type: 'string' } }, required: ['pattern', 'message'] } } },
        required: ['restrict'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { restrict } = context.options[0] as { restrict: Restriction[] }
    const rules = restrict.map(({ pattern, message }) => ({ pattern: new RegExp(pattern), message }))
    return {
      CallExpression(ruleNode: Rule.Node) {
        const list = joinedList(ruleNode as unknown as Node)
        if (!list) return
        for (const item of list.elements as (Node | null)[]) {
          for (const { node, text } of stringsIn(item)) {
            for (const name of text.split(/\s+/)) {
              const rule = name && rules.find(({ pattern }) => pattern.test(name))
              if (rule) context.report({ node: node as unknown as Rule.Node, message: rule.message.replaceAll('$0', name) })
            }
          }
        }
      },
    }
  },
}

/** The plugin, as the token lint registers it: one rule, under three names. */
export const tokenJoinedPlugin: ESLint.Plugin = { rules: { classes: joinedListRule, values: joinedListRule, spacing: joinedListRule } }
