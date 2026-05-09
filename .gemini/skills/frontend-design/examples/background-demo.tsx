/**
 * Background Components Demo
 *
 * Comprehensive examples of all ReactBits background components:
 * - ParticleBackground
 * - GradientMesh
 * - AnimatedGrid
 * - WaveBackground
 * - StarField
 * - DotPattern
 * - Aurora
 */

import { useState, useEffect } from 'react'
import { ParticleBackground } from '@/components/reactbits/ParticleBackground-TS-TW'
import { GradientMesh } from '@/components/reactbits/GradientMesh-TS-TW'
import { AnimatedGrid } from '@/components/reactbits/AnimatedGrid-TS-TW'
import { WaveBackground } from '@/components/reactbits/WaveBackground-TS-TW'
import { StarField } from '@/components/reactbits/StarField-TS-TW'
import { DotPattern } from '@/components/reactbits/DotPattern-TS-TW'
import { Aurora } from '@/components/reactbits/Aurora-TS-TW'

type BackgroundType =
  | 'particles'
  | 'gradient'
  | 'grid'
  | 'waves'
  | 'stars'
  | 'dots'
  | 'aurora'
  | 'none'

export function BackgroundDemo() {
  const [activeBackground, setActiveBackground] = useState<BackgroundType>('gradient')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    const mobileQuery = window.matchMedia('(max-width: 768px)')
    setIsMobile(mobileQuery.matches)
    const handleMobileChange = () => setIsMobile(mobileQuery.matches)
    mobileQuery.addEventListener('change', handleMobileChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      mobileQuery.removeEventListener('change', handleMobileChange)
    }
  }, [])

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-gray-900">
        {!prefersReducedMotion && (
          <>
            {activeBackground === 'particles' && (
              <ParticleBackground
                particleCount={isMobile ? 30 : 100}
                speed={0.5}
                color="#3b82f6"
                connections={true}
              />
            )}
            {activeBackground === 'gradient' && (
              <GradientMesh
                colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                speed={0.3}
                complexity={3}
              />
            )}
            {activeBackground === 'grid' && (
              <AnimatedGrid
                gridSize={50}
                lineColor="rgba(59, 130, 246, 0.3)"
                animation="pulse"
              />
            )}
            {activeBackground === 'waves' && (
              <WaveBackground
                waveCount={3}
                amplitude={50}
                speed={0.5}
                colors={['#3b82f6', '#8b5cf6', '#ec4899']}
              />
            )}
            {activeBackground === 'stars' && (
              <StarField
                starCount={isMobile ? 100 : 300}
                speed={0.5}
                layers={3}
              />
            )}
            {activeBackground === 'dots' && (
              <DotPattern
                dotSize={2}
                spacing={30}
                color="rgba(59, 130, 246, 0.5)"
                animation="fade"
              />
            )}
            {activeBackground === 'aurora' && (
              <Aurora
                colors={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981']}
                speed={0.4}
                intensity={0.7}
              />
            )}
          </>
        )}
      </div>
      {/* Rest of demo UI... */}
    </div>
  )
}
