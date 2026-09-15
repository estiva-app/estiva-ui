import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
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
 * On Base UI's `Avatar` since stage 6 of the migration (2026-09-14): Base UI
 * loads the picture and says when it has arrived or failed, and the initials
 * or the silhouette are its fallback. The hand-kept "broken" state is gone.
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
  const words = name.split(/\s+/).slice(0, 2).filter((w) => /^[\p{L}\p{N}]/u.test(w))
  const initials = words.map((w) => w[0]).join('') || name.trim().charAt(0)
  return initials.toUpperCase()
}

export interface AvatarProps {
  /** The picture URL, resolved by the caller. Until it arrives, and if it fails, the initials show. */
  src?: string
  /** The person's name — where the initials and the colour come from. */
  name?: string
  /** Alt text for the picture; the name when absent. Also the initials' source when there is no name. */
  alt?: string
  /** Pixels. The scale: 16 · 24 · 32 · 36 (default). */
  size?: number
  /**
   * **Say the person's name out loud**, for a face that stands on its own —
   * `PersonTrigger`'s compact shape, a stack of members.
   *
   * A face is silent by default, because almost every face in the suite sits
   * beside the name it belongs to: `Person`, a `MenuItem`'s `leading`, a row.
   * A picture that spoke there would double the name — measured 2026-09-08,
   * before this existed: a `Person` in a button announced **"AD Ana Duarte"**,
   * and with a picture **"Ana Duarte Ana Duarte"**. The initials are a drawing
   * of a name, not text, and a screen reader was reading them as text.
   */
  label?: string
  className?: string
}

export function Avatar({ src, name, alt = '', size = 36, label: spoken, className }: AvatarProps) {
  const label = name || alt
  return (
    <BaseAvatar.Root
      // A div, as it was drawn: Base UI's default is a span.
      render={<div />}
      /* Named or silent, never half of either: with a `label` the tile is one
         image with one name, and everything inside it is that image's pixels;
         without one it is not in the accessibility tree at all. */
      {...(spoken ? { role: 'img', 'aria-label': spoken } : { 'aria-hidden': true })}
      className={cn('rounded-sm overflow-hidden shrink-0 bg-bg-inset', className)}
      style={{ width: size, height: size }}
    >
      {src && (
        <BaseAvatar.Image
          src={src}
          alt=""
          /*
            `keepMounted`: the <img> is in the tile from the first render, as it
            always was, so a picture still loading leaves the tile empty rather
            than flashing initials and swapping them out, and an app's test that
            finds the <img> still finds it. The fallback is rendered after it,
            below the tile's hidden overflow, until the picture arrives (then it
            unmounts) or fails (then the picture is hidden and it moves up).
          */
          keepMounted
          className="w-full h-full object-cover data-[error]:hidden"
        />
      )}
      {label ? (
        <BaseAvatar.Fallback
          render={<div />}
          /*
            `leading-none` is load-bearing (2026-09-03). Centring a flex child
            centres its LINE BOX, and a line box reserves room under the
            baseline for descenders — which capitals never use — so initials
            floated above the middle of every tile. It also inherited whatever
            line-height surrounded it, so the same face sat differently in a
            members pill and in a replies row. Measured over six letter pairs
            at 18/24/36px: mean 0.64px high before, 0.06px after.

            Per-letter variation stays (a "Y" carries its mass up top, a "ZB"
            more than an "AJ") — that is the letterform, not the box, and it
            is not something a rule here can flatten.
          */
          className="w-full h-full flex items-center justify-center font-semibold leading-none"
          style={{
            /* eslint-disable no-restricted-syntax -- the per-person palette (the note at
               the top): eight hues picked from the name, the one ink that reads on all
               of them, and a size that follows `size`. None of it can be a token. */
            // The one ink colour that reads on all eight hues, which are a
            // palette rather than tokens (see the note at the top) — so its
            // ink cannot be a token either.
            color: '#08121c',
            fontSize: Math.round(size * 0.36),
            background: `linear-gradient(160deg, color-mix(in srgb, ${hueFor(label)} 92%, #fff) 0%, color-mix(in srgb, ${hueFor(label)} 70%, #0b0d11) 100%)`,
            /* eslint-enable no-restricted-syntax */
          }}
        >
          {/*
            D27 (ruled 2026-09-08, built 2026-09-14): what is centred is the
            capitals' own box, cap height to baseline, not the line box. The
            line box's ascent and descent are rounded to whole pixels before
            it is centred, which put the baseline up to 0.73px from where
            centred capitals put it (at 24px: 14.5 against 15.23); trimmed, it
            lands within 0.06px. On screen, averaged over eight sub-pixel
            positions, the ink leaned 0.66px high at 24px, 0.44px at 28px and
            0.27px low at 22px; now every size averages within 0.07px of the
            middle. Any one face can still sit up to half a pixel off, because
            the screen rounds text to its pixel grid wherever the tile falls.
            A browser without `text-box` draws the old line box, as before.
          */}
          <span className="[text-box:trim-both_cap_alphabetic]">{initialsFor(label)}</span>
        </BaseAvatar.Fallback>
      ) : (
        <BaseAvatar.Fallback render={<div />} className="w-full h-full bg-accent-muted flex items-center justify-center text-text-muted">
          <IconUserFilled size={Math.round(size * 0.5)} />
        </BaseAvatar.Fallback>
      )}
    </BaseAvatar.Root>
  )
}
