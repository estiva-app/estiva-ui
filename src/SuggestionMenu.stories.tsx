import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Extension } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Suggestion from '@tiptap/suggestion'
import { EnterHint } from './Menu'
import { richTextClassName } from './RichText'
import { SuggestionMenu, type SuggestionMenuHandle, type SuggestionMenuRow, type SuggestionMenuSection } from './SuggestionMenu'
import { suggestionPopup } from './suggestionPopup'

/**
 * The list a text editor opens as you type — `/` for commands, `@` for people.
 * Focus stays in the text: the editor hands its ↑, ↓ and Enter to the list.
 */
const meta = {
  title: 'Primitives/SuggestionMenu',
  component: SuggestionMenu,
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

interface Command {
  id: string
  label: string
  keys?: string
}

const FORMAT: Command[] = [
  { id: 'text', label: 'Text' },
  { id: 'heading', label: 'Heading', keys: '#' },
  { id: 'subheading', label: 'Subheading', keys: '##' },
  { id: 'quote', label: 'Quote', keys: '>' },
  { id: 'code', label: 'Code', keys: '`' },
  { id: 'bullets', label: 'Bulleted list', keys: '-' },
  { id: 'numbers', label: 'Numbered list', keys: '1.' },
]
const INSERT: Command[] = [
  { id: 'item-one', label: 'Item one' },
  { id: 'item-two', label: 'Item two' },
]
const commandRow = (c: Command): SuggestionMenuRow => ({ label: c.label, shortcut: c.keys })

/**
 * A line of text with the caret's place marked, and the list hung from it —
 * the way the editor hangs it. The list is drawn from a rect, so the story
 * measures a stand-in for the caret once it is on screen.
 */
function AtACaret<T>({ children, ...props }: { children?: ReactNode } & Omit<Parameters<typeof SuggestionMenu<T>>[0], 'rect'>) {
  const caret = useRef<HTMLSpanElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  useLayoutEffect(() => setRect(caret.current?.getBoundingClientRect() ?? null), [])
  return (
    <div className="flex h-[520px] items-end pb-6 text-body-2 text-text-primary">
      <p>
        Some text, then a slash
        <span ref={caret}>/</span>
        {children}
      </p>
      <SuggestionMenu<T> {...props} rect={rect} />
    </div>
  )
}

/** Two sections: headings, keys you could type instead, a hairline between. */
export const Default: Story = {
  render: () => (
    <AtACaret<Command>
      ariaLabel="Commands"
      width="w-[300px]"
      maxHeight="max-h-[400px]"
      sections={[
        { label: 'Format', items: FORMAT },
        { label: 'Insert', items: INSERT },
      ]}
      itemKey={(c) => c.id}
      row={commandRow}
      onSelect={() => {}}
    />
  ),
}

/** No heading: rows the editor ranks itself, 2px apart as under one. */
export const NoHeading: Story = {
  render: () => (
    <AtACaret<Command>
      ariaLabel="Commands"
      width="w-[300px]"
      maxHeight="max-h-[400px]"
      sections={[{ items: FORMAT }]}
      itemKey={(c) => c.id}
      row={commandRow}
      onSelect={() => {}}
    />
  ),
}

/** Tall rows: a face, a second line, and Enter's hint on the highlighted one. */
export const TallRows: Story = {
  render: () => (
    <AtACaret<string>
      ariaLabel="Items"
      width="w-[360px]"
      maxHeight="max-h-[360px]"
      sections={[{ label: 'Items', items: ['Item one', 'Item two', 'Item three'], className: 'px-3 py-1' }]}
      itemKey={(s) => s}
      row={(s) => ({
        label: s,
        description: 'A second line',
        leading: <IconSquareRounded size={32} stroke={1.5} className="text-text-muted" />,
        hint: <EnterHint />,
        size: 'tall',
      })}
      onSelect={() => {}}
    />
  ),
}

/** More rows than fit: the box stops at `maxHeight` and scrolls in the package's scroll area. */
export const Scrolling: Story = {
  render: () => (
    <AtACaret<string>
      ariaLabel="Items"
      width="w-[300px]"
      maxHeight="max-h-[240px]"
      sections={[{ label: 'Items', items: Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`) }]}
      itemKey={(s) => s}
      row={(s) => ({ label: s })}
      onSelect={() => {}}
    />
  ),
}

/** The keys, driven from outside as an editor drives them: ↓ twice moves the highlight to the third row. */
export const DrivenByKeys: Story = {
  render: () => {
    function Driven() {
      const handle = useRef<SuggestionMenuHandle>(null)
      const [picked, setPicked] = useState('nothing yet')
      const sections = useMemo<SuggestionMenuSection<Command>[]>(() => [{ label: 'Format', items: FORMAT }], [])
      useLayoutEffect(() => {
        const press = (key: string) => handle.current?.onKeyDown(new KeyboardEvent('keydown', { key }))
        requestAnimationFrame(() => {
          press('ArrowDown')
          press('ArrowDown')
        })
      }, [])
      return (
        <AtACaret<Command> handle={handle} ariaLabel="Commands" width="w-[300px]" maxHeight="max-h-[400px]" sections={sections} itemKey={(c) => c.id} row={commandRow} onSelect={(c) => setPicked(c.label)}>
          <span className="ml-4 text-text-secondary">Chosen: {picked}</span>
        </AtACaret>
      )
    }
    return <Driven />
  },
}

/*
 * In a real editor: `suggestionPopup` connects a Tiptap suggestion plugin to
 * this list. Type `/` anywhere after a space; ↑ ↓ Enter choose, Escape closes,
 * and typing narrows the list.
 */
const Commands = Extension.create({
  name: 'storyCommands',
  addProseMirrorPlugins() {
    return [
      Suggestion<Command>({
        editor: this.editor,
        char: '/',
        items: ({ query }) => [...FORMAT, ...INSERT].filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }) => {
          const chain = editor.chain().focus().deleteRange(range)
          if (props.id === 'heading') chain.setHeading({ level: 1 }).run()
          else if (props.id === 'subheading') chain.setHeading({ level: 2 }).run()
          else if (props.id === 'quote') chain.setBlockquote().run()
          else if (props.id === 'code') chain.setCodeBlock().run()
          else if (props.id === 'bullets') chain.toggleBulletList().run()
          else if (props.id === 'numbers') chain.toggleOrderedList().run()
          else chain.setParagraph().run()
        },
        render: suggestionPopup<Command>({
          ariaLabel: 'Commands',
          width: 'w-[300px]',
          maxHeight: 'max-h-[400px]',
          sections: (items) => [
            { label: 'Format', items: items.filter((c) => FORMAT.includes(c)) },
            { label: 'Insert', items: items.filter((c) => INSERT.includes(c)) },
          ],
          itemKey: (c) => c.id,
          row: commandRow,
        }),
      }),
    ]
  },
})

/** A real editor with `/` wired through `suggestionPopup` (`@estiva-app/ui/editor`). Click in and type `/`. */
export const InAnEditor: Story = {
  render: () => {
    function Live() {
      const editor = useEditor({
        extensions: [StarterKit, Commands],
        content: '<p>Click here, then type / after a space.</p>',
        editorProps: { attributes: { class: richTextClassName('default', 'outline-none min-h-24'), 'aria-label': 'Text' } },
      })
      return (
        <div className="flex h-[520px] items-end pb-6">
          <EditorContent editor={editor} className="w-full rounded-md border border-border-default bg-bg-surface p-3" />
        </div>
      )
    }
    return <Live />
  },
}
