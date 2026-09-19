// @vitest-environment jsdom
/** What the ListColumn page claims, pinned. Sizes are measured in the browser; these pin the parts. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ListColumn } from './ListColumn'

afterEach(cleanup)

describe('ListColumn', () => {
  it('is headed by its title', () => {
    render(<ListColumn title="Items">{null}</ListColumn>)
    expect(screen.getByText('Items')).toBeTruthy()
  })

  it('is 290px wide with a line on its right, and keeps its width', () => {
    const { container } = render(<ListColumn title="Items">{null}</ListColumn>)
    const classes = (container.firstElementChild as HTMLElement).className.split(' ')
    expect(classes).toContain('w-[290px]')
    expect(classes).toContain('border-r')
    expect(classes).toContain('shrink-0')
  })

  it('collapsed: narrows to nothing, loses its line, and fades', () => {
    const { container } = render(<ListColumn title="Items" collapsed>{null}</ListColumn>)
    const classes = (container.firstElementChild as HTMLElement).className.split(' ')
    expect(classes).toContain('w-0')
    expect(classes).toContain('border-r-0')
    expect(classes).toContain('opacity-0')
  })

  it('draws its rows in the list, and a row above the list outside it', () => {
    render(
      <ListColumn title="Items" above={<p>Above</p>}>
        <p>Row</p>
      </ListColumn>,
    )
    const list = screen.getByText('Row').parentElement as HTMLElement
    expect(list.className.split(' ')).toEqual(expect.arrayContaining(['px-3', 'pt-4', 'pb-3', 'gap-0.5']))
    expect(list.contains(screen.getByText('Above'))).toBe(false)
  })

  it('a row that breaks: the column keeps its title, the message is where the list was, the rest stays', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Broken(): never {
      throw new Error('boom')
    }
    const { container } = render(
      <>
        <ListColumn title="Items" actions={<button>Sort</button>}>
          <Broken />
        </ListColumn>
        <p>The rest of the page</p>
      </>,
    )
    expect(screen.getByText('Items')).toBeTruthy()
    expect(screen.getByText(/Something went wrong in the list panel/)).toBeTruthy()
    // Only the name comes back: the actions may be what threw.
    expect(screen.queryByText('Sort')).toBeNull()
    expect(screen.getByText('The rest of the page')).toBeTruthy()
    expect((container.firstElementChild as HTMLElement).className.split(' ')).toContain('w-[290px]')
    quiet.mockRestore()
  })
})
