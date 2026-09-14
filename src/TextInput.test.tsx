// @vitest-environment jsdom
/**
 * What the TextInput page claims, pinned: a native input with a ref, the two
 * sizes, and the small one drawn with the small Select's classes.
 */
import { createRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TextInput } from './TextInput'

afterEach(cleanup)

describe('TextInput', () => {
  it('is a native text input that forwards its ref and native props', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TextInput ref={ref} aria-label="Title" placeholder="Untitled" />)
    const input = screen.getByRole('textbox', { name: 'Title' })
    expect(ref.current).toBe(input)
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('placeholder')).toBe('Untitled')
  })

  it('default size: 14px text with 12px by 8px padding', () => {
    render(<TextInput aria-label="Title" />)
    const classes = screen.getByRole('textbox').className.split(' ')
    for (const c of ['px-3', 'py-2', 'text-input-value']) expect(classes).toContain(c)
    expect(classes).not.toContain('h-6')
  })

  it('small: 24px tall, 12px text, 8px side padding — and no native size attribute', () => {
    render(<TextInput aria-label="Title" size="small" />)
    const input = screen.getByRole('textbox')
    const classes = input.className.split(' ')
    for (const c of ['h-6', 'px-2', 'text-[12px]']) expect(classes).toContain(c)
    for (const c of ['px-3', 'py-2', 'text-input-value']) expect(classes).not.toContain(c)
    expect(input.hasAttribute('size')).toBe(false)
  })
})
