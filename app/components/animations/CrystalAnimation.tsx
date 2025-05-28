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

type ThemeKey = keyof typeof themes;
const themeKeys = Object.keys(themes) as ThemeKey[];

interface CrystalProps {
  initialTheme: ThemeKey;
  delay?: number;
  positionClasses?: string;
  sizeClasses?: string;
}

function Crystal({
  initialTheme,
  delay = 0,
  positionClasses = 'top-1/2 left-1/2',
  sizeClasses = 'w-8 h-8',
}: CrystalProps) {
  const crystalRef = useRef<HTMLDivElement>(null);
  const floatTween = useRef<gsap.core.Tween | null>(null);
  const rotateTween = useRef<gsap.core.Tween | null>(null);
  const scaleTween = useRef<gsap.core.Tween | null>(null);
  const burstTween = useRef<gsap.core.Tween | null>(null);
  
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(initialTheme);
  const theme = themes[currentTheme];

  const [stableInitialAttrs] = useState(() => ({
    rotation: Math.random() * 360,
    scale: 0.7 + Math.random() * 0.6, 
  }));

  const startFloatingAnimations = useCallback(() => {
    if (!crystalRef.current) return;

    // Kill any existing tweens
    if (floatTween.current) floatTween.current.kill();
    if (rotateTween.current) rotateTween.current.kill();
    if (scaleTween.current) scaleTween.current.kill();

    // Floating animation
    floatTween.current = gsap.to(crystalRef.current, {
      y: "-=30",
      duration: 2 + Math.random() * 2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0, // No delay when restarting after click
    });

    // Rotation animation
    rotateTween.current = gsap.to(crystalRef.current, {
      rotation: "+=360",
      duration: 8 + Math.random() * 4,
      ease: "none",
      repeat: -1,
      delay: 0,
    });

    // Scale animation
    scaleTween.current = gsap.to(crystalRef.current, {
      scale: stableInitialAttrs.scale * 1.15,
      duration: 3 + Math.random() * 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0,
    });
  }, [stableInitialAttrs]);

  useEffect(() => {
    if (!crystalRef.current) return;

    // Set initial state
    gsap.set(crystalRef.current, {
      x: 0,
      y: 0,
      rotation: stableInitialAttrs.rotation,
      scale: stableInitialAttrs.scale,
      opacity: 0.7, 
    });

    // Start animations with initial delay
    setTimeout(() => {
      startFloatingAnimations();
    }, delay * 1000);

    return () => {
      if (floatTween.current) {
        floatTween.current.kill();
        floatTween.current = null;
      }
      if (rotateTween.current) {
        rotateTween.current.kill();
        rotateTween.current = null;
      }
      if (scaleTween.current) {
        scaleTween.current.kill();
        scaleTween.current = null;
      }
      if (burstTween.current) {
        burstTween.current.kill();
        burstTween.current = null;
      }
    };
  }, [delay, stableInitialAttrs, startFloatingAnimations]);

  const handleClick = () => {
    if (!crystalRef.current) return;

    // Toggle theme
    const newTheme = currentTheme === 'blue' ? 'pink' : 'blue';
    setCurrentTheme(newTheme);

    // Kill existing animations
    if (floatTween.current) floatTween.current.kill();
    if (rotateTween.current) rotateTween.current.kill();
    if (scaleTween.current) scaleTween.current.kill();
    if (burstTween.current) burstTween.current.kill();

    // Create burst effect - push in a random direction
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    // Get current position
    const currentX = gsap.getProperty(crystalRef.current, "x") as number;
    const currentY = gsap.getProperty(crystalRef.current, "y") as number;

    burstTween.current = gsap.to(crystalRef.current, {
      x: currentX + targetX,
      y: currentY + targetY,
      rotation: `+=${(Math.random() - 0.5) * 720}`, // Spin during burst
      scale: stableInitialAttrs.scale * 1.3, // Slightly enlarge during burst
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        // After burst, resume floating animations
        startFloatingAnimations();
      }
    });

    // Create sparkle effect (optional visual feedback)
    createSparkleEffect();
  };

  const createSparkleEffect = () => {
    // This is a placeholder for a sparkle effect
    // You could emit particles here or trigger a visual effect
    console.log('Sparkle effect triggered!');
  };

  return (
    <div
      ref={crystalRef}
      className={`absolute ${positionClasses} ${sizeClasses} cursor-pointer transition-colors duration-300`}
      style={{
        background: theme.gradient,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        filter: `drop-shadow(0 0 10px ${theme.shadowColor})`,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="Interactive crystal"
    />
  );
}

interface SparkleProps {
  initialTheme: ThemeKey;
  delay?: number;
  positionClasses?: string;
}

function Sparkle({
  initialTheme,
  delay = 0,
  positionClasses = 'top-1/2 left-1/2',
}: SparkleProps) {
  const sparkleRef = useRef<HTMLDivElement>(null);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);
  const currentTheme = themes[initialTheme];

  useEffect(() => {
    if (!sparkleRef.current) return;

    if (animationTimeline.current) {
      animationTimeline.current.kill();
      animationTimeline.current = null;
    }

    gsap.set(sparkleRef.current, {
      scale: 0,
      rotation: Math.random() * 360,
    });

    const tl = gsap.timeline({
        delay: delay,
        repeat: -1,
        repeatDelay: 1 + Math.random() * 2, // Staggered repeat for twinkling
    });
    
    tl.to(sparkleRef.current, {
        scale: 1,
        duration: 0.5,
        ease: "power2.inOut",
        yoyo: true,
      })
      .to(sparkleRef.current, {
        rotation: "+=360",
        duration: 4,
        ease: "none",
      }, "<0");
    
    animationTimeline.current = tl;

    return () => {
      if (animationTimeline.current) {
        animationTimeline.current.kill();
        animationTimeline.current = null;
      }
    };
  }, [delay]);

  return (
    <div
      ref={sparkleRef}
      className={`absolute w-1 h-1 ${positionClasses}`}
      style={{
        background: currentTheme.sparkleBase,
        borderRadius: '50%',
        boxShadow: `0 0 6px ${currentTheme.sparkleShadow}`,
      }}
    />
  );
}

export default function CrystalAnimation() {
  const getRandomTheme = useCallback((): ThemeKey => {
    return themeKeys[Math.floor(Math.random() * themeKeys.length)];
  }, []);

  // Helper to generate random percentage for positioning
  const getRandomPosition = () => `${Math.floor(Math.random() * 80) + 10}%`;

  return (
    <div 
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
      
      {/* Large crystals */}
      <Crystal initialTheme={getRandomTheme()} delay={0} positionClasses="top-1/4 left-1/4" sizeClasses="w-12 h-12" />
      <Crystal initialTheme={getRandomTheme()} delay={0.5} positionClasses="top-1/3 right-1/4" sizeClasses="w-10 h-10" />
      <Crystal initialTheme={getRandomTheme()} delay={1} positionClasses="bottom-1/3 left-1/3" sizeClasses="w-14 h-14" />
      <Crystal initialTheme={getRandomTheme()} delay={1.5} positionClasses="bottom-1/4 right-1/3" sizeClasses="w-8 h-8" />
      <Crystal initialTheme={getRandomTheme()} delay={2} positionClasses="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" sizeClasses="w-6 h-6" />
      
      {/* Medium crystals */}
      <Crystal initialTheme={getRandomTheme()} delay={0.3} positionClasses="top-1/5 left-1/2 -translate-x-1/2" sizeClasses="w-6 h-6" />
      <Crystal initialTheme={getRandomTheme()} delay={0.8} positionClasses="top-2/3 right-1/5" sizeClasses="w-8 h-8" />
      <Crystal initialTheme={getRandomTheme()} delay={1.3} positionClasses="bottom-1/5 left-1/5" sizeClasses="w-5 h-5" />
      
      {/* Small sparkles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <Sparkle
          key={`sparkle-${i}`}
          initialTheme={getRandomTheme()}
          delay={Math.random() * 3}
          positionClasses={`top-[${getRandomPosition()}] left-[${getRandomPosition()}]`}
        />
      ))}
      
      {/* Floating particles (CSS animation) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
            style={{
              top: getRandomPosition(),
              left: getRandomPosition(),
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
              boxShadow: '0 0 4px rgba(96, 165, 250, 0.5)'
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}