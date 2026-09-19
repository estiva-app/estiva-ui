import { Component, type ReactNode } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'

/**
 * Catches a part of the page that crashes, and shows "Something went wrong …
 * Your data is safe — try again." with a Try again button in its place, so the
 * rest of the app keeps working. Try again draws that part again.
 *
 * Moved in from Peek as it was (UIG-14, D3, Katerina 19 September), where one
 * wrapped each panel and the whole app. `ListColumn` holds one of its own.
 */
export interface ErrorBoundaryProps {
  children: ReactNode
  /** What it holds, said in the message and the console line: "Something went wrong in the {label}." */
  label?: string
  /** The room the message fills where no flex column holds it — the whole screen, for the app's own. */
  fallbackClassName?: string
  /** Draws the message inside a frame of yours, in the same place: `ListColumn` keeps its title this way. */
  frame?: (message: ReactNode) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Keeps a crash inside what it holds: the rest of the page keeps working, and Try again draws it again. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    console.error(`${this.props.label ?? 'part of the page'} crashed:`, error, info.componentStack ?? '')
  }

  render() {
    if (!this.state.hasError) return this.props.children
    // EmptyState with its one action: in a flex column it takes the room and centres itself, with no box.
    const message = (
      <EmptyState
        icon={<IconAlertTriangle size={16} stroke={1.5} />}
        message={`Something went wrong${this.props.label ? ` in the ${this.props.label}` : ''}. Your data is safe — try again.`}
        action={{ label: 'Try again', onClick: () => this.setState({ hasError: false }) }}
      />
    )
    // Around a column: the column is drawn again, with the message in it.
    if (this.props.frame) return this.props.frame(message)
    // The whole app's: no column around it, so it names its own room.
    return this.props.fallbackClassName ? <div className={this.props.fallbackClassName}>{message}</div> : message
  }
}
