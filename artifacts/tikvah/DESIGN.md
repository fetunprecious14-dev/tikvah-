---
name: Tikvah
description: A calm, editorial support experience for tender moments.
colors:
  evergreen: "hsl(155 29% 31%)"
  warm-paper: "hsl(42 36% 95%)"
  warm-card: "hsl(42 33% 97%)"
  deep-ink: "hsl(154 20% 17%)"
  quiet-sage: "hsl(154 9% 43%)"
  soft-sand: "hsl(39 28% 89%)"
  hairline: "hsl(38 17% 84%)"
  clay: "hsl(12 47% 72%)"
  danger: "hsl(3 42% 42%)"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.625rem, 7vw, 4.875rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.evergreen}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.warm-card}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Tikvah

## Overview

**Creative North Star: "The Quiet Shelter"**

Tikvah pairs the composure of an editorial reading experience with the reassurance of a carefully prepared support space. Warm paper surfaces, deep evergreen actions, generous pauses, and humane copy keep the interface calm without making important decisions vague.

Operational screens stay scan-friendly and direct. Public support screens leave more breathing room, while forms and management tools use the same palette and typography at a denser rhythm.

**Key Characteristics:**

- Warm, low-contrast surfaces anchored by a deep evergreen action color.
- Editorial serif headlines paired with a practical sans-serif interface voice.
- Quiet borders, restrained depth, and generous vertical rhythm.
- Direct state labels and recovery-oriented error copy.

## Colors

Evergreen carries decisions and active navigation; warm paper and sand provide calm separation without stark white surfaces.

**The Deliberate Green Rule.** Reserve evergreen for actions, focus, and meaningful state—not decoration.

## Typography

**Display Font:** Newsreader with Georgia fallback
**Body Font:** DM Sans with sans-serif fallback

Newsreader gives major headings warmth and reflection. DM Sans keeps navigation, forms, labels, and support copy clear under stress.

### Hierarchy

- **Display:** Regular weight, tightly set, responsive, and no larger than the established 4.875rem ceiling.
- **Title:** Newsreader at 1.5–2.25rem for page sections and professional names.
- **Body:** DM Sans at 0.9375–1.0625rem with generous 1.5–1.75 line height and a readable 65–75 character measure.
- **Label:** DM Sans semibold at 0.75–0.8125rem for controls and compact status text.

**The Two Voices Rule.** Newsreader carries reflection and orientation; DM Sans carries every action and detail.

## Layout

Public pages use a centered 1220px maximum container; admin work narrows to 1100px. Horizontal padding is 20px on phones and 32px from the small breakpoint upward. Two-column content collapses to one column before controls become cramped. Related controls use 12–16px gaps, while sections use 24–64px separation.

## Elevation & Depth

The system is flat by default. Borders and tonal surface shifts establish hierarchy. A single ambient shadow (`0 20px 60px rgba(49, 67, 54, 0.08)`) is reserved for temporary lifted surfaces and purposeful hover feedback.

**The Flat-at-Rest Rule.** Persistent cards use border or tone; shadows indicate elevation or interaction.

## Shapes

Content containers use gently curved 12–16px corners. Inputs and standard controls use 8–12px corners. Full pills are reserved for compact actions, filters, and status controls; large content surfaces do not become pills.

## Components

### Buttons

- Primary buttons use evergreen with warm-paper text and clear disabled opacity.
- Outline buttons inherit the surrounding surface with a quiet hairline border.
- Hover may add a slight lift; focus always uses the shared evergreen ring.

### Cards / Containers

- Cards use warm-card, a 12px corner, a hairline border, and 24px internal padding.
- Status, title, descriptive content, and actions remain visibly separated.

### Inputs / Fields

- Inputs use transparent backgrounds, quiet borders, and explicit visible labels.
- Invalid fields pair destructive color with readable recovery text and `aria-invalid`.
- Related settings use horizontal labels only when the phone layout remains clear.

### Navigation

Navigation uses small DM Sans labels, muted defaults, evergreen active states, and a compact mobile menu. Crisis help stays visually and verbally distinct from ordinary navigation.

## Do's and Don'ts

### Do:

- **Do** make the safest useful next action obvious within the first scan.
- **Do** use warm surfaces and whitespace to separate content before adding decoration.
- **Do** write control labels that state the outcome: “Save draft,” “Save and publish,” and “Delete permanently.”
- **Do** provide loading, empty, error, disabled, and recovery states.

### Don't:

- **Don't** use raw bright colors when an established semantic token exists.
- **Don't** blur the distinction between professional support and emergency care.
- **Don't** hide important fields behind icon-only controls without accessible labels.
- **Don't** invent practitioner claims, verification, availability, or imagery.
