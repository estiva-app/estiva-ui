import { useState, type ReactNode } from 'react'
import { IconCircleCheck, IconCircleDashed, IconMessage2, IconMoodPlus } from '@tabler/icons-react'
import { cn } from './cn'
import { Popover } from './Popover'
import { ReactionPicker, type ReactionOption } from './ReactionPicker'
import { Toolbar, ToolbarButton, ToolbarSeparator } from './Toolbar'

export interface ConversationActionsProps {
  /** The reactions on offer: with `onReact`, "React" opens them over the strip. */
  options?: readonly ReactionOption[]
  onReact?: (emoji: string) => void
  onReply?: () => void
  /** Resolved: the strip offers Reopen in place of Resolve. */
  resolved?: boolean
  onResolve?: () => void
  onReopen?: () => void
  /** Told when the reactions open and close, so a card can keep its strip while they are up. */
  onPickerOpenChange?: (open: boolean) => void
  /** The ⋯ menu: a `ConversationMenu` whose trigger is a `ToolbarButton`, so the strip stays one Tab stop. */
  more?: ReactNode
  /** Placement only: `absolute right-1 top-1`. */
  className?: string
}

/**
 * The strip on a comment or a reply while it is pointed at: React · Reply · Resolve or Reopen · ⋯, each drawn only
 * when the card offers it, a line only between two groups that are both there. One Tab stop; the arrow keys walk the buttons. Peek's, moved with the conversation.
 */
export function ConversationActions({ options, onReact, onReply, resolved = false, onResolve, onReopen, onPickerOpenChange, more, className }: ConversationActionsProps) {
  const [picking, setPicking] = useState(false)
  // The reactions hang from the whole strip, right-aligned, not from their own button.
  const [strip, setStrip] = useState<HTMLDivElement | null>(null)
  const setOpen = (open: boolean) => {
    setPicking(open)
    onPickerOpenChange?.(open)
  }
  const resolves = resolved ? onReopen : onResolve
  const answers = (!!onReact && !!options) || !!onReply
  return (
    <div ref={setStrip} className={cn('inline-flex', className)}>
      <Toolbar aria-label="Actions">
        {onReact && options && (
          <Popover
            side="top"
            align="right"
            anchor={strip}
            ariaLabel="Reactions"
            className="w-auto min-w-0"
            contentClassName="p-1"
            open={picking}
            onOpenChange={setOpen}
            trigger={
              <ToolbarButton tooltip="React" aria-label="React">
                <IconMoodPlus size={16} stroke={1.5} />
              </ToolbarButton>
            }
          >
            <ReactionPicker
              options={[...options]}
              surface={false}
              onSelect={(emoji) => {
                setOpen(false)
                onReact(emoji)
              }}
            />
          </Popover>
        )}
        {onReply && (
          <ToolbarButton tooltip="Reply" aria-label="Reply" onClick={onReply}>
            <IconMessage2 size={16} stroke={1.5} />
          </ToolbarButton>
        )}
        {resolves && (
          <>
            {answers && <ToolbarSeparator />}
            {resolved ? (
              <ToolbarButton tooltip="Reopen" aria-label="Reopen" onClick={onReopen}>
                <IconCircleDashed size={16} stroke={1.5} />
              </ToolbarButton>
            ) : (
              <ToolbarButton variant="resolve" tooltip="Resolve" aria-label="Resolve" onClick={onResolve}>
                <IconCircleCheck size={16} stroke={1.5} />
              </ToolbarButton>
            )}
          </>
        )}
        {more && (
          <>
            {(answers || resolves) && <ToolbarSeparator />}
            {more}
          </>
        )}
      </Toolbar>
    </div>
  )
}
