// @vitest-environment jsdom
/**
 * What the Form page claims, pinned: Enter and a submit button send it, the
 * page's own submit is prevented, `busy` switches off everything inside and
 * holds focus, and focus comes back in the page's order.
 *
 * jsdom does not move focus off a field that becomes disabled; Chrome drops it
 * to `<body>`. So "focus is held" is checked as "focus is on the form, and not
 * on a disabled element" — without the form taking focus, that fails here too
 * (UIG-29 measured it). The browser check is in the PR.
 */
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { IconButton } from './IconButton'
import { Field } from './Field'
import { Form } from './Form'
import { Popover } from './Popover'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

afterEach(cleanup)

function Harness({ onSubmit = vi.fn(), error, busy = false }: { onSubmit?: () => void; error?: string; busy?: boolean }) {
  return (
    <Form onSubmit={onSubmit} busy={busy} aria-label="Probe" className="flex flex-col gap-6" id="probe">
      <Field label="First">
        <TextInput />
      </Field>
      <Field label="Second" error={error}>
        <TextInput />
      </Field>
      <Button type="submit">Send</Button>
    </Form>
  )
}

describe('Form', () => {
  it('sends on Enter in a field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    await user.type(screen.getByRole('textbox', { name: 'First' }), 'x{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('a Form in a Popover inside a Form sends only itself (C1)', async () => {
    // A link field in a pop-up over a composer: Enter there adds the link, and
    // must not also send the message around it. React carries the submit
    // through the Popover's portal to the outer form.
    const user = userEvent.setup()
    const outer = vi.fn()
    const inner = vi.fn()
    render(
      <Form onSubmit={outer}>
        <TextInput aria-label="Message" />
        <Popover trigger={<Button>Link</Button>} open ariaLabel="Link">
          <Form onSubmit={inner}>
            <TextInput aria-label="Address" />
          </Form>
        </Popover>
      </Form>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'example.com{Enter}')
    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'hi{Enter}')
    expect(outer).toHaveBeenCalledTimes(1)
    expect(inner).toHaveBeenCalledTimes(1)
  })

  it('sends from its submit button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  describe('the keys, the same in every form', () => {
    function Keys({ onSubmit, enterSends }: { onSubmit: () => void; enterSends?: boolean }) {
      return (
        <Form onSubmit={onSubmit} enterSends={enterSends} aria-label="Probe">
          <Field label="One">
            <TextInput />
          </Field>
          <Field label="Two">
            <TextInput />
          </Field>
          <Field label="Words">
            <Textarea />
          </Field>
          <input role="combobox" aria-label="Pick" aria-expanded="false" aria-controls="none" />
        </Form>
      )
    }

    it('Enter in a one-line field sends, even with two fields and no submit button', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Keys onSubmit={onSubmit} />)
      await user.type(screen.getByRole('textbox', { name: 'Two' }), 'x{Enter}')
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('Enter in a text area is a new line; Ctrl+Enter and Cmd+Enter there send', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Keys onSubmit={onSubmit} />)
      const words = screen.getByRole('textbox', { name: 'Words' }) as HTMLTextAreaElement
      await user.type(words, 'a{Enter}b')
      expect(words.value).toBe('a\nb')
      expect(onSubmit).not.toHaveBeenCalled()
      await user.keyboard('{Control>}{Enter}{/Control}')
      expect(onSubmit).toHaveBeenCalledTimes(1)
      await user.keyboard('{Meta>}{Enter}{/Meta}')
      expect(onSubmit).toHaveBeenCalledTimes(2)
    })

    it("Enter in a picker's input does not send", async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Keys onSubmit={onSubmit} />)
      await user.type(screen.getByRole('combobox', { name: 'Pick' }), 'x{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('a field that handles its own Enter keeps it', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(
        <Form onSubmit={onSubmit} aria-label="Probe">
          <TextInput aria-label="Own" onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()} />
        </Form>,
      )
      await user.type(screen.getByRole('textbox', { name: 'Own' }), 'x{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('with enterSends off, Enter in a one-line field does nothing and Ctrl+Enter sends', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Keys onSubmit={onSubmit} enterSends={false} />)
      const one = screen.getByRole('textbox', { name: 'One' }) as HTMLInputElement
      await user.type(one, 'x{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
      expect(one.value).toBe('x')
      await user.keyboard('{Control>}{Enter}{/Control}')
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('Shift+Enter and Alt+Enter in a one-line field send nothing, even with a submit button', async () => {
      const onSubmit = vi.fn()
      render(<Harness onSubmit={onSubmit} />)
      const field = screen.getByRole('textbox', { name: 'First' })
      // The browser's implicit submission is the default action of this keydown: prevented, it does not happen.
      for (const modifier of [{ shiftKey: true }, { altKey: true }]) {
        expect(fireEvent.keyDown(field, { key: 'Enter', ...modifier })).toBe(false)
      }
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('Enter with a submit button in the form sends once, not twice', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<Harness onSubmit={onSubmit} />)
      await user.type(screen.getByRole('textbox', { name: 'First' }), 'x{Enter}')
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('does not send again while busy', async () => {
      const onSubmit = vi.fn()
      const { rerender } = render(<Harness onSubmit={onSubmit} />)
      act(() => screen.getByRole('textbox', { name: 'First' }).focus())
      rerender(<Harness onSubmit={onSubmit} busy />)
      const form = screen.getByRole('form', { name: 'Probe' })
      fireEvent.keyDown(form, { key: 'Enter', ctrlKey: true })
      fireEvent.submit(form)
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  it('does not send while a field shows its error', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} error="Not like that." />)
    await user.type(screen.getByRole('textbox', { name: 'First' }), 'x{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends on Enter in a one-line field, and not in a textarea', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Form onSubmit={onSubmit} aria-label="Probe">
        <Field label="Words">
          <Textarea />
        </Field>
      </Form>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Words' }), 'one{Enter}two')
    expect(onSubmit).not.toHaveBeenCalled()
    expect((screen.getByRole('textbox', { name: 'Words' }) as HTMLTextAreaElement).value).toBe('one\ntwo')
  })

  it("prevents the page's own submit, so nothing reloads", () => {
    render(<Harness />)
    const form = screen.getByRole('form', { name: 'Probe' })
    // dispatchEvent answers false when the event's default was prevented.
    expect(fireEvent.submit(form)).toBe(false)
  })

  it('is a form with no browser validation bubbles, and passes id and className on', () => {
    render(<Harness />)
    const form = screen.getByRole('form', { name: 'Probe' }) as HTMLFormElement
    expect(form.tagName).toBe('FORM')
    expect(form.noValidate).toBe(true)
    expect(form.id).toBe('probe')
    expect(form.className).toContain('flex-col')
  })

  it('draws no box of its own around the fields', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('fieldset')?.className).toBe('contents')
  })

  it('switches off every field and button inside while busy, and back on after', () => {
    const { rerender } = render(<Harness />)
    const controls = () => [...screen.getAllByRole('textbox'), screen.getByRole('button', { name: 'Send' })]
    expect(controls().every((c) => !c.matches(':disabled'))).toBe(true)
    rerender(<Harness busy />)
    expect(controls().every((c) => c.matches(':disabled'))).toBe(true)
    rerender(<Harness />)
    expect(controls().every((c) => !c.matches(':disabled'))).toBe(true)
  })

  it("switches the package's own parts off in their own look, not only the browser's way", async () => {
    // A disabled part has pointer-events: none; the click is tried anyway, as a person would.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onTick = vi.fn()
    const parts = (busy: boolean) => (
      <Form onSubmit={() => {}} busy={busy} aria-label="Probe">
        <Button type="submit">Send</Button>
        <IconButton aria-label="Icon">x</IconButton>
        <Checkbox checked={false} onChange={onTick} aria-label="Bare" />
        <Checkbox checked={false} onChange={onTick} label="Words" />
      </Form>
    )
    const { rerender, getByRole, getByText } = render(parts(false))
    const drawnOff = () => ['Send', 'Icon'].map((name) => getByRole('button', { name }).hasAttribute('data-disabled'))
    expect(drawnOff()).toEqual([false, false])
    rerender(parts(true))
    // Button and IconButton take their switched-off classes from Base UI's state, which data-disabled shows.
    expect(drawnOff()).toEqual([true, true])
    expect(getByRole('checkbox', { name: 'Bare' }).getAttribute('aria-disabled')).toBe('true')
    // A checkbox is a span: the fieldset alone never stopped a click on it.
    await user.click(getByRole('checkbox', { name: 'Bare' }))
    await user.click(getByText('Words'))
    expect(onTick).not.toHaveBeenCalled()
    rerender(parts(false))
    expect(drawnOff()).toEqual([false, false])
  })

  it('holds focus on the form while busy, never on a disabled field', () => {
    const { rerender } = render(<Harness />)
    const field = screen.getByRole('textbox', { name: 'Second' })
    act(() => field.focus())
    rerender(<Harness busy />)
    expect(document.activeElement).toBe(screen.getByRole('form', { name: 'Probe' }))
    expect(document.activeElement?.matches(':disabled')).toBe(false)
  })

  it('holds focus even when the browser already dropped it to the page, as Chrome does', () => {
    const { rerender } = render(<Harness />)
    const field = screen.getByRole('textbox', { name: 'Second' })
    act(() => field.focus())
    // Chrome blurs a field the moment it is disabled, before any effect runs;
    // jsdom never does, so the test does it by hand.
    act(() => field.blur())
    rerender(<Harness busy />)
    expect(document.activeElement).toBe(screen.getByRole('form', { name: 'Probe' }))
    rerender(<Harness />)
    expect(document.activeElement).toBe(field)
  })

  it('does not take focus when it was last somewhere outside the form', () => {
    const { rerender } = render(
      <>
        <Harness />
        <button type="button">Elsewhere</button>
      </>,
    )
    act(() => screen.getByRole('textbox', { name: 'First' }).focus())
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus())
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).blur())
    rerender(
      <>
        <Harness busy />
        <button type="button">Elsewhere</button>
      </>,
    )
    expect(document.activeElement).toBe(document.body)
  })

  it('takes focus only while busy: the rest of the time it is not a Tab stop or a click target', () => {
    const { rerender } = render(<Harness />)
    const form = screen.getByRole('form', { name: 'Probe' })
    expect(form.hasAttribute('tabindex')).toBe(false)
    act(() => screen.getByRole('textbox', { name: 'First' }).focus())
    rerender(<Harness busy />)
    expect(form.getAttribute('tabindex')).toBe('-1')
    rerender(<Harness />)
    expect(form.hasAttribute('tabindex')).toBe(false)
  })

  describe('when busy ends, focus goes', () => {
    it('to the first invalid field', () => {
      const { rerender } = render(<Harness />)
      act(() => screen.getByRole('textbox', { name: 'First' }).focus())
      rerender(<Harness busy />)
      rerender(<Harness error="Not like that." />)
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Second' }))
    })

    it('else back to what sent the form', () => {
      const { rerender } = render(<Harness />)
      act(() => screen.getByRole('button', { name: 'Send' }).focus())
      rerender(<Harness busy />)
      rerender(<Harness />)
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Send' }))
    })

    it('else to the first control, when what sent it is gone', () => {
      function Vanishing({ busy, sent }: { busy: boolean; sent: boolean }) {
        return (
          <Form onSubmit={() => {}} busy={busy} aria-label="Probe">
            <Field label="First">
              <TextInput />
            </Field>
            {!sent && <Button type="submit">Send</Button>}
          </Form>
        )
      }
      const { rerender } = render(<Vanishing busy={false} sent={false} />)
      act(() => screen.getByRole('button', { name: 'Send' }).focus())
      rerender(<Vanishing busy sent={false} />)
      // Gone while the form waits, as a row that sent itself can be.
      rerender(<Vanishing busy sent />)
      rerender(<Vanishing busy={false} sent />)
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'First' }))
    })

    it('nowhere, when someone moved focus on while waiting', () => {
      const { rerender } = render(
        <>
          <Harness />
          <button type="button">Elsewhere</button>
        </>,
      )
      act(() => screen.getByRole('textbox', { name: 'First' }).focus())
      rerender(
        <>
          <Harness busy />
          <button type="button">Elsewhere</button>
        </>,
      )
      act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus())
      rerender(
        <>
          <Harness />
          <button type="button">Elsewhere</button>
        </>,
      )
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Elsewhere' }))
    })
  })

  it('a caller that waits: busy while sending, then back', async () => {
    const user = userEvent.setup()
    let finish: () => void = () => {}
    function Sending() {
      const [busy, setBusy] = useState(false)
      return (
        <Form
          aria-label="Probe"
          busy={busy}
          onSubmit={async () => {
            setBusy(true)
            await new Promise<void>((resolve) => (finish = resolve))
            setBusy(false)
          }}
        >
          <Field label="First">
            <TextInput />
          </Field>
        </Form>
      )
    }
    render(<Sending />)
    const field = screen.getByRole('textbox', { name: 'First' })
    await user.type(field, 'x{Enter}')
    expect(field.matches(':disabled')).toBe(true)
    expect(document.activeElement).toBe(screen.getByRole('form', { name: 'Probe' }))
    await act(async () => finish())
    expect(field.matches(':disabled')).toBe(false)
    expect(document.activeElement).toBe(field)
  })
})
