// @vitest-environment jsdom
/**
 * What the LinkCard and LinkParts pages claim, pinned: the pickers for a
 * reader who may change it and words for one who may not, the conversation
 * count and its unread, what each kind draws, and the loading and
 * not-available states.
 */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinkCard } from './LinkCard'
import { GROUP, ITEM, ITEM_NO_SUMMARY, ITEM_READ_ONLY, ITEM_UNREAD, LOADING, PAGE, PLACE, ready, SAID, UNAVAILABLE } from './linked.examples'

afterEach(cleanup)

describe('LinkCard', () => {
  it('opens what it links from its title', () => {
    render(<LinkCard link={ready(ITEM)} />)
    expect(screen.getByRole('link', { name: ITEM.title }).getAttribute('href')).toBe('#item')
  })

  it('lets a reader who may change it pick a new status and owner', async () => {
    const user = userEvent.setup()
    const onStatus = vi.fn()
    const onOwner = vi.fn()
    render(<LinkCard link={ready({ ...ITEM, status: { ...ITEM.status!, onChange: onStatus }, owner: { ...ITEM.owner!, onChange: onOwner } })} />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: /Done/ }))
    expect(onStatus).toHaveBeenCalledWith('done')
    await user.click(screen.getByRole('combobox', { name: 'Owner' }))
    await user.click(await screen.findByRole('option', { name: /Person three/ }))
    expect(onOwner).toHaveBeenCalledWith('c')
  })

  it('shows the same values as words to a reader who may not change them', () => {
    render(<LinkCard link={ready(ITEM_READ_ONLY)} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText('In progress')).toBeTruthy()
    expect(screen.getByText('Person one')).toBeTruthy()
  })

  it('shows words, never pickers, when read only, even to a reader who could change it', () => {
    render(<LinkCard link={ready(ITEM)} readOnly />)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('says nobody owns it when nobody does', () => {
    render(<LinkCard link={ready({ ...ITEM_READ_ONLY, owner: { value: undefined, options: [] } })} />)
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })

  it('shows the title alone when there is no summary', () => {
    render(<LinkCard link={ready(ITEM_NO_SUMMARY)} />)
    expect(screen.getByRole('link', { name: 'Item two' })).toBeTruthy()
    expect(screen.queryByText(ITEM.summary!)).toBeNull()
  })

  it('opens the conversation from its count, and says when it holds something unread', () => {
    const { rerender } = render(<LinkCard link={ready(ITEM)} />)
    const count = screen.getByRole('link', { name: /comments — open the conversation/ })
    expect(count.getAttribute('href')).toBe('#item-conversation')
    expect(count.textContent).not.toContain('unread')
    rerender(<LinkCard link={ready(ITEM_UNREAD)} />)
    expect(screen.getByRole('link', { name: /comments, unread — open the conversation/ })).toBeTruthy()
  })

  it('opens each item inside it on its own', () => {
    render(<LinkCard link={ready(GROUP)} />)
    expect(screen.getByRole('link', { name: 'Item three' }).getAttribute('href')).toBe('#c3')
    expect(screen.getByText('2/5')).toBeTruthy()
  })

  it('shows the newest conversation where it is given, and who wrote a page', () => {
    render(
      <>
        <LinkCard link={ready(PLACE)} />
        <LinkCard link={ready(PAGE)} />
      </>,
    )
    expect(screen.getByText('Latest conversation')).toBeTruthy()
    expect(screen.getByText(PLACE.latest!.body)).toBeTruthy()
    expect(screen.getByText('Yesterday')).toBeTruthy()
  })

  it('draws a person’s words as theirs, with the time as the link', () => {
    render(<LinkCard link={ready(SAID)} />)
    expect(screen.getByText('Person one')).toBeTruthy()
    expect(screen.getByText(SAID.body!)).toBeTruthy()
    expect(screen.getByRole('link', { name: '10:42' }).getAttribute('href')).toBe('#said')
  })

  it('while it loads, is busy and shows nothing of it', () => {
    const { container } = render(<LinkCard link={LOADING} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('says it is not available, and where it may still open', () => {
    render(<LinkCard link={UNAVAILABLE} />)
    expect(screen.getByText('Item — not available.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open in App one/ }).getAttribute('href')).toBe('#elsewhere')
  })
})
