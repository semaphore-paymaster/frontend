'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'

const themes = {
  blue: {
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
    shadowColor: 'rgba(96, 165, 250, 0.3)',
    sparkleBase: '#60a5fa',
    sparkleShadow: '#60a5fa',
  },
  pink: {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
    sparkleBase: '#ec4899',
    sparkleShadow: '#ec4899',
  },
};
const themeKeys = Object.keys(themes) as (keyof typeof themes)[];

function Crystal({ 
  className, 
  size = 'w-8 h-8', 
  delay = 0,
  initialColorTheme
}: {
  className?: string
  size?: string
  delay?: number 
  initialColorTheme: keyof typeof themes
}) {
  const crystalRef = useRef<HTMLDivElement>(null)
  const [activeColorTheme, setActiveColorTheme] = useState(initialColorTheme);
  const currentTheme = themes[activeColorTheme];
  const animationRef = useRef<gsap.core.Timeline | null>(null); 
  const currentBurstAnimation = useRef<gsap.core.Tween | null>(null);

  const setupBaseAnimations = useCallback(() => {
    if (!crystalRef.current) return;
    if (animationRef.current) {
      animationRef.current.kill();
    }

    const currentX = gsap.getProperty(crystalRef.current, "x");
    const currentY = gsap.getProperty(crystalRef.current, "y");
    const currentRotation = gsap.getProperty(crystalRef.current, "rotation");
    const currentScale = gsap.getProperty(crystalRef.current, "scale");

    const tl = gsap.timeline({ 
      repeat: -1, 
      delay: delay,
      onRepeat: () => {
        tl.vars.delay = 0;
      }
    });
    
    tl.set(crystalRef.current, { 
        x: currentX, 
        y: currentY,
        rotation: currentRotation,
        scale: currentScale,
      })
      .to(crystalRef.current, {
        y: "-=20",
        duration: 2 + Math.random() * 2,
        yoyo: true,
        ease: "power2.inOut",
      }, "<+=0")
      .to(crystalRef.current, {
        rotation: "+=360",
        duration: 8 + Math.random() * 4,
        ease: "none"
      }, 0)
      .to(crystalRef.current, {
        scale: "+=0.1",
        duration: 3 + Math.random() * 2,
        yoyo: true,
        ease: "power2.inOut",
      }, "<+=0");
      
    animationRef.current = tl;
  }, [delay]);

  useEffect(() => {
    if (crystalRef.current) {
        gsap.set(crystalRef.current, {
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
        });
        setupBaseAnimations();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (currentBurstAnimation.current) {
        currentBurstAnimation.current.kill();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupBaseAnimations]); 

  const handleClick = useCallback(() => {
    if (crystalRef.current) {
      // Kill any ongoing base animations and previous burst animations
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      if (currentBurstAnimation.current) {
        currentBurstAnimation.current.kill();
      }

      // Toggle color theme
      const nextColorTheme = activeColorTheme === 'blue' ? 'pink' : 'blue';
      setActiveColorTheme(nextColorTheme);

      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const duration = 0.5 + Math.random() * 0.5;

      const targetX = `+=${Math.cos(angle) * distance}`;
      const targetY = `+=${Math.sin(angle) * distance}`;
      const targetRotation = `+=${(Math.random() - 0.5) * 720}`;

      console.log(`[Crystal Click] Bursting to: X:${targetX}, Y:${targetY}, Rot:${targetRotation}`);

      currentBurstAnimation.current = gsap.to(crystalRef.current, {
        x: targetX,
        y: targetY,
        rotation: targetRotation,
        duration: duration,
        ease: "power1.out",
        onComplete: () => {
          console.log("[Crystal Click] Burst complete. Restarting base animations.");
          setupBaseAnimations(); 
        }
      });
    }
  }, [setupBaseAnimations, activeColorTheme]);

  const handleKeyboardClick = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick();
    }
  }, [handleClick]);

  return (
    <div
      ref={crystalRef}
      className={`absolute ${size} ${className} cursor-pointer`}
      style={{
        background: currentTheme.gradient,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        filter: `drop-shadow(0 0 10px ${currentTheme.shadowColor})`,
        opacity: 0.7
      }}
      onClick={handleClick}
      onKeyDown={handleKeyboardClick}
      tabIndex={0}
      role="button"
    />
  )
}


function Sparkle({ 
  className, 
  delay = 0,
  initialColorTheme 
}: { 
  className?: string
  delay?: number 
  initialColorTheme: keyof typeof themes 
}) {
  const sparkleRef = useRef<HTMLDivElement>(null)
  const currentTheme = themes[initialColorTheme];

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
        background: currentTheme.sparkleBase,
        borderRadius: '50%',
        boxShadow: `0 0 6px ${currentTheme.sparkleShadow}`,
      }}
    />
  )
}

export default function CrystalAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: "power2.out" }
      )
    }
  }, [])

  const getRandomTheme = useCallback(() => {
    return themeKeys[Math.floor(Math.random() * themeKeys.length)];
  }, []);

  return (
    <div 
      ref={containerRef}
      className="hidden md:block w-full h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' 
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 40%, rgba(96, 165, 250, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(236, 72, 153, 0.05) 0%, transparent 40%)' 
        }}
      />
      
      {/* Large crystals - Mix of blue and pink */}
      <Crystal className="top-1/4 left-1/4" size="w-12 h-12" delay={0} initialColorTheme={getRandomTheme()} />
      <Crystal className="top-1/3 right-1/4" size="w-10 h-10" delay={0.5} initialColorTheme={getRandomTheme()} />
      <Crystal className="bottom-1/3 left-1/3" size="w-14 h-14" delay={1} initialColorTheme={getRandomTheme()} />
      <Crystal className="bottom-1/4 right-1/3" size="w-8 h-8" delay={1.5} initialColorTheme={getRandomTheme()} />
      <Crystal className="top-1/2 left-1/2" size="w-6 h-6" delay={2} initialColorTheme={getRandomTheme()} />
      
      {/* Medium crystals - Mix of blue and pink */}
      <Crystal className="top-1/5 left-1/2" size="w-6 h-6" delay={0.3} initialColorTheme={getRandomTheme()} />
      <Crystal className="top-2/3 right-1/5" size="w-8 h-8" delay={0.8} initialColorTheme={getRandomTheme()} />
      <Crystal className="bottom-1/5 left-1/5" size="w-5 h-5" delay={1.3} initialColorTheme={getRandomTheme()} />
      
      {/* Small sparkles - Mix of blue and pink */}
      {Array.from({ length: 20 }, (_, i) => (
        <Sparkle
          key={`sparkle-${Math.random().toString(36).substr(2, 9)}-${i}`}
          className={`top-${Math.floor(Math.random() * 80) + 10}% left-${Math.floor(Math.random() * 80) + 10}%`}
          delay={Math.random() * 3}
          initialColorTheme={getRandomTheme()} // Random theme for sparkles
        />
      ))}
      
      {/* Floating particles - Keeping these blue for now, or could also be themed */}
      <div className="absolute inset-0 pointer-events-none"> {/* Added pointer-events-none */} 
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