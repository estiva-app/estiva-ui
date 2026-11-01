// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QuotedLine } from './QuotedLine'

afterEach(cleanup)

describe('QuotedLine', () => {
  it('marks the words in the page’s highlight while they are still in the text', () => {
    const { container } = render(<QuotedLine words="the words this comment is on" />)
    const mark = screen.getByText('the words this comment is on')
    expect(mark.tagName).toBe('MARK')
    expect(mark.className).toMatch(/\bbg-warning-muted\b/)
    expect(container.querySelector('[data-quoted="here"]')).not.toBeNull()
  })

  it('says the words changed since, and loses the highlight', () => {
    render(<QuotedLine words="the words" state="reworded" />)
    expect(screen.getByText('Changed since')).toBeTruthy()
    expect(screen.getByText('the words').className).not.toMatch(/\bbg-warning-muted\b/)
  })

  it('says the part was deleted, and strikes the words through', () => {
    render(<QuotedLine words="the words" state="gone" />)
    expect(screen.getByText('Deleted from the page')).toBeTruthy()
    expect(screen.getByText('the words').className).toMatch(/\bline-through\b/)
  })

  it('gives a part with no words its name', () => {
    const { container } = render(<QuotedLine label="Picture: plan-sketch.png" />)
    expect(screen.getByText('Picture: plan-sketch.png')).toBeTruthy()
    expect(container.querySelector('[data-quoted="part"]')).not.toBeNull()
  })
})
