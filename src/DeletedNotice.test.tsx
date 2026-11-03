// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DeletedNotice } from './DeletedNotice'
import { NoAccessNotice } from './NoAccessNotice'

afterEach(cleanup)

describe('DeletedNotice', () => {
  it('says who deleted it and when, with Restore for someone who may edit it', async () => {
    const onRestore = vi.fn()
    render(<DeletedNotice by="Person two" when="Mon, Nov 2" onRestore={onRestore} />)
    expect(screen.getByText('Deleted by Person two · Mon, Nov 2')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Restore' }))
    })
    expect(onRestore).toHaveBeenCalledTimes(1)
  })

  it('offers nothing to someone who may only read it', () => {
    render(<DeletedNotice by="Person two" when="Mon, Nov 2" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('a second press while the restore is written does nothing, and the button opens again after its answer', async () => {
    let answer: () => void = () => {}
    const onRestore = vi.fn(() => new Promise<void>((resolve) => (answer = resolve)))
    render(<DeletedNotice by="Person two" when="Mon, Nov 2" onRestore={onRestore} />)
    const button = screen.getByRole('button', { name: 'Restore' }) as HTMLButtonElement
    await act(async () => {
      fireEvent.click(button)
    })
    fireEvent.click(button)
    expect(onRestore).toHaveBeenCalledTimes(1)
    await act(async () => answer())
    expect(button.disabled).toBe(false)
  })
})

describe('NoAccessNotice', () => {
  it('says the file cannot be opened, and never which one, on a page and in a card', () => {
    const { container, rerender } = render(<NoAccessNotice what="item" />)
    expect(container.textContent).toBe("You can't open this item")
    rerender(<NoAccessNotice what="item" place="card" />)
    expect(container.textContent).toBe("You can't open this item")
  })
})
