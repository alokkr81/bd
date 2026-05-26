import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE HEART PARTICLES
// ─────────────────────────────────────────────────────────────────────────────
const HeartParticles = memo(function HeartParticles({ count = 15 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate random hearts
    const hearts = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 500, // start below screen
      size: Math.random() * 8 + 4,
      vy: -(Math.random() * 1.5 + 0.5),
      vx: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }))

    const drawHeart = (ctx, x, y, size, opacity) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(size / 30, size / 30) // base size 30
      ctx.globalAlpha = opacity
      ctx.fillStyle = '#C8A2C8'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(200, 162, 200, 0.8)'

      // Heart path
      ctx.beginPath()
      ctx.moveTo(15, 10)
      ctx.bezierCurveTo(15, 5, 10, 0, 5, 0)
      ctx.bezierCurveTo(0, 0, 0, 10, 0, 10)
      ctx.bezierCurveTo(0, 18, 15, 25, 15, 30)
      ctx.bezierCurveTo(15, 25, 30, 18, 30, 10)
      ctx.bezierCurveTo(30, 10, 30, 0, 25, 0)
      ctx.bezierCurveTo(20, 0, 15, 5, 15, 10)
      ctx.fill()
      ctx.restore()
    }

    let t = 0
    function loop() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      t += 0.02

      hearts.forEach(h => {
        h.y += h.vy
        h.x += h.vx + Math.sin(t + h.phase) * 0.5 // drifting effect

        // Reset if off screen top
        if (h.y < -50) {
          h.y = window.innerHeight + 50
          h.x = Math.random() * window.innerWidth
        }

        drawHeart(ctx, h.x, h.y, h.size, h.opacity)
      })

      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// CELEBRATION FINALE PARTICLES (Confetti)
// ─────────────────────────────────────────────────────────────────────────────
function launchFinaleConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const colors = ['#C8A2C8', '#9D4EDD', '#C77DFF', '#FF69B4', '#FFF']
  const particles = Array.from({ length: 250 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: (Math.random() - 0.5) * 30,
    vy: (Math.random() - 0.5) * 30 - 10,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 15,
    opacity: 1,
    life: 1,
    decay: Math.random() * 0.015 + 0.005
  }))

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let active = false

    particles.forEach(p => {
      p.life -= p.decay
      if (p.life > 0) {
        active = true
        p.x += p.vx
        p.vy += 0.5 // gravity
        p.y += p.vy
        p.rot += p.rotSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color

        // Draw little stars/diamonds
        ctx.beginPath()
        ctx.moveTo(0, -p.size)
        ctx.lineTo(p.size / 2, 0)
        ctx.lineTo(0, p.size)
        ctx.lineTo(-p.size / 2, 0)
        ctx.fill()
        ctx.restore()
      }
    })

    if (active) {
      requestAnimationFrame(draw)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(draw)
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const NextButton = ({ onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(200, 162, 200, 0.8)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      marginTop: '40px',
      padding: '14px 32px',
      borderRadius: '30px',
      background: 'rgba(200, 162, 200, 0.2)',
      border: '1px solid rgba(200, 162, 200, 0.5)',
      color: '#fff',
      fontFamily: "'Poppins', sans-serif",
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.05em',
      cursor: 'pointer',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 10,
      position: 'relative'
    }}
  >
    {children}
  </motion.button>
)

// ─────────────────────────────────────────────────────────────────────────────
// SLIDES
// ─────────────────────────────────────────────────────────────────────────────

const Slide1 = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="story-card"
  >
    <motion.div
      animate={{ scale: [1, 1.1, 1], filter: ['drop-shadow(0 0 10px rgba(200,162,200,0.5))', 'drop-shadow(0 0 25px rgba(200,162,200,0.9))', 'drop-shadow(0 0 10px rgba(200,162,200,0.5))'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ fontSize: '4rem', marginBottom: '24px' }}
    >
      💜
    </motion.div>
    <h2 className="story-title">A Special Story💖</h2>
    <p className="story-text">I have something magical to show you....💫</p>
    <NextButton onClick={onNext}>Meri Feelings Ko Mehsoos Karo💖</NextButton>
  </motion.div>
)

const Slide2 = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="story-card"
  >
    <h2 className="story-title">Happy Birthday Neha </h2>
    <p className="story-text" style={{ maxWidth: '400px', lineHeight: 1.8 }}>
      Meri love story ka sabse beautiful chapter tum ho. Sirf tumhari presence hi meri duniya ko roshan kar deti hai. Tumhare saath bitaya har moment magical lagta hai, aur yeh special din tumhari beautiful soul aur un sab cheezon ka celebration hai jo tumhe itna unique banati hain. Main sach me bahut grateful hoon ki mera dil tumse mila. Happy Birthday, my love. 💖
    </p>
    <NextButton onClick={onNext}> Mere Dil Ko Aur Jaano</NextButton>
  </motion.div>
)

const Slide3 = ({ onNext }) => {
  const cards = [
    { title: "Your Smile", icon: "✨" },
    { title: "Your Heart", icon: "💖" },
    { title: "Your Mind", icon: "🧠" }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="story-card"
    >
      <h2 className="story-title">Har Wajah Sirf Tum🌸 </h2>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 + 0.5, duration: 0.6 }}
            whileHover={{ y: -10, rotate: i % 2 === 0 ? 3 : -3, boxShadow: '0 15px 30px rgba(200,162,200,0.3)' }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              width: '120px',
              textAlign: 'center',
              backdropFilter: 'blur(5px)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{c.icon}</div>
            <div style={{ fontSize: '0.9rem', color: '#EAEAEA', fontFamily: "'Poppins', sans-serif" }}>{c.title}</div>
          </motion.div>
        ))}
      </div>

      <NextButton onClick={onNext}>Hamari Endless Love Story💖</NextButton>
    </motion.div>
  )
}

const Slide4 = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="story-card"
  >
    <motion.div
      animate={{ y: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        margin: '0 auto 24px',
        padding: '8px',
        background: 'linear-gradient(135deg, #C8A2C8, #9D4EDD)',
        boxShadow: '0 0 40px rgba(157, 78, 221, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <img
        src="/10.jpeg"
        alt="Memory snapshot"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      />
    </motion.div>

    <h2 className="story-title" style={{ fontSize: '1.5rem' }}>Tumhare Saath Bitaya Har Pal Anmol Hai✨</h2>
    <p className="story-text">Meri Duniya Ki Sabse Favorite Jagah Tumhare Paas Hai. 💖</p>

    <NextButton onClick={onNext}>Ek Aakhri Dil Ki Baat 💖</NextButton>
  </motion.div>
)

const Slide5 = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="story-card"
    style={{ position: 'relative' }}
  >
    {/* Magical Aura */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(157,78,221,0.4) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
        borderRadius: '50%'
      }}
    />

    <h2 className="story-title" style={{ zIndex: 1, position: 'relative', textShadow: '0 0 20px #C8A2C8' }}>Dil Ki Sabse Khoobsurat Tamanna ✨</h2>
    <p className="story-text" style={{ zIndex: 1, position: 'relative', maxWidth: '400px', lineHeight: 1.8 }}>
      Dua karta hoon ki tumhari zindagi ka har din khushiyon se bhara ho, aur tum kabhi yeh mehsoos na karo ki tum akela ho, kyunki mera pyaar hamesha tumhare saath hai 💖
    </p>

    <NextButton onClick={onNext}>Chalo Is Khubsurat Din Ko Celebrate Karein 🎉💖</NextButton>
  </motion.div>
)

const Slide6 = ({ onClose }) => {
  useEffect(() => {
    // Launch big celebration confetti when this mounts
    launchFinaleConfetti()
    const t1 = setTimeout(launchFinaleConfetti, 1000)
    const t2 = setTimeout(launchFinaleConfetti, 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      className="story-card"
      style={{ background: 'transparent', border: 'none', boxShadow: 'none', backdropFilter: 'none' }}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(3rem, 10vw, 6rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #fff 0%, #C8A2C8 50%, #9D4EDD 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(157, 78, 221, 0.8))',
          margin: 0,
          lineHeight: 1.1
        }}>
          ❤️Happy❤️<br />Birthday<br />❤️Neha❤️
        </h1>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
        onClick={onClose}
        style={{
          marginTop: '60px',
          padding: '12px 24px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'rgba(255,255,255,0.7)',
          borderRadius: '20px',
          cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        Tumhare Saath Ka Khoobsurat Ehsaas..🌸❤️
      </motion.button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function RomanticStory({ isVisible, onClose }) {
  const [step, setStep] = useState(0)

  // Block body scroll when active
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
      setStep(0)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!isVisible) return null

  const handleNext = () => setStep(s => s + 1)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 9999, // Super high to cover everything
          background: 'rgba(10, 5, 20, 0.85)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <HeartParticles count={25} />

        {/* Shared CSS for cards */}
        <style>{`
          .story-card {
            position: relative;
            z-index: 10;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(200, 162, 200, 0.2);
            border-radius: 32px;
            padding: clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px);
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 0 20px rgba(200,162,200,0.05);
            backdrop-filter: blur(20px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .story-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, #C8A2C8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 24px;
            letter-spacing: 0.02em;
          }
          .story-text {
            font-family: 'Poppins', sans-serif;
            font-size: clamp(1rem, 2.5vw, 1.15rem);
            color: #EAEAEA;
            font-weight: 300;
            line-height: 1.6;
            margin: 0;
            opacity: 0.9;
          }
        `}</style>

        <AnimatePresence mode="wait">
          {step === 0 && <Slide1 key="s0" onNext={handleNext} />}
          {step === 1 && <Slide2 key="s1" onNext={handleNext} />}
          {step === 2 && <Slide3 key="s2" onNext={handleNext} />}
          {step === 3 && <Slide4 key="s3" onNext={handleNext} />}
          {step === 4 && <Slide5 key="s4" onNext={handleNext} />}
          {step === 5 && <Slide6 key="s5" onClose={() => {
            onClose && onClose()
          }} />}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  )
}
