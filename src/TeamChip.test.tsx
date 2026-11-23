// @vitest-environment jsdom
/**
 * What the page claims: the chip names the team with the team icon, opens the team's page when the app gives one,
 * and opens nothing when it gives none (Leaf, which has no team page).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TeamChip } from './TeamChip'

afterEach(cleanup)

describe('TeamChip', () => {
  it('names the team beside the team icon', () => {
    const { container } = render(<TeamChip name="Design" />)
    expect(screen.getByText('Design')).toBeTruthy()
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('tabler-icon-users')
  })

  it("opens the team's page when the app has one", () => {
    const onClick = vi.fn()
    render(<TeamChip name="Design" href="/teams/design" onClick={onClick} />)
    const link = screen.getByRole('link', { name: 'Design' })
    expect(link.getAttribute('href')).toBe('/teams/design')
    fireEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('opens nothing when the app has no team page', () => {
    render(<TeamChip name="Design" />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
