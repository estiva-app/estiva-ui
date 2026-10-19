// @vitest-environment jsdom
/**
 * The app's own buttons on the selection strip (`actions`, LEAF-4): pressing
 * one runs it with the selection in place, and the strip closes. jsdom has no
 * layout, so the view's focus and coordinates are stood in for.
 */
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { KeptSelection, SelectionToolbar } from './SelectionToolbar'

let editor: Editor | undefined

afterEach(() => {
  cleanup()
  editor?.destroy()
  editor = undefined
  vi.useRealTimers()
})

it('runs an action with the selection in place, and closes the strip', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  editor = new Editor({ extensions: [StarterKit, KeptSelection], content: '<p>some words to comment on</p>' })
  vi.spyOn(editor.view, 'hasFocus').mockReturnValue(true)
  vi.spyOn(editor.view, 'coordsAtPos').mockReturnValue({ top: 10, bottom: 20, left: 10, right: 20 })
  const seen: { from: number; to: number }[] = []
  const run = vi.fn((e: Editor) => seen.push({ from: e.state.selection.from, to: e.state.selection.to }))
  render(<SelectionToolbar editor={editor} actions={[{ label: 'Comment', icon: <span aria-hidden />, run }]} />)

  act(() => {
    editor!.commands.setTextSelection({ from: 6, to: 11 })
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400)
  })
  const button = await screen.findByRole('button', { name: 'Comment' })
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(button)

  expect(run).toHaveBeenCalledTimes(1)
  expect(seen).toEqual([{ from: 6, to: 11 }])
  expect(screen.queryByRole('button', { name: 'Comment' })).toBeNull()
})
