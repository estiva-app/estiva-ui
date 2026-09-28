// @vitest-environment jsdom
/**
 * What the RichText page claims, pinned: every block draws as its element; text
 * is text, never HTML; links are found in text and never in code, and a click
 * on one stays on it; an unknown block keeps its words; a table's first row of
 * header cells is its header; the app's own parts go where the page says.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RichText, type RichTextBlock, type RichTextRun } from './RichText'

afterEach(cleanup)

const t = (text: string, ...marks: string[]): RichTextRun => ({ text, marks })
const p = (...inline: RichTextRun[]): RichTextBlock => ({ type: 'paragraph', inline })
const cell = (typeName: string, text: string): RichTextBlock => ({ type: 'unknown', typeName, children: [p(t(text))] })
const row = (typeName: string, ...texts: string[]): RichTextBlock => ({ type: 'unknown', typeName: 'tableRow', children: texts.map((x) => cell(typeName, x)) })

const draw = (blocks: RichTextBlock[], props = {}) => render(<RichText blocks={blocks} {...props} />).container

describe('RichText', () => {
  it('draws each block as its element', () => {
    const c = draw([
      { type: 'heading', level: 1, inline: [t('One')] },
      { type: 'heading', level: 2, inline: [t('Two')] },
      { type: 'heading', level: 3, inline: [t('Three')] },
      p(t('Text')),
      { type: 'bulletList', children: [{ type: 'listItem', inline: [t('a')] }] },
      { type: 'orderedList', start: 3, children: [{ type: 'listItem', inline: [t('b')] }] },
      { type: 'blockquote', inline: [t('quoted')] },
      { type: 'codeBlock', inline: [t('const a = 1')] },
      { type: 'horizontalRule' },
    ])
    expect(c.querySelector('h1')?.textContent).toBe('One')
    expect(c.querySelector('h2')?.textContent).toBe('Two')
    expect(c.querySelector('h3')?.textContent).toBe('Three')
    expect(c.querySelector('ul li')?.textContent).toBe('a')
    expect(c.querySelector('ol')?.getAttribute('start')).toBe('3')
    expect(c.querySelector('blockquote')?.textContent).toBe('quoted')
    expect(c.querySelector('pre code')?.textContent).toBe('const a = 1')
    expect(c.querySelector('hr')).not.toBeNull()
  })

  it('draws the marks as elements, and a line break as a break', () => {
    const c = draw([p(t('b', 'bold'), t('i', 'italic'), t('u', 'underline'), t('c', 'code'), t('one\ntwo'))])
    expect(c.querySelector('strong')?.textContent).toBe('b')
    expect(c.querySelector('em')?.textContent).toBe('i')
    expect(c.querySelector('u')?.textContent).toBe('u')
    expect(c.querySelector('p > code')?.textContent).toBe('c')
    expect(c.querySelectorAll('br').length).toBe(1)
  })

  it('sets text as text, never as HTML', () => {
    const c = draw([p(t('<b>stays text</b><img src=x onerror=alert(1)>'))])
    expect(c.querySelector('b')).toBeNull()
    expect(c.querySelector('img')).toBeNull()
    expect(c.textContent).toContain('<b>stays text</b>')
  })

  it('finds a written link and a bare address, and leaves punctuation after it', () => {
    draw([p(t('Read [the guide](https://example.com/guide) or https://example.com/a.'))])
    const guide = screen.getByRole('link', { name: 'the guide' })
    expect(guide.getAttribute('href')).toBe('https://example.com/guide')
    expect(guide.getAttribute('target')).toBe('_blank')
    const bare = screen.getByRole('link', { name: 'https://example.com/a' })
    expect(bare.getAttribute('href')).toBe('https://example.com/a')
    expect(bare.parentElement?.textContent).toBe('https://example.com/a.')
  })

  it('never reads code for links', () => {
    const c = draw([p(t('[not a link](https://example.com)', 'code'))])
    expect(c.querySelector('a')).toBeNull()
  })

  it('keeps a click on a link to the link', () => {
    const outer = vi.fn()
    render(
      <div onClick={outer}>
        <RichText blocks={[p(t('https://example.com'))]} />
      </div>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(outer).not.toHaveBeenCalled()
  })

  it('hands the app only the text between links', () => {
    const seen: string[] = []
    draw([p(t('before https://example.com/@name after'))], { renderText: (text: string) => (seen.push(text), text) })
    expect(seen).toEqual(['before ', ' after'])
  })

  it('lets the app draw a reference, and draws its text when it does not', () => {
    const run: RichTextRun = { text: 'nostr:npub1x', marks: [], reference: 'nostr:npub1x' }
    expect(draw([p(run)]).textContent).toBe('nostr:npub1x')
    cleanup()
    draw([p(run)], { renderReference: (reference: string) => <mark>{reference.slice(6)}</mark> })
    expect(document.querySelector('mark')?.textContent).toBe('npub1x')
  })

  it('draws the words of a block it does not know, never dropping it', () => {
    const c = draw([{ type: 'unknown', typeName: 'later', inline: [t('still here')], children: [p(t('and this'))] }])
    const block = c.querySelector('[data-block-type="later"]')
    expect(block?.textContent).toBe('still hereand this')
  })

  it('lets the app draw a block, or leave it to the part', () => {
    const own = (block: RichTextBlock) => (block.type === 'attachment' ? <figure>own</figure> : undefined)
    const c = draw([{ type: 'attachment' }, p(t('text'))], { renderBlock: own })
    expect(c.querySelector('figure')?.textContent).toBe('own')
    expect(c.querySelector('p')?.textContent).toBe('text')
  })

  it('draws a table, its first row of header cells as the header', () => {
    const c = draw([{ type: 'table', children: [row('tableHeader', 'Label', 'Value'), row('tableCell', 'a', 'b')] }])
    expect([...c.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Label', 'Value'])
    expect([...c.querySelectorAll('tbody td')].map((td) => td.textContent)).toEqual(['a', 'b'])
  })

  it('draws a table it cannot read as its words', () => {
    const c = draw([{ type: 'table', inline: [t('flat')] }])
    expect(c.querySelector('table')).toBeNull()
    expect(c.textContent).toBe('flat')
  })

  it('carries each block id', () => {
    const c = draw([{ type: 'paragraph', id: 'b1', inline: [t('x')] }])
    expect(c.querySelector('p')?.getAttribute('data-block-id')).toBe('b1')
  })

  it('draws nothing for no blocks', () => {
    expect(draw([]).innerHTML).toBe('')
  })

  it('keeps the same elements at the small size', () => {
    const blocks: RichTextBlock[] = [{ type: 'heading', level: 1, inline: [t('One')] }, { type: 'bulletList', children: [{ type: 'listItem', inline: [t('a')] }] }]
    const c = draw(blocks, { size: 'small' })
    expect(c.querySelector('h1')).not.toBeNull()
    expect(c.querySelector('ul li')).not.toBeNull()
    expect(c.firstElementChild?.className).toContain('text-caption')
  })
})
