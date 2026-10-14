// @vitest-environment jsdom
/**
 * What the RichText page claims, pinned: every block draws as its element; text
 * is text, never HTML; links are found in text and never in code, and a click
 * on one stays on it; an unknown block keeps its words; a table's first row of
 * header cells is its header; the app's own parts go where the page says.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RichText, richTextClassName, type RichTextBlock, type RichTextRun } from './RichText'

afterEach(cleanup)

const t = (text: string, ...marks: string[]): RichTextRun => ({ text, marks })
const p = (...inline: RichTextRun[]): RichTextBlock => ({ type: 'paragraph', inline })
const cell = (typeName: string, text: string): RichTextBlock => ({ type: 'unknown', typeName, children: [p(t(text))] })
const row = (typeName: string, ...texts: string[]): RichTextBlock => ({ type: 'unknown', typeName: 'tableRow', children: texts.map((x) => cell(typeName, x)) })

const draw = (blocks: RichTextBlock[], props = {}) => render(<RichText blocks={blocks} {...props} />).container

describe('RichText', () => {
  it('draws renderAfter after a line of words, inside a list item, and nowhere it returns nothing', () => {
    const after = (block: RichTextBlock) => (block.id === 'skip' ? null : <aside data-after={block.id} />)
    const c = draw(
      [
        { type: 'paragraph', id: 'p1', inline: [t('One')] },
        { type: 'paragraph', id: 'skip', inline: [t('Two')] },
        { type: 'bulletList', id: 'l1', children: [{ type: 'listItem', id: 'i1', inline: [t('Item')] }] },
        { type: 'heading', id: 'h1', level: 2, inline: [t('Head')] },
      ],
      { renderAfter: after },
    )
    expect([...c.querySelectorAll('[data-after]')].map((e) => e.getAttribute('data-after'))).toEqual(['p1', 'i1', 'h1'])
    // After its paragraph, not inside it; inside its item, not after the list.
    expect(c.querySelector('p[data-block-id="p1"] + aside[data-after="p1"]')).not.toBeNull()
    expect(c.querySelector('li[data-block-id="i1"] > aside[data-after="i1"]')).not.toBeNull()
  })

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

  it('gives an editor the same look: the classes on its box are the ones an editor gets', () => {
    for (const size of ['default', 'small'] as const) {
      const c = draw([p(t('x'))], { size })
      expect(c.firstElementChild?.className).toBe(richTextClassName(size))
    }
    expect(richTextClassName('default', 'outline-none')).toContain('outline-none')
  })

  const CHECKLIST: RichTextBlock[] = [
    {
      type: 'bulletList',
      id: 'l1',
      children: [
        { type: 'listItem', id: 'i1', checked: true, inline: [{ text: 'ship', marks: [] }] },
        { type: 'listItem', id: 'i2', checked: false, inline: [{ text: 'verify', marks: [] }] },
        { type: 'listItem', id: 'i3', inline: [{ text: 'plain', marks: [] }] },
      ],
    },
    { type: 'blockquote', id: 'q1', tone: 'warning', inline: [{ text: 'careful', marks: [] }] },
    { type: 'blockquote', id: 'q2', tone: 'danger', inline: [{ text: 'unknown', marks: [] }] },
  ]

  it('draws a checklist item with its box, and a plain item without one (RIC-19)', () => {
    const { container } = render(<RichText blocks={CHECKLIST} />)
    expect([...container.querySelectorAll('li')].map((li) => li.getAttribute('data-checked'))).toEqual(['true', 'false', null])
    // Without onTick the box is a picture: nothing to tab to or click, but a screen reader still hears done or not, by the item's words.
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes.map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-checked'), b.getAttribute('aria-readonly'), b.tabIndex])).toEqual([
      ['ship', 'true', 'true', -1],
      ['verify', 'false', 'true', -1],
    ])
  })

  it('ticks an item with one click when the app may change the text, each box named by its item', () => {
    const onTick = vi.fn()
    render(<RichText blocks={CHECKLIST} onTick={onTick} />)
    const boxes = [screen.getByRole('checkbox', { name: 'ship' }), screen.getByRole('checkbox', { name: 'verify' })]
    expect(boxes.map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false'])
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    fireEvent.click(boxes[1])
    expect(onTick).toHaveBeenCalledWith('i2', true)
  })

  it('draws a callout in its tone, and one it does not know as a note', () => {
    const { container } = render(<RichText blocks={CHECKLIST} />)
    expect([...container.querySelectorAll('blockquote')].map((q) => [q.getAttribute('data-tone'), q.getAttribute('data-callout')])).toEqual([
      ['warning', 'warning'],
      ['danger', 'note'],
    ])
  })

  it('draws an empty tone as a note, as the editor does (review of #170)', () => {
    const { container } = render(<RichText blocks={[{ type: 'blockquote', tone: '', inline: [t('empty')] }]} />)
    expect(container.querySelector('blockquote')!.getAttribute('data-callout')).toBe('note')
  })
})

describe('an indented list item — MAN-13', () => {
  const item = (id: string, text: string, indent?: number): RichTextBlock => ({ type: 'listItem', id, inline: [t(text)], ...(indent ? { indent } : {}) })

  it('draws an item inside the one above, in a list of the same type with no id', () => {
    const { container } = render(
      <RichText blocks={[{ type: 'orderedList', id: 'l1', children: [item('i1', 'intro'), item('i2', 'after', 1), item('i3', 'deeper', 2), item('i4', 'back')] }]} />,
    )
    const outer = container.querySelector('ol[data-block-id="l1"]')!
    expect([...outer.children].map((li) => li.getAttribute('data-block-id'))).toEqual(['i1', 'i4'])
    const inner = outer.querySelector(':scope > li > ol')!
    expect(inner.hasAttribute('data-block-id')).toBe(false)
    expect(inner.querySelector(':scope > li')?.getAttribute('data-block-id')).toBe('i2')
    expect(inner.querySelector(':scope > li > ol > li')?.textContent).toBe('deeper')
  })

  it('never draws an item more than one level below the one before it', () => {
    const { container } = render(<RichText blocks={[{ type: 'bulletList', children: [item('a', 'first', 2), item('b', 'next', 3)] }]} />)
    const outer = container.querySelector('ul')!
    expect([...outer.children].map((li) => li.getAttribute('data-block-id'))).toEqual(['a'])
    expect(outer.querySelector(':scope > li > ul > li')?.getAttribute('data-block-id')).toBe('b')
  })

  it('never nests deeper than 8 levels (SPEC §13.3)', () => {
    const deep = Array.from({ length: 20 }, (_, i) => item(`d${i}`, `level ${i}`, i))
    const { container } = render(<RichText blocks={[{ type: 'bulletList', children: deep }]} />)
    expect(container.querySelectorAll('ul').length).toBe(9)
    expect(container.querySelector('[data-block-id="d19"]')!.parentElement).toBe(container.querySelector('[data-block-id="d8"]')!.parentElement)
  })

  it('draws an item with an indent that is not a whole number above 0 at the left', () => {
    const { container } = render(<RichText blocks={[{ type: 'bulletList', children: [item('a', 'one'), { ...item('b', 'two'), indent: -1 }, { ...item('c', 'three'), indent: Number.NaN }]}]} />)
    expect([...container.querySelector('ul')!.children].map((li) => li.getAttribute('data-block-id'))).toEqual(['a', 'b', 'c'])
  })

  it('draws an item indented under a checklist item inside its words, after them (RIC-19)', () => {
    const { container } = render(<RichText blocks={[{ type: 'bulletList', children: [{ ...item('a', 'done'), checked: true }, item('b', 'under it', 1)] }]} />)
    const sub = container.querySelector('[data-block-id="b"]')!
    expect(sub.closest('li[data-checked]')?.getAttribute('data-block-id')).toBe('a')
    expect(sub.parentElement!.parentElement!.matches('li[data-checked="true"] > div')).toBe(true)
    expect(sub.hasAttribute('data-checked')).toBe(false)
  })
})
