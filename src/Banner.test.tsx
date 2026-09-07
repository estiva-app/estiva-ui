// @vitest-environment jsdom
/**
 * What `Banner.mdx` claims about the dismiss added at stage 3 (D21).
 *
 * The point of the first test is the one that is easy to lose: a banner
 * without `onDismiss` must render exactly what it always did. Every banner in
 * both apps is that one, and a prop that quietly changed their DOM would be a
 * change nobody asked for.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Banner } from './Banner'

afterEach(cleanup)

describe('Banner', () => {
  it('is one element with the text in it when there is no dismiss', () => {
    const { container } = render(<Banner tone="info">Two people are editing this.</Banner>)
    const root = container.firstElementChild!
    expect(root.children).toHaveLength(0)
    expect(root.textContent).toBe('Two people are editing this.')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('offers a dismiss when asked, and reports it', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(
      <Banner tone="warning" onDismiss={onDismiss}>
        The relay is not answering.
      </Banner>,
    )
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('lets the caller name the dismiss', () => {
    render(
      <Banner tone="ok" onDismiss={() => {}} dismissLabel="Hide this notice">
        Saved.
      </Banner>,
    )
    expect(screen.getByRole('button', { name: 'Hide this notice' })).toBeTruthy()
  })

  it('announces an error and stays polite otherwise', () => {
    const { rerender, container } = render(<Banner tone="error">Could not save.</Banner>)
    expect(container.firstElementChild!.getAttribute('role')).toBe('alert')
    rerender(<Banner tone="warning">Could not save.</Banner>)
    expect(container.firstElementChild!.getAttribute('role')).toBe('status')
    // and the same either side of the dismiss
    rerender(
      <Banner tone="error" onDismiss={() => {}}>
        Could not save.
      </Banner>,
    )
    expect(container.firstElementChild!.getAttribute('role')).toBe('alert')
  })
})
