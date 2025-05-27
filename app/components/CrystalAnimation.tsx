'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Crystal shape component using CSS
function Crystal({ 
  className, 
  size = 'w-8 h-8', 
  delay = 0 
}: { 
  className?: string
  size?: string
  delay?: number 
}) {
  const crystalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (crystalRef.current) {
      // Initial setup
      gsap.set(crystalRef.current, {
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      })

      // Floating animation
      gsap.to(crystalRef.current, {
        y: -20,
        duration: 2 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: delay
      })

      // Rotation animation
      gsap.to(crystalRef.current, {
        rotation: "+=360",
        duration: 8 + Math.random() * 4,
        repeat: -1,
        ease: "none"
      })

      // Subtle scale pulse
      gsap.to(crystalRef.current, {
        scale: "+=0.1",
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: delay * 0.5
      })
    }
  }, [delay])

  return (
    <div
      ref={crystalRef}
      className={`absolute ${size} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.3))',
        opacity: 0.7
      }}
    />
  )
}

// Sparkle effect component
function Sparkle({ 
  className, 
  delay = 0 
}: { 
  className?: string
  delay?: number 
}) {
  const sparkleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sparkleRef.current) {
      gsap.set(sparkleRef.current, {
        scale: 0,
        rotation: Math.random() * 360
      })

      // Twinkling animation
      gsap.to(sparkleRef.current, {
        scale: 1,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: delay,
        repeatDelay: 1 + Math.random() * 2
      })

      // Rotation
      gsap.to(sparkleRef.current, {
        rotation: "+=360",
        duration: 4,
        repeat: -1,
        ease: "none"
      })
    }
  }, [delay])

  return (
    <div
      ref={sparkleRef}
      className={`absolute w-1 h-1 ${className}`}
      style={{
        background: '#60a5fa',
        borderRadius: '50%',
        boxShadow: '0 0 6px #60a5fa',
      }}
    />
  )
}

export default function CrystalAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // Animate container entrance
      gsap.fromTo(containerRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: "power2.out" }
      )
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
      }}
    >
      {/* Background gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 40%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)'
        }}
      />
      
      {/* Large crystals */}
      <Crystal className="top-1/4 left-1/4" size="w-12 h-12" delay={0} />
      <Crystal className="top-1/3 right-1/4" size="w-10 h-10" delay={0.5} />
      <Crystal className="bottom-1/3 left-1/3" size="w-14 h-14" delay={1} />
      <Crystal className="bottom-1/4 right-1/3" size="w-8 h-8" delay={1.5} />
      <Crystal className="top-1/2 left-1/2" size="w-6 h-6" delay={2} />
      
      {/* Medium crystals */}
      <Crystal className="top-1/5 left-1/2" size="w-6 h-6" delay={0.3} />
      <Crystal className="top-2/3 right-1/5" size="w-8 h-8" delay={0.8} />
      <Crystal className="bottom-1/5 left-1/5" size="w-5 h-5" delay={1.3} />
      
      {/* Small sparkles */}
      {Array.from({ length: 20 }, (_, i) => (
        <Sparkle
          key={`sparkle-${Math.random().toString(36).substr(2, 9)}-${i}`}
          className={`top-${Math.floor(Math.random() * 80) + 10}% left-${Math.floor(Math.random() * 80) + 10}%`}
          delay={Math.random() * 3}
        />
      ))}
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={`particle-${Math.random().toString(36).substr(2, 9)}-${i}`}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
              boxShadow: '0 0 4px rgba(96, 165, 250, 0.5)'
            }}
          />
        ))}
      </div>

      {/* CSS animations for floating particles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}