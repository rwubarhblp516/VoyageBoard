# ReactBits Best Practices

Production-ready guidance for performance, accessibility, maintainability, and optimization when using ReactBits components.

## Performance Best Practices

### 1. Component Installation Strategy

**Install Only What You Need**
```bash
# ✅ Install specific components
npx shadcn@latest add @react-bits/BlurText-TS-TW
npx shadcn@latest add @react-bits/ParticleBackground-TS-TW
```

**Why:** ReactBits is tree-shakeable. Only installed components affect bundle size.

### 2. Lazy Loading Components

**Code-Split Heavy Components**
```tsx
// Heavy animated background
const ParticleBackground = lazy(() =>
  import('@/components/reactbits/ParticleBackground-TS-TW')
)

export function Hero() {
  return (
    <Suspense fallback={<div className="bg-gradient-to-br from-blue-500 to-purple-600" />}>
      <ParticleBackground />
    </Suspense>
  )
}
```

### 3. Animation Performance

**GPU Acceleration**
```tsx
// ✅ Animate transform and opacity (GPU)
<AnimatedCard className="transition-transform duration-300" />

// ❌ Animate width/height (CPU, triggers layout)
<AnimatedCard className="transition-all duration-300" />
```

**Limit Active Animations**
```tsx
// ✅ Strategic placement
<GradientMesh /> // Single subtle background
<BlurText text="Focus" />
```

## Accessibility Best Practices

### 1. Respect prefers-reduced-motion

**Apply Conditionally**
```tsx
export function AccessibleHero() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      {prefersReducedMotion ? (
        <h1 className="text-6xl font-bold">Build Something Stunning</h1>
      ) : (
        <BlurText text="Build Something Stunning" className="text-6xl font-bold" />
      )}
    </>
  )
}
```

### 2. Keyboard Navigation

**Ensure Interactive Elements Are Accessible**
```tsx
<HoverButton
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
  aria-label="Get started"
>
  Get Started
</HoverButton>
```

## Summary

**Top 10 Best Practices:**

1. **Install only needed components** - Keep bundle size minimal
2. **Respect prefers-reduced-motion** - Accessibility first
3. **Lazy load heavy components** - Improve initial load
4. **Limit concurrent animations** - Max 3-5 at once
5. **Use GPU-accelerated properties** - Transform and opacity only
6. **Test on target devices** - Especially mobile
7. **Stagger related elements** - 50-150ms increments
8. **Provide keyboard navigation** - All interactive elements
9. **Monitor performance** - Track FPS and load times
10. **Document customizations** - Help future maintainers
