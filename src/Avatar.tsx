import { useState } from 'react'
import { IconUserFilled } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * A person's face: their picture, or their initials on a colour that is
 * theirs, or — when there is no name to take initials from — a silhouette.
 *
 * Peek's Avatar (2026-08-28), made self-contained: Peek's version found the
 * picture itself, by name, from Peek's data (an upload in Convex, else the
 * demo portrait), and switched the initials on only under its Signal theme.
 * Neither belongs in a shared component, so this one takes the picture URL
 * from its caller and draws the initials in every theme. Peek keeps a
 * three-line wrapper that resolves the picture; Ship passes the relay's
 * `kind:0` picture straight in.
 *
 * Initials come from a *name*, never from a key: a component that accepted a
 * pubkey would eventually show one (Ship's ruling, 2026-08-24). An unnamed
 * person is the silhouette — `?` on a bright gradient read as an error badge
 * rather than a person (Peek, FEE-1).
 *
 * The hue is a fallback palette, not a token: it is per person, chosen
 * from the name so the same person is the same colour everywhere, and a
 * theme has no say in it. Peek's eight, verbatim.
 */
const HUES = ['#56c8ff', '#ff8f6b', '#4ade8c', '#b18cff', '#ffc94d', '#ff7eb0', '#7ea8ff', '#5fdfd6']

export const hueFor = (key: string) => {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return HUES[Math.abs(h) % HUES.length]
}

/**
 * Peek's rule, sharpened: the first letter of the first two words — counting
 * only words that begin with a letter or digit, so "Claude (steered by
 * Katerina Kelepouri)" shows "C", never "C(" (Katerina, 2026-09-01: a name
 * carrying such symbols gets a single letter rather than one of them).
 */
export const initialsFor = (name: string) => {
  const words = name.split(/s+/).filter((w) => /^[p{L}p{N}]/u.test(w))
  const initials = words.slice(0, 2).map((w) => w[0]).join('') || name.trim().charAt(0)
  return initials.toUpperCase()
}

export interface AvatarProps {
  /** The picture URL, resolved by the caller. A picture that fails to load falls back to the initials. */
  src?: string
  /** The person's name — where the initials and the colour come from. */
  name?: string
  /** Alt text for the picture; the name when absent. Also the initials' source when there is no name. */
  alt?: string
  /** Pixels. Peek's scale: 16 · 24 · 32 · 36 (default). */
  size?: number
  className?: string
}

export function Avatar({ src, name, alt = '', size = 36, className }: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const label = name || alt
  const picture = src && !broken ? src : undefined
  return (
    <div className={cn('rounded-sm overflow-hidden shrink-0 bg-bg-inset', className)} style={{ width: size, height: size }}>
      {picture ? (
        <img src={picture} alt={alt || name || ''} className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : label ? (
        <div
          className="w-full h-full flex items-center justify-center font-semibold"
          style={{
            color: '#08121c',
            fontSize: Math.round(size * 0.36),
            background: `linear-gradient(160deg, color-mix(in srgb, ${hueFor(label)} 92%, #fff) 0%, color-mix(in srgb, ${hueFor(label)} 70%, #0b0d11) 100%)`,
          }}
        >
          {initialsFor(label)}
        </div>
      ) : (
        <div className="w-full h-full bg-accent-muted flex items-center justify-center text-text-muted">
          <IconUserFilled size={Math.round(size * 0.5)} />
        </div>
      )}
    </div>
  )
}
