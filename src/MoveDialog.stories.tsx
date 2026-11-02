import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { MoveDialog, type MovePlace } from './MoveDialog'

const FOLDERS = [
  { id: 'hq', name: 'Estiva HQ' },
  { id: 'peek', name: 'Peek' },
  { id: 'steer', name: 'Steer' },
]
const TOP: MovePlace = { id: '', path: [] }
const PROJECT: MovePlace = { id: '30850:a:folders', path: ['Folders: navigation for the whole suite'] }
const BRIEF: MovePlace = { id: '30840:a:brief', path: ['Folders: navigation for the whole suite', 'Brief'] }

/**
 * Moving a file to another Folder, under another file, or both. The places in
 * its own Folder are the caller's, read before it opens; another Folder's are
 * read when it is picked.
 */
const meta = {
  title: 'Menus & windows/MoveDialog',
  component: MoveDialog,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '560px' } },
  },
  argTypes: { onMove: { control: false }, onClose: { control: false }, placesIn: { control: false } },
  args: {
    title: 'Notes',
    description: 'Everyone who can read it now still can.',
    from: 'hq',
    folders: FOLDERS,
    places: [TOP, PROJECT, BRIEF],
    placesIn: async (): Promise<readonly MovePlace[]> => [TOP, { id: '30840:a:brief', path: ['Brief'] }],
    startAtTop: true,
    onMove: async () => true,
    onClose: () => {},
  },
} satisfies Meta<typeof MoveDialog>

export default meta
type Story = StoryObj<typeof meta>

const pickSteer = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const page = within(canvasElement.ownerDocument.body)
  await userEvent.click(page.getByRole('combobox', { name: 'Folder' }))
  await userEvent.click(await page.findByRole('option', { name: 'Steer' }))
}

/** A file that may sit under any other: its own Folder first, at the top, with every other place there. */
export const Topic: Story = {}

/** A file that nests under nothing: only the Folder is asked, and not the one it is in. Move waits for a pick. */
export const Project: Story = {
  args: { title: 'Folders: navigation for the whole suite', places: undefined, placesIn: undefined },
}

/** Nowhere to go in its own Folder: one holding only this file and what is under it. */
export const NowhereHere: Story = {
  name: 'Nowhere here',
  args: { places: [] },
}

/** Another Folder could not be read: the section's empty line, with Try again. */
export const FolderUnreadable: Story = {
  name: 'Folder unreadable',
  args: { places: [], placesIn: (): Promise<readonly MovePlace[]> => Promise.reject(new Error('down')) },
  play: pickSteer,
}

/** Another Folder, still being read: the second list says so and waits. */
export const ReadingAFolder: Story = {
  name: 'Reading a folder',
  args: { placesIn: () => new Promise<readonly MovePlace[]>(() => {}) },
  play: pickSteer,
}

/** A file whose parent is one kind: the empty place is "none", and nothing is chosen for the person. */
export const UnderNone: Story = {
  name: 'Under none',
  args: { startAtTop: false, topLabel: 'None — under none of these', places: [TOP, PROJECT] },
}

/** The Folders are still being read: the list says so. */
export const ReadingFolders: Story = {
  name: 'Reading folders',
  args: { folders: undefined },
}

/** No Folder to offer: said in the dialog's body, and Move stays greyed. */
export const NoOtherFolder: Story = {
  name: 'No other folder',
  args: { folders: [FOLDERS[0]], places: undefined, placesIn: undefined },
}

/** Another app's words, opening on the Folder the app chose. */
export const AnotherAppsWords: Story = {
  name: 'Another app’s words',
  args: {
    heading: 'Move to Folder',
    folderLabel: 'Destination Folder',
    noFolder: 'There is no other Folder it can be moved to.',
    description: 'Only the Folder it is listed in changes. Its issues and its conversation stay exactly as they are.',
    title: 'Folders: navigation for the whole suite',
    places: undefined,
    placesIn: undefined,
    startIn: 'steer',
  },
}

/**
 * A file listed in two Folders, after a move that half-worked: `from` is empty, so every Folder is offered, the ones
 * it is in too, since moving into one takes it out of the other; Move again is the retry. Nothing is chosen for the
 * person. The story opens the list.
 */
export const ListedTwice: Story = {
  name: 'Listed in two Folders',
  args: { title: 'Folders: navigation for the whole suite', from: '', places: undefined, placesIn: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('combobox', { name: 'Folder' }))
  },
}

/** Moving: the button says so, and everything waits for the answer. */
export const Moving: Story = {
  args: { onMove: () => new Promise<boolean>(() => {}) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Move' }))
  },
}

/** The move was refused: it stays open, and the caller has said why. */
export const Refused: Story = {
  args: { onMove: async () => false },
}
