// @vitest-environment jsdom
/**
 * What `ContainerHeader.mdx` claims: a string title is one line that keeps its
 * width, a node is drawn as given and takes the room left, and the column's
 * buttons sit at the right edge. The pixels are proved against Peek's own
 * (docs/GATES.md, UIG-13: A).
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ContainerHeader } from './ContainerHeader'

afterEach(cleanup)

describe('ContainerHeader', () => {
  it('is the 48px bar with a hairline under it', () => {
    const { container } = render(<ContainerHeader title="Items" />)
    const bar = container.firstElementChild!.className.split(' ')
    expect(bar).toContain('h-12')
    expect(bar).toContain('border-b')
    expect(bar).toContain('border-border-subtle')
  })

  it('a string title is one line in body-2-strong, and keeps its width', () => {
    render(<ContainerHeader title="Items" />)
    const title = screen.getByText('Items')
    expect(title.className).toContain('text-body-2-strong')
    expect(title.className).toContain('whitespace-nowrap')
    expect(title.parentElement!.className).toContain('shrink-0')
  })

  it('a node title is drawn as given and takes the room left', () => {
    render(<ContainerHeader title={<em>Plan</em>} />)
    const holder = screen.getByText('Plan').parentElement!
    expect(holder.className).toContain('flex-1')
    expect(holder.className).toContain('min-w-0')
  })

  it('draws a chevron only when asked, and the buttons at the right edge', () => {
    const { container, rerender } = render(<ContainerHeader title="Items" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstElementChild!.children).toHaveLength(1)
    rerender(<ContainerHeader title="Items" chevron actions={<button type="button">New</button>} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.firstElementChild!.children).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'New' }).closest('div')!.className).toContain('gap-1')
  })
})
