---
name: Ce Să Fiu Design System
colors:
  surface: '#fef9f1'
  surface-dim: '#ded9d2'
  surface-bright: '#fef9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3eb'
  surface-container: '#f2ede5'
  surface-container-high: '#ece8e0'
  surface-container-highest: '#e7e2da'
  on-surface: '#1d1c17'
  on-surface-variant: '#494454'
  inverse-surface: '#32302b'
  inverse-on-surface: '#f5f0e8'
  outline: '#7b7486'
  outline-variant: '#cbc3d7'
  surface-tint: '#6d3bd7'
  primary: '#6b38d4'
  on-primary: '#ffffff'
  primary-container: '#8455ef'
  on-primary-container: '#fffbff'
  inverse-primary: '#d0bcff'
  secondary: '#456800'
  on-secondary: '#ffffff'
  secondary-container: '#a7f600'
  on-secondary-container: '#486d00'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#caa900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#a9f900'
  secondary-fixed-dim: '#94db00'
  on-secondary-fixed: '#121f00'
  on-secondary-fixed-variant: '#334f00'
  tertiary-fixed: '#ffe170'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fef9f1'
  on-background: '#1d1c17'
  surface-variant: '#e7e2da'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 120px
---

## Brand & Style

The design system is built for the "Main Character" energy of Gen Z. It rejects the polished, sterile aesthetics of traditional corporate tools in favor of **Neo-brutalism** mixed with **Playful Corporate** elements. The goal is to feel like a high-energy social media feed—vibrant, slightly chaotic, and deeply authentic.

The visual language uses heavy black strokes and "hard" shadows to create a tactile, sticker-like quality. It communicates career guidance not as a boring bureaucratic process, but as a high-stakes, exciting quest. The tone is irreverent and conversational, speaking to the user like a mentor who actually uses TikTok. 

This design system prioritizes high contrast and "raw" layouts to evoke a sense of immediacy and transparency, ensuring the Romanian Gen Z audience feels seen and understood.

## Colors

The palette is loud and unapologetic. **Electric Purple** serves as the primary brand driver, used for key actions and progress indicators. **Neon Green** and **Bold Yellow** are utilized for accents, status changes, and "sticker" highlights to draw the eye to critical information.

Based on the existing brand profile, we retain `#FBF6EE` as the "paper" background color, providing a warm, slightly vintage contrast to the neon accents. Pure black (#000000) is used exclusively for borders, typography, and hard shadows to maintain the brutalist structure.

Colors should be used in high-contrast pairings: Purple on Yellow, Green on Black, or Black on White. Never use gradients; keep every color field flat and solid.

## Typography

The typography system is built on the interplay between the chunky, geometric **Epilogue** for headings and the clean, approachable **Be Vietnam Pro** for body content. 

Headlines should be set with tight leading and slightly negative letter spacing to create a "blocky" magazine feel. Use "Headline XL" for major provocations and Romanian slang hooks (e.g., **"Gata de drum?"**). 

Body text remains highly legible to ensure the career advice is accessible. Labels and buttons should utilize the bold weights of Be Vietnam Pro to stand out against the high-intensity background colors.

## Layout & Spacing

This design system uses a **fluid grid** model that adapts to mobile-first usage patterns common in social media apps. On mobile, a 4-column layout is used with 20px side margins; on desktop, a 12-column grid provides structure for more complex quiz results.

Spacing is intentional and "un-contained." Elements often overlap or sit very close to the edge of containers to mimic the crowded, energetic layout of a zine or a sticker-covered laptop. Gutters are kept tight at 16px to maintain a high-density feel, while large vertical "XL" spacers are used between major sections to provide breathing room for the eye.

## Elevation & Depth

Depth is conveyed through **Hard Shadows** and **Bold Borders** rather than lighting or blurs. Every elevated element—whether a card, a button, or an input—must feature a solid 2px black border.

To simulate a "floating" or "sticker" effect, elements use a hard, non-blurred shadow (offset 4px or 8px) in pure black. 
- **Level 1 (Static):** 2px border, no shadow.
- **Level 2 (Interactive/Cards):** 2px border, 4px black shadow.
- **Level 3 (Pop-ups/Key CTA):** 2px border, 8px black shadow.

When an element is "pressed" or active, the shadow disappears and the element shifts by the shadow's offset amount, creating a tactile, mechanical feel.

## Shapes

The shape language is "Soft-Brutalist." While traditional brutalism uses sharp 90-degree angles, this system uses a subtle **0.25rem (4px)** radius on most containers to make the UI feel modern and "app-like."

"Sticker" elements—such as tags or floating chips—may use a higher `rounded-lg` (8px) setting to differentiate them from structural cards. All shapes must maintain their heavy black stroke regardless of their corner radius.

## Components

### Buttons
Buttons are the core of the experience. They must be chunky, featuring a 2px black border and a 4px hard shadow. The default state uses **Electric Purple** with white text. The hover/active state removes the shadow and shifts the button down-right.
*   *Slang usage:* "Hai să vedem" (Let's see), "Dă-i bătaie!" (Go for it!).

### Cards
Cards use a white or **Bold Yellow** background with a black border. They are the primary containers for quiz questions. Use "sticker-style" badges in the top corners to indicate categories or progress.

### Inputs
Text inputs use the **#FBF6EE** background with a 2px black border. When focused, the border weight remains the same but the background color shifts to a very light tint of the primary purple.

### Chips & Tags
Used for career tags or "vibe" selectors. These should look like physical stickers, often rotated by 1–2 degrees to create an organic, messy feel.

### Progress Bar
A thick, horizontal bar with a black border. The "fill" should be **Neon Green**, moving in chunky blocks rather than a smooth gradient.

### Quiz Navigation
Use "Ce urmează?" (What's next?) and "Înapoi la bază" (Back to base) as navigation labels to keep the tone informal and energetic.