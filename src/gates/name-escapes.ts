/// <reference types="node" />
/**
 * `estiva-gates name-escapes`: write into every escape marker the rules it keeps
 * off, once (Katerina's ruling B3, 25 September).
 *
 * A marker used to keep off every rule on its element; now it keeps off only the
 * rules it names, `// @estiva-escape(no-raw-element): <reason>`. So that nothing
 * that was escaped breaks, this asks the gate itself which rules each unnamed
 * marker stands for: linted with the new reader, an unnamed marker is reported
 * once per rule that finds its element ("Name the rule … `@estiva-escape(<rule>)`"),
 * and those names are written into the marker. Nothing is guessed, and a marker
 * no rule reaches is left as it is and listed.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ESLint as ESLintClass } from 'eslint'

export interface NameEscapesOptions {
  /** The folder the gate lints from. */
  root?: string
  /** The gate's config file, relative to `root`. */
  config?: string
}

export interface NameEscapesResult {
  /** One line per marker rewritten: `file:line  rule, rule`. */
  named: string[]
  /** Markers no rule reached, left unnamed. */
  unreached: string[]
}

const UNNAMED = /@estiva-escape(?!\s*\()/
const NAMED_IN_MESSAGE = /@estiva-escape\(([^)]+)\)/

export async function nameEscapes({ root = process.cwd(), config = 'eslint.gates.config.js' }: NameEscapesOptions = {}): Promise<NameEscapesResult> {
  const resolved = createRequire(join(root, 'package.json')).resolve('eslint')
  const { ESLint } = (await import(pathToFileURL(resolved).href)) as { ESLint: typeof ESLintClass }
  const eslint = new ESLint({ cwd: root, overrideConfigFile: join(root, config) })
  const results = await eslint.lintFiles(['.'])

  const named: string[] = []
  const unreached: string[] = []
  for (const result of results) {
    // The rules each unnamed marker stands for, by the line its comment starts on.
    const byLine = new Map<number, Set<string>>()
    for (const m of result.messages) {
      if (m.messageId !== 'escapeWithoutRule') continue
      const rule = NAMED_IN_MESSAGE.exec(m.message)?.[1]
      if (!rule) continue
      byLine.set(m.line, (byLine.get(m.line) ?? new Set()).add(rule))
    }
    const source = result.source ?? readFileSync(result.filePath, 'utf8')
    const eol = source.includes('\r\n') ? '\r\n' : '\n'
    const lines = source.split(/\r?\n/)
    let changed = false
    const file = relative(root, result.filePath).split('\\').join('/')
    for (const [line, rules] of byLine) {
      // The marker is on the comment's first line, or within the next few (a block comment).
      for (let i = line - 1; i < Math.min(lines.length, line + 3); i++) {
        if (!UNNAMED.test(lines[i])) continue
        const names = [...rules].sort().join(', ')
        lines[i] = lines[i].replace(UNNAMED, `@estiva-escape(${names})`)
        named.push(`${file}:${i + 1}  ${names}`)
        changed = true
        break
      }
    }
    if (changed) writeFileSync(result.filePath, lines.join(eol), 'utf8')
    // Unnamed markers the gate did not report: nothing of the gate's reaches that element.
    lines.forEach((text, i) => {
      if (UNNAMED.test(text) && !/eslint-disable/.test(text) && /\/\/|\/\*/.test(text)) unreached.push(`${file}:${i + 1}`)
    })
  }
  return { named, unreached }
}
