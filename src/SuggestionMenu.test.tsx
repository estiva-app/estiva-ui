// @vitest-environment jsdom
/**
 * The list an editor drives (UIG-31). jsdom cannot type into an editor, so this
 * drives the part the way the editor does — through `handle` — with a plain
 * element standing in for the editor's own. The real editor is proved in a
 * browser through the `InAnEditor` story.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { SuggestionMenu, type SuggestionMenuHandle, type SuggestionMenuSection } from './SuggestionMenu'

afterEach(cleanup)
// jsdom lays nothing out, so it has no `scrollIntoView`; the highlighted row calls it.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const RECT = { top: 400, bottom: 420, left: 100, right: 110, width: 10, height: 20, x: 100, y: 400, toJSON: () => ({}) } as DOMRect
const SECTIONS: SuggestionMenuSection<string>[] = [
  { label: 'First', items: ['One', 'Two'] },
  { label: 'Second', items: ['Three'] },
]

function draw({ sections = SECTIONS, editor, rect = RECT, onSelect = vi.fn() }: { sections?: SuggestionMenuSection<string>[]; editor?: HTMLElement; rect?: DOMRect | null; onSelect?: (s: string) => void } = {}) {
  const handle = createRef<SuggestionMenuHandle>()
  const result = render(
    <SuggestionMenu handle={handle} rect={rect} editorElement={editor} ariaLabel="Commands" width="w-[300px]" maxHeight="max-h-[400px]" sections={sections} itemKey={(s) => s} row={(s) => ({ label: s })} onSelect={onSelect} />,
  )
  const press = (key: string) => {
    let used = false
    act(() => {
      used = handle.current!.onKeyDown(new KeyboardEvent('keydown', { key }))
    })
    return used
  }
  return { ...result, handle, press, onSelect }
}

const active = () => screen.getAllByRole('option').findIndex((o) => o.getAttribute('aria-selected') === 'true')

describe('SuggestionMenu', () => {
  it('is a named listbox of options, in sections', async () => {
    draw()
    await screen.findByRole('listbox', { name: 'Commands' })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['One', 'Two', 'Three'])
    expect(screen.getByRole('group', { name: 'First' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Second' })).toBeTruthy()
  })

  it('draws nothing when there is nothing to show', () => {
    draw({ sections: [{ label: 'First', items: [] }] })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('walks with ↓ and ↑ across sections, wrapping at both ends', async () => {
    const { press } = draw()
    await screen.findByRole('listbox')
    expect(active()).toBe(0)
    expect(press('ArrowDown')).toBe(true)
    expect(active()).toBe(1)
    press('ArrowDown')
    expect(active()).toBe(2)
    press('ArrowDown')
    expect(active()).toBe(0)
    press('ArrowUp')
    expect(active()).toBe(2)
  })

  it('chooses the highlighted row on Enter, and leaves every other key to the editor', async () => {
    const { press, onSelect } = draw()
    await screen.findByRole('listbox')
    press('ArrowDown')
    expect(press('Enter')).toBe(true)
    expect(onSelect).toHaveBeenCalledWith('Two')
    expect(press('a')).toBe(false)
    expect(press('Escape')).toBe(false)
  })

  it('chooses on a press, without taking the focus', async () => {
    const { onSelect } = draw()
    await screen.findByRole('listbox')
    const row = screen.getByRole('option', { name: 'Three' })
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    row.dispatchEvent(down)
    expect(onSelect).toHaveBeenCalledWith('Three')
    expect(down.defaultPrevented).toBe(true)
  })

  it('moves the highlight with the pointer', async () => {
    draw()
    await screen.findByRole('listbox')
    fireEvent.mouseEnter(screen.getByRole('option', { name: 'Three' }))
    expect(active()).toBe(2)
  })

  it('goes back to the first row when the list changes', async () => {
    const { press, rerender, handle } = draw()
    await screen.findByRole('listbox')
    press('ArrowDown')
    expect(active()).toBe(1)
    rerender(<SuggestionMenu handle={handle} rect={RECT} ariaLabel="Commands" width="w-[300px]" maxHeight="max-h-[400px]" sections={[{ items: ['Two', 'Three'] }]} itemKey={(s) => s} row={(s) => ({ label: s })} onSelect={() => {}} />)
    expect(active()).toBe(0)
  })

  it('tells the editor it completes into the list, and which row is active', async () => {
    const editor = document.createElement('div')
    const { press } = draw({ editor })
    const listbox = await screen.findByRole('listbox')
    expect(editor.getAttribute('aria-autocomplete')).toBe('list')
    expect(editor.getAttribute('aria-haspopup')).toBe('listbox')
    expect(editor.getAttribute('aria-controls')).toBe(listbox.id)
    const options = screen.getAllByRole('option')
    expect(editor.getAttribute('aria-activedescendant')).toBe(options[0].id)
    press('ArrowDown')
    expect(editor.getAttribute('aria-activedescendant')).toBe(options[1].id)
  })

  it('leaves nothing on the editor once it is gone', async () => {
    const editor = document.createElement('div')
    const { unmount } = draw({ editor })
    await screen.findByRole('listbox')
    unmount()
    for (const name of ['aria-autocomplete', 'aria-haspopup', 'aria-controls', 'aria-activedescendant']) {
      expect(editor.hasAttribute(name), name).toBe(false)
    }
  })
})
