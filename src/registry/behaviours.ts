/**
 * What a part owns, worked out from what it draws (Katerina's ruling B9,
 * 25 September).
 *
 * The plan's Gate 0 asked for "the behaviours it owns — derived from which Base
 * UI parts it imports". Until 0.36.0 only "is built on Base UI" was; the rest
 * was UIG-8's hand list of owners, which is right for the part that does the
 * work and silent for every part built from it: ConfirmDialog draws DialogShell,
 * whose page says it keeps focus inside, and the catalogue listed no focus for
 * ConfirmDialog. Every app entry listed nothing at all.
 *
 * Now a part owns:
 *
 * - what the Base UI parts it draws do, from UIG-8's enumeration (`baseUi` on
 *   each behaviour, read from Base UI's source): all of it for a whole part
 *   (`Menu.Root`), what it is for a piece (`Menu.Item`);
 * - what the whole of the part it **is** does (floating, focus, keys, scroll):
 *   the part it hands back at its root, followed through parts inside parts, in
 *   the package and in an app. ConfirmDialog returns a DialogShell, so it keeps
 *   focus inside; a page with a menu somewhere in it does not float, and a
 *   tooltip's floating stays the tooltip's;
 * - and, in the package, what UIG-8's list says (the floor: a part like `Link`
 *   is reachable with Tab without any Base UI in it).
 *
 * Read from the code: a JSX tag inside the part's own declaration, or inside a
 * function of the same file it draws. A root on one branch of a condition
 * still counts, so the list says what a part can be, not what one screen shows.
 */
import ts from 'typescript'
import { OWNED_BEHAVIOURS } from '../eslint/index'
import type { EntryBehaviour } from './schema'

/** `@base-ui/react`, its sub-paths, and the old `@base-ui-components/react` spelling. */
export const isBaseUi = (specifier: string) => /^@base-ui(?:-components)?\/react(?:\/|$)/.test(specifier)

/**
 * What drawing a Base UI part gives, by behaviour id. The whole part (`Menu.Root`,
 * or a part of one piece: `<Separator>`, `<Toggle>`) does all UIG-8 lists for it;
 * a piece of one (`Menu.Item`, `Toolbar.Button`) only says what it is.
 */
export function baseUiBehaviours(part: string, piece?: string): string[] {
  const whole = !piece || piece === 'Root' || piece === 'Provider'
  return OWNED_BEHAVIOURS.filter((owned) => owned.id === 'base-ui' || (owned.baseUi.includes(part) && (whole || owned.id === 'role'))).map((owned) => owned.id)
}

/**
 * What a part hands on to the parts drawn around it: what the whole thing does.
 * Being built on Base UI, a role and a Tab stop stay the inner part's: a banner
 * with a button in it is not itself reachable with Tab.
 */
export const HANDED_ON = new Set(['portal', 'press-outside', 'page-keys', 'focus', 'scroll-lock', 'follow', 'scroll'])

/** A hint drawn beside a part: its floating is its own, never the part's. */
export const HINTS = new Set(['Tooltip', 'WithTooltip', 'TooltipProvider', 'PreviewCard'])

/** What a part drawn inside another hands on to it. */
export const handedOn = (name: string, owned: Iterable<string>) => (HINTS.has(name) ? [] : [...owned].filter((id) => HANDED_ON.has(id)))

/** Behaviour ids as the catalogue writes them: in UIG-8's order, each once. */
export function asBehaviours(ids: Iterable<string>): EntryBehaviour[] {
  const held = new Set(ids)
  return OWNED_BEHAVIOURS.filter((owned) => held.has(owned.id)).map((owned) => ({ id: owned.id, behaviour: owned.behaviour }))
}

/** A tag as written: `Dialog.Popup`, `Button`. */
function tagText(tag: ts.JsxTagNameExpression): string | null {
  if (ts.isIdentifier(tag)) return tag.text
  if (ts.isPropertyAccessExpression(tag)) {
    const inner = tagText(tag.expression as ts.JsxTagNameExpression)
    return inner && `${inner}.${tag.name.text}`
  }
  return null
}

/** A tag's name and its piece: `['Dialog', 'Popup']`, `['Button', undefined]`. */
export const splitTag = (tag: string): [string, string | undefined] => {
  const [root, piece] = tag.split('.')
  return [root, piece]
}

/** Every tag drawn anywhere under `node`, as written. */
function tagsUnder(node: ts.Node): Set<string> {
  const found = new Set<string>()
  const visit = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = tagText(n.tagName)
      if (tag && /^[A-Z]/.test(tag)) found.add(tag)
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/**
 * For each name a file declares at its top (a function, a `const`, a class):
 * the tags drawn inside it, with the file's own functions it draws followed, so
 * what is left are names the file imports or declares without a body.
 */
export function drawnIn(sf: ts.SourceFile): Map<string, Set<string>> {
  const direct = new Map<string, Set<string>>()
  for (const statement of sf.statements) {
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name) direct.set(statement.name.text, tagsUnder(statement))
    else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) direct.set(d.name.text, tagsUnder(d.initializer))
    }
  }
  const closed = new Map<string, Set<string>>()
  for (const name of direct.keys()) {
    const out = new Set<string>()
    const seen = new Set([name])
    const stack = [name]
    while (stack.length) {
      for (const tag of direct.get(stack.pop() as string) ?? []) {
        out.add(tag)
        if (direct.has(tag) && !seen.has(tag)) {
          seen.add(tag)
          stack.push(tag)
        }
      }
    }
    closed.set(name, out)
  }
  return closed
}

/** The tags an expression hands back at its top: both sides of a condition, never a fragment's children. */
function rootsOfExpression(e: ts.Node | undefined, out: Set<string>): void {
  if (!e) return
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e)) return rootsOfExpression(e.expression, out)
  if (ts.isConditionalExpression(e)) {
    rootsOfExpression(e.whenTrue, out)
    rootsOfExpression(e.whenFalse, out)
    return
  }
  if (ts.isBinaryExpression(e)) {
    if (e.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) rootsOfExpression(e.left, out)
    rootsOfExpression(e.right, out)
    return
  }
  // A fragment is several things side by side (a page and the dialog it opens):
  // the part is none of them alone.
  if (ts.isJsxFragment(e)) return
  const tag = ts.isJsxElement(e) ? tagText(e.openingElement.tagName) : ts.isJsxSelfClosingElement(e) ? tagText(e.tagName) : null
  if (tag && /^[A-Z]/.test(tag)) out.add(tag)
}

/** The tags a function hands back: every `return`, or an arrow's body, never a nested function's. */
function rootsOfFunction(fn: ts.Node): Set<string> {
  const out = new Set<string>()
  if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body)) rootsOfExpression(fn.body, out)
  const visit = (n: ts.Node) => {
    if (n !== fn && (ts.isFunctionLike(n) || ts.isClassLike(n))) return
    if (ts.isReturnStatement(n)) rootsOfExpression(n.expression, out)
    ts.forEachChild(n, visit)
  }
  visit(fn)
  return out
}

/** The function a declaration's value is: itself, or the one inside `forwardRef(…)`, `memo(…)`. */
function functionOf(node: ts.Node | undefined): ts.Node | undefined {
  if (!node) return undefined
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return node
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return functionOf(node.expression)
  if (ts.isCallExpression(node)) for (const argument of node.arguments) {
    const fn = functionOf(argument)
    if (fn) return fn
  }
  return undefined
}

/**
 * For each function a file declares at its top: the parts it **is** — the tags it
 * hands back at its root, following the file's own functions it hands back.
 * `ConfirmDialog` returns a `DialogShell`, so it is one; a page with a menu
 * somewhere in it is not a menu.
 */
export function rootsIn(sf: ts.SourceFile): Map<string, Set<string>> {
  const direct = new Map<string, Set<string>>()
  for (const statement of sf.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) direct.set(statement.name.text, rootsOfFunction(statement))
    else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        const fn = functionOf(d.initializer)
        if (ts.isIdentifier(d.name) && fn) direct.set(d.name.text, rootsOfFunction(fn))
      }
    }
  }
  const closed = new Map<string, Set<string>>()
  for (const name of direct.keys()) {
    const out = new Set<string>()
    const seen = new Set([name])
    const stack = [name]
    while (stack.length) {
      for (const tag of direct.get(stack.pop() as string) ?? []) {
        if (direct.has(tag)) {
          if (!seen.has(tag)) {
            seen.add(tag)
            stack.push(tag)
          }
        } else out.add(tag)
      }
    }
    closed.set(name, out)
  }
  return closed
}

/** Each imported value name → where it came from. */
export function importsOf(sf: ts.SourceFile): Map<string, { specifier: string; imported: string }> {
  const out = new Map<string, { specifier: string; imported: string }>()
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause
    if (!clause || clause.isTypeOnly) continue
    const specifier = statement.moduleSpecifier.text
    if (clause.name) out.set(clause.name.text, { specifier, imported: 'default' })
    const bindings = clause.namedBindings
    if (bindings && ts.isNamedImports(bindings)) for (const e of bindings.elements) if (!e.isTypeOnly) out.set(e.name.text, { specifier, imported: (e.propertyName ?? e.name).text })
  }
  return out
}
