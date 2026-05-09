/**
 * Animated Card Example
 *
 * Dashboard or feature card with multiple ReactBits animations:
 * - AnimatedCard for base hover effects
 * - GlowingCard for premium glow effect
 * - FadeIn for entrance animation
 * - ScaleIn for metric number emphasis
 *
 * Features:
 * - Hover interactions
 * - Staggered content reveal
 * - Responsive design
 * - Accessible
 */

import { useEffect, useState } from 'react'
import { AnimatedCard } from '@/components/reactbits/AnimatedCard-TS-TW'
import { GlowingCard } from '@/components/reactbits/GlowingCard-TS-TW'
import { FadeIn } from '@/components/reactbits/FadeIn-TS-TW'
import { ScaleIn } from '@/components/reactbits/ScaleIn-TS-TW'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  delay?: number
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  delay = 0,
  onClick,
}: MetricCardProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const changeColor = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-gray-500',
  }[changeType]

  const CardWrapper = prefersReducedMotion ? 'div' : FadeIn
  const wrapperProps = prefersReducedMotion
    ? {}
    : { delay: delay, duration: 400 }

  return (
    <CardWrapper {...wrapperProps}>
      {prefersReducedMotion ? (
        <div
          onClick={onClick}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <CardContent
            title={title}
            value={value}
            change={change}
            changeColor={changeColor}
            icon={icon}
            animated={false}
          />
        </div>
      ) : (
        <GlowingCard
          glowColor="blue"
          intensity={0.3}
          className="rounded-xl"
        >
          <AnimatedCard
            variant="lift"
            hoverEffect="glow"
            onClick={onClick}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
          >
            <CardContent
              title={title}
              value={value}
              change={change}
              changeColor={changeColor}
              icon={icon}
              animated={true}
            />
          </AnimatedCard>
        </GlowingCard>
      )}
    </CardWrapper>
  )
}

interface CardContentProps {
  title: string
  value: string | number
  change?: string
  changeColor: string
  icon?: React.ReactNode
  animated: boolean
}

function CardContent({
  title,
  value,
  change,
  changeColor,
  icon,
  animated,
}: CardContentProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {icon && (
          <div className="text-gray-400 dark:text-gray-600" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>

      {animated ? (
        <ScaleIn delay={0.2} duration={500} from={0.8}>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </ScaleIn>
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      )}

      {change && (
        <p className={`mt-2 text-sm font-medium ${changeColor}`}>
          {change}
        </p>
      )}
    </>
  )
}
