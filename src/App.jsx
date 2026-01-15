import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Environment, RoundedBox, Text, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import './index.css'

// Product image - replace with your actual image path
const PRODUCT_IMAGE = '/product.png'

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

// Custom Cursor
function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
    }

    const handleHover = () => setIsHovering(true)
    const handleLeave = () => setIsHovering(false)

    window.addEventListener('mousemove', moveCursor)
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', handleHover)
      el.addEventListener('mouseleave', handleLeave)
    })

    return () => {
      window.removeEventListener('mousemove', moveCursor)
    }
  }, [])

  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-blue-400 pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{ x: cursorXSpring, y: cursorYSpring, scale: isHovering ? 2 : 1 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-blue-400 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{ x: cursorX, y: cursorY, translateX: 12, translateY: 12 }}
      />
    </>
  )
}

// 3D Morphing Sphere - Blue
function MorphingSphere() {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.5}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

// Noise/Grain Overlay
function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  )
}

// Glitch Text Component
function GlitchText({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="relative inline-block">
        {children}
        <span className="absolute top-0 left-0 w-full h-full text-cyan-400 animate-glitch-1 clip-glitch" aria-hidden="true">
          {children}
        </span>
        <span className="absolute top-0 left-0 w-full h-full text-red-400 animate-glitch-2 clip-glitch-2" aria-hidden="true">
          {children}
        </span>
      </span>
    </div>
  )
}

// Loading Screen
function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-6xl md:text-8xl font-black tracking-tighter mb-8"
      >
        <GlitchText>
          <span className="gradient-text">BUILT</span>
        </GlitchText>
      </motion.div>

      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-blue-400 font-mono text-sm"
      >
        {Math.min(Math.round(progress), 100)}%
      </motion.p>
    </motion.div>
  )
}

// Magnetic Button
function MagneticButton({ children, className = '', href = '#' }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const springConfig = { damping: 15, stiffness: 150 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: xSpring, y: ySpring }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.a>
  )
}

// Parallax Text
function ParallaxText({ children, baseVelocity = 5 }) {
  const baseX = useMotionValue(0)
  const x = useTransform(baseX, (v) => `${v}%`)

  useEffect(() => {
    let animationId
    const animate = () => {
      baseX.set(baseX.get() - baseVelocity * 0.05)
      if (baseX.get() < -50) baseX.set(0)
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [baseVelocity])

  return (
    <div className="overflow-hidden whitespace-nowrap flex">
      <motion.div style={{ x }} className="flex gap-4 md:gap-8">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="text-4xl md:text-[12rem] font-black text-white/5 uppercase">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// Navbar
function Navbar({ onShopNow }) {
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      const previous = scrollY.getPrevious()
      if (latest > previous && latest > 150) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    })
  }, [scrollY])

  return (
    <motion.nav
      variants={{ visible: { y: 0 }, hidden: { y: '-100%' } }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 mix-blend-difference"
    >
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="text-2xl font-black tracking-tighter text-white"
        >
          BUILT
        </motion.div>
        <motion.button
          onClick={onShopNow}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 border border-white text-white font-bold text-sm tracking-wider hover:bg-white hover:text-black transition-all duration-300"
        >
          SHOP NOW
        </motion.button>
      </div>
    </motion.nav>
  )
}

// Hero Section
function Hero() {
  const containerRef = useRef(null)
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="h-[150vh] md:h-[200vh] relative"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        {/* 3D Background - simplified/hidden on mobile */}
        {!isMobile && (
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <MorphingSphere />
                <Environment preset="city" />
              </Suspense>
            </Canvas>
          </div>
        )}

        {/* Mobile background alternative */}
        {isMobile && (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 via-black to-blue-900/10" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />

        {/* Content */}
        <motion.div
          style={{ y, scale }}
          className="relative z-20 h-full flex flex-col items-center justify-center px-6"
        >
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-12 h-px bg-blue-400" />
            <span className="text-blue-400 text-sm tracking-[0.3em] uppercase font-light">100% Vegan Creatine</span>
            <div className="w-12 h-px bg-blue-400" />
          </motion.div>

          {/* Main Title */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
              className="text-[15vw] md:text-[12vw] font-black leading-none tracking-tighter text-center"
            >
              <GlitchText>
                <span className="gradient-text glow-text">BUILT</span>
              </GlitchText>
            </motion.h1>
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-white/80 mt-2"
          >
            STRONGER
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-white/60 text-lg md:text-xl mt-6 max-w-md text-center font-light tracking-wide"
          >
            Premium creatine gummies.
            <br />
            <span className="text-blue-400">Blue Raspberry. 120 Gummies. Pure Power.</span>
          </motion.p>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs tracking-[0.3em] text-white/40 uppercase">Scroll</span>
              <div className="w-px h-16 bg-gradient-to-b from-blue-400 to-transparent" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Corner decorations - smaller on mobile */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 w-10 h-10 md:w-20 md:h-20 border-l-2 border-t-2 border-blue-400/30 z-20" />
        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-20 md:h-20 border-r-2 border-t-2 border-blue-400/30 z-20" />
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-10 h-10 md:w-20 md:h-20 border-l-2 border-b-2 border-blue-400/30 z-20" />
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-10 h-10 md:w-20 md:h-20 border-r-2 border-b-2 border-blue-400/30 z-20" />
      </div>
    </motion.section>
  )
}

// Marquee Section
function MarqueeSection() {
  return (
    <section className="py-12 md:py-24 bg-black overflow-hidden">
      <ParallaxText baseVelocity={-2}>CREATINE GUMMIES •</ParallaxText>
      <ParallaxText baseVelocity={2}>3G PURE CREATINE • 100% VEGAN •</ParallaxText>
    </section>
  )
}

// Product Section with actual image
function ProductSection() {
  const ref = useRef(null)
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const leftX = useTransform(scrollYProgress, [0, 0.5], ['-100%', '0%'])
  const rightX = useTransform(scrollYProgress, [0, 0.5], ['100%', '0%'])

  return (
    <section ref={ref} className="min-h-screen bg-black relative overflow-hidden py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left - Product Image */}
          <motion.div style={{ x: isMobile ? 0 : leftX }} className="relative flex justify-center overflow-hidden">
            <div className="relative">
              {/* Glow effect behind product */}
              <div className="absolute inset-0 bg-blue-500/30 blur-[60px] md:blur-[100px] rounded-full scale-75 md:scale-90" />

              {/* Pulsing energy rings - reduced on mobile */}
              {!isMobile && [...Array(2)].map((_, i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute inset-0 border-2 border-blue-400/30 rounded-full"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: [0.8, 1.5],
                    opacity: [0.6, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 1.5,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Decorative frame - hidden on mobile */}
              <div className="hidden md:block absolute -inset-8 border border-blue-500/20 rounded-3xl" />

              {/* Corner accents - smaller on mobile */}
              <div className="absolute -top-3 -left-3 md:-top-6 md:-left-6 w-8 h-8 md:w-12 md:h-12 border-l-2 border-t-2 border-blue-400 rounded-tl-xl" />
              <div className="absolute -top-3 -right-3 md:-top-6 md:-right-6 w-8 h-8 md:w-12 md:h-12 border-r-2 border-t-2 border-blue-400 rounded-tr-xl" />
              <div className="absolute -bottom-3 -left-3 md:-bottom-6 md:-left-6 w-8 h-8 md:w-12 md:h-12 border-l-2 border-b-2 border-blue-400 rounded-bl-xl" />
              <div className="absolute -bottom-3 -right-3 md:-bottom-6 md:-right-6 w-8 h-8 md:w-12 md:h-12 border-r-2 border-b-2 border-blue-400 rounded-br-xl" />

              {/* Floating particles - desktop only */}
              {!isMobile && [...Array(6)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full"
                  style={{
                    left: `${20 + (i * 10)}%`,
                    bottom: '0%',
                  }}
                  animate={{
                    y: [0, -200],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Product Image */}
              <motion.div
                animate={isMobile ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <img
                  src={PRODUCT_IMAGE}
                  alt="BUILT Creatine Gummies - Blue Raspberry"
                  className="w-56 md:w-96 h-auto product-glow"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                {/* Fallback if image doesn't load */}
                <div className="hidden w-56 md:w-96 h-[300px] md:h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-3xl border border-blue-500/30 items-center justify-center flex-col glow-blue">
                  <div className="text-5xl md:text-6xl mb-4">🫙</div>
                  <div className="text-xl md:text-2xl font-black gradient-text">BUILT</div>
                  <div className="text-xs md:text-sm text-white/60">Creatine Gummies</div>
                </div>
              </motion.div>

              {/* Floating badges - simplified on mobile */}
              <div className="absolute -top-2 right-0 md:-top-4 md:right-0 px-3 py-1.5 md:px-4 md:py-2 bg-black/80 border border-blue-500/50 rounded-full text-xs md:text-sm font-bold text-blue-400 z-20">
                100% Vegan
              </div>
              <div className="absolute -bottom-2 left-0 md:-bottom-4 md:left-0 px-3 py-1.5 md:px-4 md:py-2 bg-black/80 border border-blue-500/50 rounded-full text-xs md:text-sm font-bold text-blue-400 z-20">
                Blue Raspberry
              </div>

              {/* Additional floating badge - desktop only */}
              {!isMobile && (
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 -right-16 px-4 py-2 bg-black/80 border border-blue-500/50 rounded-full text-sm font-bold text-blue-400 z-20"
                >
                  3G Creatine
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right - Text */}
          <motion.div style={{ x: isMobile ? 0 : rightX }} className="text-center md:text-left">
            <span className="text-blue-400 text-xs md:text-sm tracking-[0.3em] uppercase">The Product</span>
            <h2 className="text-4xl md:text-7xl font-black mt-4 mb-6 md:mb-8 leading-none">
              <span className="text-white">GET</span>
              <br />
              <span className="gradient-text">STRONGER</span>
            </h2>
            <p className="text-white/60 text-base md:text-lg leading-relaxed mb-6 md:mb-8 px-2 md:px-0">
              120 premium creatine gummies packed with 3g of pure creatine per serving.
              Delicious Blue Raspberry flavor that makes your daily dose something to look forward to.
              100% vegan. Zero compromise.
            </p>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {[
                { label: 'Creatine', value: '3G' },
                { label: 'Gummies', value: '120' },
                { label: 'Vegan', value: '100%' },
                { label: 'Flavor', value: 'BLUE RASP' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="border-l-2 border-blue-400 pl-3 md:pl-4 text-left"
                >
                  <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-white/40 text-xs md:text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Features with Horizontal Scroll
function HorizontalFeatures() {
  const containerRef = useRef(null)
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%'])

  const features = [
    {
      num: '01',
      title: 'EXPLOSIVE POWER',
      desc: '3g of pure creatine monohydrate per serving to fuel your most intense workouts.',
      icon: '⚡'
    },
    {
      num: '02',
      title: '100% VEGAN',
      desc: 'Plant-based formula that delivers results without compromise. Clean ingredients only.',
      icon: '🌱'
    },
    {
      num: '03',
      title: 'BLUE RASPBERRY',
      desc: 'Delicious flavor that makes your daily creatine something you actually enjoy.',
      icon: '🫐'
    },
    {
      num: '04',
      title: '120 GUMMIES',
      desc: '40 servings per jar. Stock up and stay consistent for maximum results.',
      icon: '💪'
    },
  ]

  return (
    <section ref={containerRef} className="h-[200vh] md:h-[300vh] relative bg-black">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-4 md:gap-8 pl-[5vw] md:pl-[10vw]">
          {features.map((feature, i) => (
            <div
              key={i}
              className="w-[85vw] md:w-[40vw] h-[60vh] md:h-[70vh] flex-shrink-0 relative"
            >
              <div className="absolute inset-0 border border-white/10" />
              <div className="hidden md:block absolute inset-4 border border-white/5" />

              <div className="relative h-full p-6 md:p-12 flex flex-col justify-between">
                <div>
                  <span className="text-blue-400 font-mono text-xs md:text-sm">{feature.num}</span>
                  <div className="text-5xl md:text-8xl mt-3 md:mt-4 mb-4 md:mb-6">
                    {feature.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl md:text-4xl font-black text-white mb-2 md:mb-4 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm md:text-lg max-w-sm">
                    {feature.desc}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-400 to-transparent" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Before/After Results Slider
function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const transformations = [
    {
      name: 'MIKE R.',
      duration: '12 weeks',
      beforeStats: { weight: '165 lbs', bench: '185 lbs', energy: '4/10' },
      afterStats: { weight: '178 lbs', bench: '245 lbs', energy: '9/10' },
      quote: 'BUILT helped me break through my plateau. The convenience of gummies made me actually consistent.',
    },
    {
      name: 'JESSICA T.',
      duration: '8 weeks',
      beforeStats: { weight: '135 lbs', squat: '135 lbs', energy: '5/10' },
      afterStats: { weight: '142 lbs', squat: '185 lbs', energy: '10/10' },
      quote: 'As a vegan athlete, finding quality creatine was hard. BUILT changed everything.',
    },
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const active = transformations[activeIndex]

  const handleMove = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = (x / rect.width) * 100
    setSliderPosition(percent)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [])

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/10" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-400 text-sm tracking-[0.3em] uppercase">Real Results</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mt-4">
            TRANSFORMATIONS
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Slider */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            ref={containerRef}
            className="relative aspect-[4/5] cursor-ew-resize select-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            {/* Before side */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <span className="text-red-400 text-xs tracking-[0.3em] uppercase mb-4">Before</span>
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6">
                  <span className="text-6xl opacity-50">😔</span>
                </div>
                <div className="space-y-3 text-center">
                  {Object.entries(active.beforeStats).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-2xl font-black text-white/50">{value}</div>
                      <div className="text-xs text-white/30 uppercase tracking-wider">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Scan lines effect */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
              }} />
            </div>

            {/* After side (clips based on slider) */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <span className="text-blue-400 text-xs tracking-[0.3em] uppercase mb-4">After</span>
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                  <span className="text-6xl">💪</span>
                </div>
                <div className="space-y-3 text-center">
                  {Object.entries(active.afterStats).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-2xl font-black text-white">{value}</div>
                      <div className="text-xs text-blue-300 uppercase tracking-wider">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent" />
            </div>

            {/* Slider handle */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 cursor-ew-resize z-10"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              whileHover={{ scaleX: 2 }}
            >
              {/* Handle grip */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="flex gap-1">
                  <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
                  <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
                </div>
              </div>
            </motion.div>

            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-blue-400/50 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-blue-400/50 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-blue-400/50 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-blue-400/50 rounded-br-lg" />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl font-black gradient-text">{active.name}</span>
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm">
                {active.duration}
              </span>
            </div>

            <blockquote className="text-xl md:text-2xl text-white/80 italic mb-8 leading-relaxed">
              "{active.quote}"
            </blockquote>

            {/* Stats comparison */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {Object.keys(active.beforeStats).map((key) => (
                <motion.div
                  key={key}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                >
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{key}</div>
                  <div className="text-sm text-red-400 line-through mb-1">{active.beforeStats[key]}</div>
                  <div className="text-lg font-black text-blue-400">{active.afterStats[key]}</div>
                </motion.div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {transformations.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
                    i === activeIndex
                      ? 'border-blue-400 bg-blue-400/20 text-blue-400'
                      : 'border-white/20 text-white/40 hover:border-white/40'
                  }`}
                >
                  {i + 1}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Fitness Quiz
function FitnessQuiz({ isOpen, onClose }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)

  const questions = [
    {
      question: "What's your primary fitness goal?",
      options: [
        { id: 'strength', label: 'Build Strength', icon: '💪', desc: 'Lift heavier, get stronger' },
        { id: 'muscle', label: 'Gain Muscle', icon: '🏋️', desc: 'Increase muscle mass' },
        { id: 'endurance', label: 'Boost Endurance', icon: '🏃', desc: 'Last longer, recover faster' },
        { id: 'energy', label: 'More Energy', icon: '⚡', desc: 'Power through workouts' },
      ]
    },
    {
      question: "How often do you work out?",
      options: [
        { id: 'daily', label: 'Daily', icon: '🔥', desc: '6-7 days per week' },
        { id: 'frequent', label: 'Frequently', icon: '💯', desc: '4-5 days per week' },
        { id: 'moderate', label: 'Moderate', icon: '👍', desc: '2-3 days per week' },
        { id: 'starting', label: 'Just Starting', icon: '🌱', desc: 'Building the habit' },
      ]
    },
    {
      question: "What's your biggest supplement challenge?",
      options: [
        { id: 'taste', label: 'Bad Taste', icon: '🤢', desc: 'Can\'t stand powder taste' },
        { id: 'consistency', label: 'Consistency', icon: '📅', desc: 'Forgetting to take it' },
        { id: 'mixing', label: 'Mixing Hassle', icon: '🥤', desc: 'Too much prep work' },
        { id: 'quality', label: 'Finding Quality', icon: '🔍', desc: 'Not sure what\'s good' },
      ]
    },
  ]

  const getResult = () => {
    const goal = answers[0]
    const frequency = answers[1]
    const results = {
      strength: { title: 'STRENGTH SEEKER', benefit: 'Creatine increases ATP production, giving you explosive power for heavy lifts.' },
      muscle: { title: 'MUSCLE BUILDER', benefit: 'Creatine draws water into muscles, enhancing protein synthesis and growth.' },
      endurance: { title: 'ENDURANCE ATHLETE', benefit: 'Creatine helps buffer lactic acid, letting you push harder for longer.' },
      energy: { title: 'ENERGY MAXIMIZER', benefit: 'Creatine replenishes cellular energy stores for sustained workout intensity.' },
    }
    return results[goal] || results.strength
  }

  const getTimeline = () => {
    const goal = answers[0]
    const frequency = answers[1]

    // Adjust timeline based on workout frequency
    const speedMultiplier = {
      daily: 0.8,      // Faster results
      frequent: 0.9,
      moderate: 1.1,
      starting: 1.3,   // Slower but still effective
    }[frequency] || 1

    const baseTimelines = {
      strength: [
        { week: 1, milestone: 'Creatine loading phase complete', detail: 'Muscles fully saturated with creatine stores' },
        { week: 2, milestone: 'First strength gains', detail: '+5-10% on your main lifts' },
        { week: 4, milestone: 'Visible power increase', detail: 'Heavier weights, more reps' },
        { week: 8, milestone: 'Peak performance', detail: 'Up to 15% strength improvement' },
      ],
      muscle: [
        { week: 1, milestone: 'Cell volumization begins', detail: 'Water drawn into muscle cells' },
        { week: 2, milestone: 'Fuller muscle appearance', detail: 'Noticeable pump and size' },
        { week: 4, milestone: 'Enhanced recovery', detail: 'Train harder, grow faster' },
        { week: 8, milestone: 'Maximum hypertrophy', detail: '2-4 lbs lean muscle gain' },
      ],
      endurance: [
        { week: 1, milestone: 'ATP stores optimized', detail: 'Energy system primed' },
        { week: 2, milestone: 'Reduced fatigue', detail: 'Push through plateaus' },
        { week: 4, milestone: 'Extended performance', detail: '+10-15% workout duration' },
        { week: 8, milestone: 'Elite endurance', detail: 'Faster recovery between sets' },
      ],
      energy: [
        { week: 1, milestone: 'Cellular energy boost', detail: 'ATP regeneration improved' },
        { week: 2, milestone: 'Sustained intensity', detail: 'No more mid-workout crashes' },
        { week: 4, milestone: 'All-day energy', detail: 'Better focus and drive' },
        { week: 8, milestone: 'Optimized performance', detail: 'Peak mental & physical energy' },
      ],
    }

    const timeline = baseTimelines[goal] || baseTimelines.strength
    return timeline.map(item => ({
      ...item,
      week: Math.round(item.week * speedMultiplier),
    }))
  }

  const getDosageRecommendation = () => {
    const frequency = answers[1]
    const recommendations = {
      daily: { gummies: 4, timing: 'Take 2 gummies pre-workout, 2 post-workout', schedule: 'Every training day' },
      frequent: { gummies: 4, timing: 'Take all 4 gummies 30 min before training', schedule: '4-5 days per week' },
      moderate: { gummies: 3, timing: 'Take 3 gummies on training days with breakfast', schedule: 'On workout days' },
      starting: { gummies: 2, timing: 'Take 2 gummies daily with any meal', schedule: 'Build the habit first' },
    }
    return recommendations[frequency] || recommendations.frequent
  }

  const handleAnswer = (optionId) => {
    setAnswers({ ...answers, [step]: optionId })
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setShowResult(true)
    }
  }

  const resetQuiz = () => {
    setStep(0)
    setAnswers({})
    setShowResult(false)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="relative w-full max-w-2xl bg-black border border-white/10 rounded-3xl overflow-hidden"
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white"
        >
          ×
        </motion.button>

        {/* Progress bar */}
        {!showResult && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <span className="text-blue-400 text-xs tracking-[0.3em] uppercase">
                  Question {step + 1} of {questions.length}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-4 mb-8">
                  {questions[step].question}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {questions[step].options.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left transition-all hover:bg-white/10"
                    >
                      <span className="text-4xl mb-3 block">{option.icon}</span>
                      <div className="text-lg font-bold text-white mb-1">{option.label}</div>
                      <div className="text-sm text-white/50">{option.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {/* Result header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-blue-400 text-xs tracking-[0.3em] uppercase">You are a</span>
                  <h2 className="text-3xl md:text-4xl font-black mt-2 mb-2">
                    <GlitchText>
                      <span className="gradient-text">{getResult().title}</span>
                    </GlitchText>
                  </h2>
                  <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
                    {getResult().benefit}
                  </p>
                </motion.div>

                {/* Personalized Timeline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5"
                >
                  <h3 className="text-sm font-bold text-blue-400 tracking-wider uppercase mb-4">
                    Your Personal Results Timeline
                  </h3>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600" />

                    {getTimeline().map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.15 }}
                        className="relative flex items-start gap-4 mb-4 last:mb-0"
                      >
                        {/* Timeline dot */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.15, type: 'spring' }}
                          className="relative z-10 w-12 h-12 rounded-full bg-black border-2 border-blue-400 flex items-center justify-center flex-shrink-0"
                        >
                          <span className="text-blue-400 font-black text-xs">W{item.week}</span>
                        </motion.div>

                        {/* Content */}
                        <div className="text-left flex-1 pt-1">
                          <div className="text-white font-bold text-sm">{item.milestone}</div>
                          <div className="text-white/40 text-xs">{item.detail}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Dosage Recommendation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-400/30 rounded-2xl p-4 mb-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl font-black text-blue-400">{getDosageRecommendation().gummies}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-sm">Your Recommended Daily Dose</div>
                      <div className="text-blue-300 text-xs">{getDosageRecommendation().timing}</div>
                      <div className="text-white/40 text-xs mt-1">{getDosageRecommendation().schedule}</div>
                    </div>
                  </div>
                </motion.div>

                {/* Product CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-5"
                >
                  <div className="flex items-center gap-3">
                    <img src={PRODUCT_IMAGE} alt="BUILT" className="w-14 h-auto" />
                    <div className="text-left">
                      <div className="text-white font-bold">BUILT Creatine Gummies</div>
                      <div className="text-white/40 text-xs">120 gummies per bottle</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black gradient-text">$34.99</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="flex gap-3 justify-center"
                >
                  <motion.button
                    onClick={resetQuiz}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 border border-white/20 text-white/60 hover:text-white text-sm rounded-full transition-all"
                  >
                    Retake Quiz
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-black font-bold text-sm rounded-full transition-all"
                  >
                    Start My Journey
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Quiz CTA Section
function QuizCTA({ onStartQuiz }) {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-blue-900/20" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-blue-400 text-sm tracking-[0.3em] uppercase">Personalized for you</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mt-4 mb-6">
            FIND YOUR <span className="gradient-text">FIT</span>
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Take our 30-second quiz to discover how BUILT can help you crush your specific fitness goals.
          </p>

          <motion.button
            onClick={onStartQuiz}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-10 py-5 bg-transparent border-2 border-blue-400 text-blue-400 font-black text-lg tracking-wider overflow-hidden"
          >
            <span className="relative z-10 group-hover:text-black transition-colors">
              START QUIZ →
            </span>
            <motion.div
              className="absolute inset-0 bg-blue-400"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

// Single Falling Raspberry Component
function FallingRaspberry({ index, scrollProgress, total, isMobile }) {
  // Randomized properties for each raspberry
  const seed = index * 137.5
  const startX = ((index % 7) - 3) * (isMobile ? 12 : 15) + (Math.sin(seed) * (isMobile ? 6 : 10)) // Spread across screen
  const startY = -15 - (index % 5) * 8 // Staggered start heights above viewport
  const endY = 120 + (index % 4) * 10 // End below viewport
  const rotation = (index % 2 === 0 ? 1 : -1) * (180 + (index % 3) * 90) // Reduced rotation
  const size = isMobile ? (25 + (index % 3) * 10) : (40 + (index % 4) * 15) // Smaller on mobile
  const delay = (index / total) * 0.5 // Staggered timing

  // Calculate progress for this specific raspberry
  const adjustedProgress = Math.max(0, Math.min(1, (scrollProgress - delay) / (1 - delay)))

  // Eased progress for smooth animation
  const easedProgress = 1 - Math.pow(1 - adjustedProgress, 2)

  // Calculate current position
  const currentY = startY + (endY - startY) * easedProgress
  const currentRotation = rotation * easedProgress
  const wobbleX = Math.sin(easedProgress * Math.PI * 3 + index) * 8 // Gentle side-to-side wobble

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${50 + startX}%`,
        top: `${currentY}%`,
        x: wobbleX,
        rotate: currentRotation,
        width: size,
        height: size,
      }}
    >
      {/* Raspberry SVG */}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }}>
        {/* Main berry body - cluster of drupelets */}
        <defs>
          <radialGradient id={`berryGrad${index}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
          <radialGradient id={`drupeletGrad${index}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="70%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </radialGradient>
        </defs>

        {/* Berry drupelets (the bumpy parts) */}
        <circle cx="50" cy="35" r="12" fill={`url(#drupeletGrad${index})`} />
        <circle cx="35" cy="45" r="11" fill={`url(#drupeletGrad${index})`} />
        <circle cx="65" cy="45" r="11" fill={`url(#drupeletGrad${index})`} />
        <circle cx="42" cy="58" r="12" fill={`url(#drupeletGrad${index})`} />
        <circle cx="58" cy="58" r="12" fill={`url(#drupeletGrad${index})`} />
        <circle cx="50" cy="72" r="11" fill={`url(#drupeletGrad${index})`} />
        <circle cx="30" cy="60" r="9" fill={`url(#drupeletGrad${index})`} />
        <circle cx="70" cy="60" r="9" fill={`url(#drupeletGrad${index})`} />
        <circle cx="38" cy="75" r="8" fill={`url(#drupeletGrad${index})`} />
        <circle cx="62" cy="75" r="8" fill={`url(#drupeletGrad${index})`} />

        {/* Highlight reflections */}
        <circle cx="45" cy="32" r="4" fill="rgba(255,255,255,0.4)" />
        <circle cx="55" cy="55" r="3" fill="rgba(255,255,255,0.3)" />

        {/* Stem/leaves at top */}
        <ellipse cx="50" cy="20" rx="8" ry="5" fill="#22c55e" />
        <ellipse cx="42" cy="18" rx="6" ry="4" fill="#16a34a" transform="rotate(-20 42 18)" />
        <ellipse cx="58" cy="18" rx="6" ry="4" fill="#16a34a" transform="rotate(20 58 18)" />
        <rect x="48" y="10" width="4" height="12" rx="2" fill="#15803d" />
      </svg>
    </motion.div>
  )
}

// Scroll-Triggered Falling Raspberries Section
function UnboxingSection() {
  const containerRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const isMobile = useIsMobile()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrollProgress(v)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  const textOpacity = useTransform(scrollYProgress, [0.7, 0.85], [0, 1])
  const textY = useTransform(scrollYProgress, [0.7, 0.85], [50, 0])
  const glowOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 0.8])
  const titleScale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1])

  // Reduced count on mobile for performance
  const raspberryCount = isMobile ? 10 : 25

  return (
    <section ref={containerRef} className="h-[200vh] md:h-[300vh] relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        {/* Background glow effect */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-500/40 rounded-full blur-[80px] md:blur-[150px]" />
        </motion.div>

        {/* Title that appears at start */}
        <motion.div
          style={{ opacity: titleOpacity, scale: titleScale }}
          className="absolute top-1/3 left-0 right-0 text-center z-10 px-4"
        >
          <h2 className="text-3xl md:text-8xl font-black text-white mb-2">
            <span className="gradient-text">BLUE RASPBERRY</span>
          </h2>
          <p className="text-white/60 text-base md:text-2xl tracking-wider">FLAVOR EXPLOSION</p>
        </motion.div>

        {/* Falling raspberries */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(raspberryCount)].map((_, i) => (
            <FallingRaspberry
              key={i}
              index={i}
              scrollProgress={scrollProgress}
              total={raspberryCount}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Text overlay - appears at end */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute bottom-16 md:bottom-28 left-0 right-0 text-center z-10 px-4"
        >
          <h2 className="text-2xl md:text-6xl font-black text-white mb-2 md:mb-4">
            TASTE THE <span className="gradient-text">POWER</span>
          </h2>
          <p className="text-white/60 text-sm md:text-xl">120 gummies of pure blue raspberry goodness</p>
        </motion.div>

        {/* Scroll progress indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className="w-32 h-1 bg-blue-400 origin-left rounded-full"
          />
        </div>
      </div>
    </section>
  )
}

// Testimonials
function Testimonials() {
  const [active, setActive] = useState(0)
  const testimonials = [
    { name: 'JAKE M.', text: 'Finally a creatine that tastes amazing AND works. The Blue Raspberry flavor is addictive.', role: 'Powerlifter' },
    { name: 'EMMA S.', text: 'Love that it\'s vegan! No more chalky powders. These gummies are a game changer.', role: 'CrossFit Athlete' },
    { name: 'MARCUS T.', text: 'Consistent gains since I switched. 120 gummies means I\'m stocked for over a month.', role: 'Bodybuilder' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Large background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[30vw] font-black text-white/[0.02] select-none">REAL</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-blue-400 text-sm tracking-[0.3em] uppercase">Testimonials</span>
        <h2 className="text-4xl md:text-6xl font-black text-white mt-4 mb-16">
          WHAT THEY SAY
        </h2>

        <div className="relative h-64">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <p className="text-2xl md:text-4xl font-light text-white/80 italic mb-8">
                "{testimonials[active].text}"
              </p>
              <div className="text-blue-400 font-bold">{testimonials[active].name}</div>
              <div className="text-white/40 text-sm">{testimonials[active].role}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-3">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-12 h-1 transition-all duration-300 ${
                i === active ? 'bg-blue-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Buy Section
function BuySection({ onCheckout }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  })

  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section ref={ref} id="buy" className="min-h-screen bg-black relative flex items-center py-32 overflow-hidden">
      {/* Animated background lines */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent w-full"
            style={{ top: `${20 + i * 15}%` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div style={{ scale, opacity }} className="text-center mb-16">
          <span className="text-blue-400 text-sm tracking-[0.3em] uppercase">Get Yours Now</span>
          <h2 className="text-5xl md:text-8xl font-black mt-4">
            <span className="text-white">GET </span>
            <GlitchText>
              <span className="gradient-text">BUILT</span>
            </GlitchText>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative">
            {/* Glowing border effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-3xl opacity-50 blur-sm animate-pulse" />

            <div className="relative bg-black border border-blue-400/50 rounded-3xl p-8 md:p-12">
              {/* Product Image in card */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img
                    src={PRODUCT_IMAGE}
                    alt="BUILT Creatine Gummies"
                    className="w-48 h-auto mx-auto product-glow"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="hidden text-7xl mb-4">🫙</div>
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-1">BUILT Creatine Gummies</h3>
                <p className="text-white/40">120 Gummies • Blue Raspberry • 100% Vegan</p>
              </div>

              {/* Price */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className="text-white/40 line-through text-2xl">$49.99</span>
                <span className="text-5xl font-black gradient-text">$34.99</span>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {['3G Creatine Per Serving', '120 Gummies (40 Servings)', '100% Vegan Formula', 'Blue Raspberry Flavor', 'Free Shipping'].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-white/70"
                  >
                    <span className="text-blue-400">✓</span>
                    {item}
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={onCheckout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full py-5 bg-blue-500 hover:bg-blue-400 text-black font-black text-lg text-center transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">ADD TO CART</span>
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <p className="text-center text-white/30 text-xs mt-4 tracking-wider">
                30-DAY MONEY-BACK GUARANTEE
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <span>🔒</span> Secure Checkout
          </div>
          <div className="flex items-center gap-2">
            <span>🚚</span> Free Shipping
          </div>
          <div className="flex items-center gap-2">
            <span>🌱</span> 100% Vegan
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="py-16 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-4xl font-black">
            <span className="gradient-text">BUILT</span>
          </div>

          <div className="flex gap-8 text-white/40 text-sm tracking-wider">
            <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-white transition-colors">TERMS</a>
            <a href="#" className="hover:text-white transition-colors">CONTACT</a>
          </div>

          <div className="flex gap-4">
            {['X', 'IG', 'YT'].map((social, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.1, color: '#3b82f6' }}
                className="w-12 h-12 border border-white/20 flex items-center justify-center text-white/60 font-bold text-sm hover:border-blue-400 transition-colors"
              >
                {social}
              </motion.a>
            ))}
          </div>
        </div>

        <div className="text-center text-white/20 text-xs mt-12 tracking-widest">
          © 2025 BUILT. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  )
}

// Checkout Modal
function CheckoutModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    zip: '',
    card: ''
  })
  const [quantity, setQuantity] = useState(1)
  const [step, setStep] = useState(1)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Stripe integration will go here
    alert('Stripe integration coming soon!')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Glowing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[150px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white border border-white/20 hover:border-blue-400 transition-colors"
        >
          <span className="text-2xl">×</span>
        </motion.button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Left - Product Summary */}
          <div className="relative p-8 md:p-12 border border-white/10 bg-black/50 backdrop-blur-sm">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-400" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-400" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-400" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-400" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-blue-400 text-xs tracking-[0.3em] uppercase">Checkout</span>
              <h2 className="text-4xl md:text-5xl font-black mt-2 mb-8">
                <GlitchText>
                  <span className="gradient-text">YOUR ORDER</span>
                </GlitchText>
              </h2>
            </motion.div>

            {/* Product */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative mb-8"
            >
              <div className="flex gap-6 items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full" />
                  <motion.img
                    src={PRODUCT_IMAGE}
                    alt="BUILT Creatine Gummies"
                    className="w-32 h-auto relative z-10"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">BUILT Creatine Gummies</h3>
                  <p className="text-white/50 text-sm">Blue Raspberry • 120 Gummies</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-white/20">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        -
                      </motion.button>
                      <span className="w-12 text-center font-mono text-lg">{quantity}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        +
                      </motion.button>
                    </div>
                    <span className="text-2xl font-black gradient-text">${(34.99 * quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 pt-6 border-t border-white/10"
            >
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="font-mono">${(34.99 * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span className="text-blue-400 font-bold">FREE</span>
              </div>
              <motion.div
                className="flex justify-between text-xl font-bold pt-3 border-t border-white/10"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Total</span>
                <span className="gradient-text font-black">${(34.99 * quantity).toFixed(2)}</span>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 mt-8 text-white/40 text-xs"
            >
              <span className="flex items-center gap-1">🔒 Secure</span>
              <span className="flex items-center gap-1">🚚 Free Shipping</span>
              <span className="flex items-center gap-1">↩️ 30-Day Returns</span>
            </motion.div>
          </div>

          {/* Right - Form */}
          <div className="relative p-8 md:p-12 border border-white/10 border-l-0 bg-black/30 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-4 mb-8">
                {[1, 2].map((s) => (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={`flex items-center gap-2 ${step === s ? 'text-blue-400' : 'text-white/30'}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className={`w-8 h-8 flex items-center justify-center border ${step === s ? 'border-blue-400 bg-blue-400/10' : 'border-white/20'} font-mono text-sm`}>
                      {s}
                    </span>
                    <span className="text-sm font-bold tracking-wider">
                      {s === 1 ? 'INFO' : 'PAYMENT'}
                    </span>
                  </motion.button>
                ))}
                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent" />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs text-white/40 tracking-wider mb-2">EMAIL</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors font-mono"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 tracking-wider mb-2">FULL NAME</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 tracking-wider mb-2">ADDRESS</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors"
                        placeholder="123 Street Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/40 tracking-wider mb-2">CITY</label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 tracking-wider mb-2">ZIP CODE</label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          required
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors font-mono"
                          placeholder="10001"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => setStep(2)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold tracking-wider transition-all mt-6 relative overflow-hidden group"
                    >
                      <span className="relative z-10">CONTINUE TO PAYMENT</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs text-white/40 tracking-wider mb-2">CARD NUMBER</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        name="card"
                        value={formData.card}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors font-mono tracking-widest"
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/40 tracking-wider mb-2">EXPIRY</label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors font-mono"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 tracking-wider mb-2">CVC</label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-400 px-4 py-3 text-white outline-none transition-colors font-mono"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    {/* Stripe placeholder notice */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 border border-blue-400/30 bg-blue-400/5 text-sm text-blue-300"
                    >
                      <span className="font-bold">Note:</span> Stripe integration will be added here. This is a preview of the checkout flow.
                    </motion.div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-black font-black tracking-wider transition-all mt-6 relative overflow-hidden"
                    >
                      <motion.span
                        className="relative z-10 flex items-center justify-center gap-2"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🔒 PAY ${(34.99 * quantity).toFixed(2)}
                      </motion.span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-3 text-white/40 hover:text-white text-sm transition-colors"
                    >
                      ← Back to information
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main App
function App() {
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutOpen && <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {quizOpen && <FitnessQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />}
      </AnimatePresence>

      {!loading && (
        <div className="bg-black text-white min-h-screen cursor-none md:cursor-none">
          <CustomCursor />
          <NoiseOverlay />
          <Navbar onShopNow={() => setCheckoutOpen(true)} />
          <Hero />
          <MarqueeSection />
          <ProductSection />
          <UnboxingSection />
          <HorizontalFeatures />
          <QuizCTA onStartQuiz={() => setQuizOpen(true)} />
          <Testimonials />
          <BuySection onCheckout={() => setCheckoutOpen(true)} />
          <Footer />
        </div>
      )}
    </>
  )
}

export default App
