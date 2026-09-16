// @vitest-environment jsdom
/**
 * What the Checkbox page claims, pinned: the keys, the click that never
 * reaches the row, and the second rendering — no `onChange`, a picture of
 * the state that is not a control. The last one is what clears axe's
 * `nested-interactive` on the "inside a row" story (stage 1 of the
 * migration).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

afterEach(cleanup)

describe('Checkbox', () => {
  it('is a checkbox that Space toggles, and Enter does not', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} aria-label="Done" />)
    const box = screen.getByRole('checkbox', { name: 'Done' })
    expect(box.getAttribute('aria-checked')).toBe('false')

    await user.tab()
    expect(document.activeElement).toBe(box)
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('toggles on click, and the click never reaches the row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onRow = vi.fn()
    render(
      <div onClick={onRow}>
        <Checkbox checked onChange={onChange} aria-label="Done" />
      </div>,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Done' }))
    expect(onChange).toHaveBeenCalledWith(false)
    expect(onRow).not.toHaveBeenCalled()
  })

  it('does nothing when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} disabled onChange={onChange} aria-label="Done" />)
    const box = screen.getByRole('checkbox', { name: 'Done' })
    expect(box.getAttribute('aria-disabled')).toBe('true')
    await user.click(box)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('with no onChange is a picture of the state, not a control: the row gets the click', async () => {
    const user = userEvent.setup()
    const onRow = vi.fn()
    const { container } = render(
      <button type="button" aria-pressed onClick={onRow}>
        <Checkbox checked aria-label="Ignored" />
        The row is the control
      </button>,
    )
    expect(screen.queryByRole('checkbox')).toBeNull()
    const square = container.querySelector('[aria-hidden="true"]')
    expect(square).not.toBeNull()
    expect(container.querySelectorAll('input, [tabindex], [role="checkbox"]')).toHaveLength(0)
    await user.click(square as HTMLElement)
    expect(onRow).toHaveBeenCalledTimes(1)
  })

  describe('with label', () => {
    it('is named by its words, and clicking the words toggles it', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Checkbox checked={false} onChange={onChange} label="Compare every time" />)
      const box = screen.getByRole('checkbox', { name: 'Compare every time' })
      await user.click(screen.getByText('Compare every time'))
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(true)
      expect(box.getAttribute('aria-checked')).toBe('false')
    })

    it('toggles once, not twice, when the box itself is clicked inside its words', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Checkbox checked onChange={onChange} label="Label" />)
      await user.click(screen.getByRole('checkbox', { name: 'Label' }))
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(false)
    })

    it('keeps Space on the box', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Checkbox checked={false} onChange={onChange} label="Label" />)
      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Label' }))
      await user.keyboard(' ')
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('does nothing from its words when disabled, and shows no pointer over them', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { container } = render(<Checkbox checked={false} disabled onChange={onChange} label="Label" />)
      await user.click(screen.getByText('Label'))
      expect(onChange).not.toHaveBeenCalled()
      expect(container.querySelector('label')?.className).not.toContain('cursor-pointer')
    })

    it('keeps className on the box', () => {
      const { container } = render(<Checkbox checked={false} onChange={() => {}} label="Label" className="mt-1" />)
      expect(container.querySelector('label')?.className).not.toContain('mt-1')
      expect(screen.getByRole('checkbox', { name: 'Label' }).className).toContain('mt-1')
    })

    it('with no onChange draws the words beside the picture, and is still not a control', () => {
      const { container } = render(<Checkbox checked label="Label" />)
      expect(screen.queryByRole('checkbox')).toBeNull()
      expect(container.querySelector('label')).toBeNull()
      expect(screen.getByText('Label')).not.toBeNull()
    })
  })

  describe('with row', () => {
    const picture = <svg data-testid="picture" />

    it('is named by its words, and a click anywhere on the row toggles it once', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Checkbox row leading={picture} checked={false} onChange={onChange} label="Item one" />)
      const box = screen.getByRole('checkbox', { name: 'Item one' })
      await user.click(screen.getByText('Item one'))
      await user.click(screen.getByTestId('picture'))
      await user.click(box)
      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, true)
    })

    it('draws the picture, the words, then the box, in one row', () => {
      const { container } = render(<Checkbox row leading={picture} checked={false} onChange={() => {}} label="Item one" />)
      const children = [...(container.querySelector('label')?.children ?? [])]
      expect(children[0]?.getAttribute('data-testid')).toBe('picture')
      expect(children[1]?.textContent).toBe('Item one')
      expect(children[2]?.getAttribute('role')).toBe('checkbox')
      expect(container.querySelector('label')?.className).toContain('h-10')
    })

    it('fills while checked, and on hover', () => {
      const { container, rerender } = render(<Checkbox row checked={false} onChange={() => {}} label="Item one" />)
      const row = () => container.querySelector('label')?.className ?? ''
      expect(row()).not.toContain('bg-bg-selected')
      expect(row()).toContain('hover:bg-bg-hover')
      rerender(<Checkbox row checked onChange={() => {}} label="Item one" />)
      expect(row()).toContain('bg-bg-selected')
    })

    it('does nothing when disabled, and neither fills under the pointer nor points', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { container } = render(<Checkbox row disabled checked={false} onChange={onChange} label="Item one" />)
      await user.click(screen.getByText('Item one'))
      expect(onChange).not.toHaveBeenCalled()
      const className = container.querySelector('label')?.className ?? ''
      expect(className).not.toContain('cursor-pointer')
      expect(className).not.toContain('hover:bg-bg-hover')
    })

    it('keeps Space on the box, and adds no Tab stop of its own', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Checkbox row checked={false} onChange={onChange} label="Item one" />)
      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Item one' }))
      await user.keyboard(' ')
      expect(onChange).toHaveBeenCalledWith(true)
      await user.tab()
      expect(document.activeElement).toBe(document.body)
    })

    it('is ignored with no onChange', () => {
      const { container } = render(<Checkbox row checked label="Item one" />)
      expect(container.querySelector('label')).toBeNull()
      expect(screen.queryByRole('checkbox')).toBeNull()
    })
  })
})
