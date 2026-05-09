---
name: frontend-design
description: This skill should be used when the user asks to "build a frontend", "create a React component", "add animations", "design a landing page", "make it look modern", "add animated backgrounds", "create hero section", "design dashboard UI", or wants to use ReactBits components for stunning visual interfaces.
version: 0.1.0
---

# Frontend Design with ReactBits

## Purpose

This skill provides comprehensive guidance for building distinctive, production-grade frontend interfaces using ReactBits—an open-source collection of 135+ animated, interactive React components. ReactBits specializes in creative UI elements that help applications stand out visually, including text animations, animated backgrounds, and interactive components.

Use this skill when building modern React frontends that require visual impact, smooth animations, and memorable user experiences. ReactBits complements traditional component libraries (like shadcn/ui for forms and buttons) by providing the creative, animated elements that make interfaces memorable.

## When to Use ReactBits

**Use ReactBits components for:**

- Hero sections with animated text or backgrounds
- Landing pages requiring visual impact
- Interactive dashboards with animated metrics
- Portfolio sites with creative transitions
- Marketing pages with eye-catching animations
- Creative UI elements that need to stand out
- Background effects and ambient animations

**Don't use ReactBits for:**

- Basic form inputs and buttons (use shadcn/ui, Radix, etc.)
- Standard CRUD interfaces
- Simple admin panels without creative requirements
- Projects with strict accessibility-first requirements (verify component compatibility first)

## Installation Methods

### Method 1: CLI Installation (Recommended)

ReactBits integrates with shadcn CLI for seamless installation:

```bash
npx shadcn@latest add @react-bits/ComponentName-TS-TW
```

Replace `ComponentName` with the specific component and choose your variant:
- `JS-CSS` - JavaScript with CSS
- `JS-TW` - JavaScript with Tailwind CSS
- `TS-CSS` - TypeScript with CSS
- `TS-TW` - TypeScript with Tailwind CSS (most common)

**Example:**
```bash
npx shadcn@latest add @react-bits/BlurText-TS-TW
```

### Method 2: Manual Copy-Paste

1. Browse components at [reactbits.dev](https://reactbits.dev)
2. Select your technology stack (JS/TS, CSS/Tailwind)
3. Copy the component code directly
4. Paste into your components directory
5. Customize as needed

## Component Selection Strategy

### 1. Understand the Four Categories

**Text Animations** - Dynamic text effects:
- BlurText, TypingEffect, WavyText, GlitchText
- Use for: Headlines, hero titles, attention-grabbing text
- When: Landing pages, headers, marketing content

**UI Components** - Interactive interface elements:
- AnimatedCard, HoverButton, ParallaxScroll, RevealLinks
- Use for: Interactive sections, content cards, navigation
- When: Product showcases, feature sections, portfolios

**Backgrounds** - Animated background effects:
- ParticleBackground, GradientMesh, AnimatedGrid, WaveBackground
- Use for: Section backgrounds, hero backgrounds, ambient effects
- When: Full-page sections, landing page heroes, creative layouts

**Animations** - Motion-based components:
- FadeIn, SlideIn, ScaleIn, RotateIn, BounceIn
- Use for: Enter animations, scroll-triggered effects, micro-interactions
- When: Progressive disclosure, scroll experiences, transitions

### 2. Component Selection Workflow

To choose the right component:

1. **Identify the UI goal** - What impression or interaction do you want?
2. **Match to category** - Which category fits the use case?
3. **Search available components** - Browse reactbits.dev
4. **Check variants** - Ensure your stack (TS/JS, TW/CSS) is supported
5. **Install and customize** - Add via CLI or copy-paste, then customize props

### 3. Design Principles

**Performance:**
- ReactBits components are lightweight and tree-shakeable
- Only install components you actually use
- Each component is self-contained with minimal dependencies
- Animation performance is optimized for 60fps

**Customization:**
- All components accept props for customization
- Source code can be edited directly after installation
- Tailwind variants are easily themeable
- CSS variants provide full style control

**Composition:**
- Combine multiple ReactBits components for complex effects
- Layer background animations behind content components
- Use text animations within UI components
- Nest animations for progressive reveals

## Integration Patterns

### Pattern 1: Hero Section with Animated Background

```tsx
import { ParticleBackground } from '@/components/reactbits/ParticleBackground-TS-TW'
import { BlurText } from '@/components/reactbits/BlurText-TS-TW'

export function Hero() {
 return (
 <section className="relative h-screen">
 <ParticleBackground className="absolute inset-0" />
 <div className="relative z-10 flex h-full items-center justify-center">
 <BlurText text="Build Something Stunning" className="text-6xl font-bold" />
 </div>
 </section>
 )
}
```

## Project Setup Checklist

Before using ReactBits components, ensure:

- [ ] React project is set up (Next.js, Vite, CRA, etc.)
- [ ] TypeScript configured (if using TS variants)
- [ ] Tailwind CSS installed and configured (if using TW variants)
- [ ] Component directory exists (typically `src/components/` or `app/components/`)
- [ ] Dependencies installed: `react`, `framer-motion` (common for animations)

## Additional Resources

### Reference Files

For detailed information, consult these reference files as needed:

- **`references/component-catalog.md`** - Complete catalog of all 135+ components with descriptions and use cases
- **`references/best-practices.md`** - Performance optimization, accessibility considerations, and production tips

## Tips for Success

**Start Simple:**
- Begin with one or two components
- Master basics before complex compositions
- Test animations in isolation first
- Build complexity progressively

**Performance Matters:**
- Limit number of active animations
- Use `will-change` CSS property sparingly
- Prefer CSS/GPU-accelerated animations
- Test on lower-end devices

**Accessibility:**
- Respect `prefers-reduced-motion`
- Provide animation opt-outs
- Ensure text remains readable
- Don't rely solely on animation for information

**Composition Over Quantity:**
- A few well-placed animations > many scattered effects
- Use animations to guide attention
- Create visual hierarchy with motion
- Maintain consistency in animation style

Remember: ReactBits components are about making your interface memorable. Use them strategically where visual impact matters most, and combine them with traditional component libraries for a complete design system.
