# ReactBits Component Catalog
Complete catalog of 135+ ReactBits components organized by category with descriptions, use cases, and implementation guidance.

## Text Animations
Text animation components for creating dynamic, eye-catching typography effects.

### BlurText
**Description:** Animated text that transitions from blurred to sharp
**Use Cases:**
* Hero headlines with dramatic reveal
* Section titles that appear on scroll
* Loading states for content
**Props:** `text`, `duration`, `delay`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/BlurText-TS-TW`

### TypingEffect
**Description:** Simulates typing animation character-by-character
**Use Cases:**
* Interactive terminals or code demos
* Marketing copy with emphasis
* Storytelling interfaces
**Props:** `text`, `speed`, `cursor`, `onComplete`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/TypingEffect-TS-TW`

### WavyText
**Description:** Text with smooth wave animation across characters
**Use Cases:**
* Playful headlines
* Feature section titles
* Brand taglines with personality
**Props:** `text`, `amplitude`, `frequency`, `speed`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/WavyText-TS-TW`

### GlitchText
**Description:** Cyberpunk-style glitch effect on text
**Use Cases:**
* Tech/gaming brand headers
* Error states with style
* Futuristic UI themes
**Props:** `text`, `intensity`, `duration`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/GlitchText-TS-TW`

### GradientText
**Description:** Animated gradient overlay on text
**Use Cases:**
* Premium/luxury brand headlines
* Call-to-action text
* Highlighted key messages
**Props:** `text`, `gradient`, `animate`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/GradientText-TS-TW`

## UI Components
Interactive interface elements with built-in animations and effects.

### AnimatedCard
**Description:** Card component with hover and interaction animations
**Use Cases:**
* Product showcases
* Feature highlights
* Portfolio project cards
**Props:** `variant`, `hoverEffect`, `children`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/AnimatedCard-TS-TW`

### HoverButton
**Description:** Button with advanced hover effects (shimmer, ripple, etc.)
**Use Cases:**
* Primary CTAs
* Interactive navigation
* Highlighted actions
**Props:** `effect`, `color`, `size`, `children`, `onClick`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/HoverButton-TS-TW`

### ParallaxScroll
**Description:** Parallax scrolling effect for content layers
**Use Cases:**
* Landing page depth effects
* Storytelling layouts
* Immersive hero sections
**Props:** `speed`, `direction`, `children`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/ParallaxScroll-TS-TW`

### RevealLinks
**Description:** Links with sophisticated reveal animations
**Use Cases:**
* Navigation menus
* Feature lists
* Footer links
**Props:** `links`, `variant`, `direction`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/RevealLinks-TS-TW`

## Backgrounds
Animated background effects for sections, heroes, and full-page layouts.

### ParticleBackground
**Description:** Animated particle system with customizable behavior
**Use Cases:**
* Hero section backgrounds
* Full-page immersive experiences
* Tech/innovation themes
**Props:** `particleCount`, `speed`, `color`, `connections`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/ParticleBackground-TS-TW`

### GradientMesh
**Description:** Animated gradient mesh with smooth color transitions
**Use Cases:**
* Modern hero backgrounds
* Section dividers
* Ambient page backgrounds
**Props:** `colors`, `speed`, `complexity`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/GradientMesh-TS-TW`

### AnimatedGrid
**Description:** Grid pattern with animation effects
**Use Cases:**
* Tech/SaaS landing pages
* Blueprint/architecture themes
* Structured backgrounds
**Props:** `gridSize`, `lineColor`, `animation`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/AnimatedGrid-TS-TW`

## Animations
Motion-based components for entrance effects, transitions, and micro-interactions.

### FadeIn
**Description:** Smooth fade-in animation
**Use Cases:**
* Content reveals
* Scroll-triggered appearances
* Progressive disclosure
**Props:** `duration`, `delay`, `direction`, `children`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/FadeIn-TS-TW`

### SlideIn
**Description:** Slide animation from specified direction
**Use Cases:**
* Modal entrances
* Sidebar reveals
* Content transitions
**Props:** `direction`, `duration`, `delay`, `children`, `className`
**Variants:** JS-CSS, JS-TW, TS-CSS, TS-TW
**Installation:** `npx shadcn@latest add @react-bits/SlideIn-TS-TW`
