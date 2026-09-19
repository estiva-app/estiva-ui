// @vitest-environment jsdom
/** What the ListColumn page claims, pinned. Sizes are measured in the browser; these pin the parts. */
import { afterEach, describe, expect, it } from 'vitest'
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

  it('sections: 4px between rows', () => {
    render(
      <ListColumn title="Items" spacing="sections">
        <p>Row</p>
      </ListColumn>,
    )
    expect((screen.getByText('Row').parentElement as HTMLElement).className.split(' ')).toContain('gap-1')
  })
})
