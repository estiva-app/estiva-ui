// @vitest-environment jsdom
/**
 * What the FilePicker page claims, pinned: it draws nothing a person or a
 * screen reader can reach, the caller's ref opens it, it hands over an array,
 * the same file can be chosen twice, and closing it with nothing chosen calls
 * nothing. Opening the browser's own picker is checked in Chrome (the PR).
 */
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { FilePicker } from './FilePicker'

afterEach(cleanup)

/** A change as the browser sends one: the input's `files` set, then `change`. */
function choose(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  fireEvent.change(input)
}

describe('FilePicker', () => {
  it('is a hidden file input, out of the accessibility tree and out of Tab', () => {
    const { container } = render(<FilePicker onPick={() => {}} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.className).toBe('hidden')
    expect(input.getAttribute('aria-hidden')).toBe('true')
    expect(input.tabIndex).toBe(-1)
  })

  it("gives the caller's ref the input, which is how a button opens it", () => {
    const ref = createRef<HTMLInputElement>()
    render(<FilePicker ref={ref} onPick={() => {}} />)
    expect(ref.current?.tagName).toBe('INPUT')
    expect(ref.current?.type).toBe('file')
  })

  it('hands over the chosen files as an array, in order', () => {
    const onPick = vi.fn()
    const { container } = render(<FilePicker multiple onPick={onPick} />)
    const a = new File(['a'], 'a.txt')
    const b = new File(['b'], 'b.txt')
    choose(container.querySelector('input') as HTMLInputElement, [a, b])
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick.mock.calls[0][0]).toEqual([a, b])
    expect(Array.isArray(onPick.mock.calls[0][0])).toBe(true)
  })

  it('clears itself before handing the files over, so the same file can be chosen again', () => {
    const input = { value: 'C:\\fakepath\\a.txt' }
    const onPick = vi.fn(() => {
      input.value = (container.querySelector('input') as HTMLInputElement).value
    })
    const { container } = render(<FilePicker onPick={onPick} />)
    const element = container.querySelector('input') as HTMLInputElement
    const set = vi.spyOn(element, 'value', 'set')
    const a = new File(['a'], 'a.txt')
    choose(element, [a])
    expect(set).toHaveBeenCalledWith('')
    expect(input.value).toBe('')
    choose(element, [a])
    expect(onPick).toHaveBeenCalledTimes(2)
  })

  it('calls nothing when the picker closes with nothing chosen', () => {
    const onPick = vi.fn()
    const { container } = render(<FilePicker onPick={onPick} />)
    choose(container.querySelector('input') as HTMLInputElement, [])
    expect(onPick).not.toHaveBeenCalled()
  })

  it('passes accept, multiple and data attributes on', () => {
    const { container } = render(<FilePicker onPick={() => {}} multiple accept="image/*" data-picker="probe" />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.multiple).toBe(true)
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('data-picker')).toBe('probe')
  })
})
