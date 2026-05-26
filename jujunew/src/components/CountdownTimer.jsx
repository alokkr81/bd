import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — change these to update the birthday
// ─────────────────────────────────────────────────────────────────────────────
const BIRTH_DATE         = new Date('2002-05-28T00:00:00+05:30') // IST birthdate
const BIRTHDAY_MONTH     = 4   // May (0-indexed)
const BIRTHDAY_DAY       = 28
const CELEBRATION_MONTHS = 6   // Show age for 6 months after birthday

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get "now" in IST — shift UTC by +5:30 so local getters return IST values */
function nowIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
}

/** Midnight of a given IST date as a real UTC-comparable timestamp */
function istMidnight(year, month, day) {
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - 5.5 * 60 * 60 * 1000)
}

function determineMode() {
  const ist  = nowIST()
  const year = ist.getFullYear()
  const now  = new Date() // real UTC-based now for comparisons

  const thisBday = istMidnight(year, BIRTHDAY_MONTH, BIRTHDAY_DAY)
  const celebEnd = istMidnight(year, BIRTHDAY_MONTH + CELEBRATION_MONTHS, BIRTHDAY_DAY)

  if (now < thisBday) return { mode: 'countdown', target: thisBday }
  if (now < celebEnd) return { mode: 'celebration', target: null }
  return { mode: 'countdown', target: istMidnight(year + 1, BIRTHDAY_MONTH, BIRTHDAY_DAY) }
}

function calcTimeLeft(target) {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const d = target.getTime() - Date.now()
  if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(d / 86400000),
    hours:   Math.floor((d / 3600000) % 24),
    minutes: Math.floor((d / 60000)   % 60),
    seconds: Math.floor((d / 1000)    % 60),
  }
}

function calcAge() {
  const now   = nowIST()
  const birth = new Date(BIRTH_DATE.getTime() + 5.5 * 60 * 60 * 1000)
  let years   = now.getFullYear() - birth.getFullYear()
  let months  = now.getMonth()    - birth.getMonth()
  let days    = now.getDate()     - birth.getDate()
  let hours   = now.getHours()    - birth.getHours()
  let minutes = now.getMinutes()  - birth.getMinutes()
  let seconds = now.getSeconds()  - birth.getSeconds()
  if (seconds < 0) { seconds += 60; minutes-- }
  if (minutes < 0) { minutes += 60; hours-- }
  if (hours   < 0) { hours   += 24; days-- }
  if (days    < 0) { const prev = new Date(now.getFullYear(), now.getMonth(), 0); days += prev.getDate(); months-- }
  if (months  < 0) { months += 12; years-- }
  return { years, months, days, hours, minutes, seconds }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const C = ['#C8A2C8','#9D4EDD','#C77DFF','#FFD700','#FF69B4','#fff','#7DF9FF']
  const ps = Array.from({ length: 200 }, () => ({
    x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.6,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 16,  vy: -(Math.random() * 18 + 6),
    sz: Math.random() * 8 + 3,       c:  C[Math.floor(Math.random() * C.length)],
    rot: Math.random() * 360,        rs: (Math.random() - 0.5) * 14,
    op: 1,                           sh: Math.random() > 0.5 ? 'r' : 'c',
  }))
  let f = 0; const M = 220
  ;(function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ps.forEach(p => {
      p.x += p.vx; p.vy += 0.3; p.y += p.vy; p.rot += p.rs
      p.op = Math.max(0, 1 - f / M)
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
      ctx.globalAlpha = p.op; ctx.fillStyle = p.c
      if (p.sh === 'r') ctx.fillRect(-p.sz/2, -p.sz/2, p.sz, p.sz * 0.55)
      else { ctx.beginPath(); ctx.arc(0, 0, p.sz/2, 0, Math.PI*2); ctx.fill() }
      ctx.restore()
    })
    f++
    if (f < M) requestAnimationFrame(draw); else canvas.remove()
  })()
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING SPARKLE PARTICLES (Canvas, GPU-friendly)
// ─────────────────────────────────────────────────────────────────────────────
const FloatingSparkles = memo(function FloatingSparkles({ count = 22, color = 'rgba(200,162,200,' }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); let raf
    const resize = () => {
      c.width  = c.offsetWidth  * devicePixelRatio
      c.height = c.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize(); window.addEventListener('resize', resize)
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight,
      r: Math.random() * 2 + 0.8, dx: (Math.random() - 0.5) * 0.45,
      dy: (Math.random() - 0.5) * 0.45, base: Math.random() * 0.45 + 0.15,
      ph: Math.random() * Math.PI * 2,
    }))
    let t = 0
    function loop() {
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight); t += 0.016
      dots.forEach(d => {
        d.x += d.dx; d.y += d.dy
        if (d.x < 0 || d.x > c.offsetWidth)  d.dx *= -1
        if (d.y < 0 || d.y > c.offsetHeight) d.dy *= -1
        const a = d.base + 0.2 * Math.sin(t + d.ph)
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${a.toFixed(2)})`
        ctx.shadowBlur = 10; ctx.shadowColor = `${color}0.5)`
        ctx.fill(); ctx.shadowBlur = 0
      })
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [count, color])
  return <canvas ref={ref} style={{
    position:'absolute', inset:0, width:'100%', height:'100%',
    pointerEvents:'none', zIndex:0, borderRadius:'inherit',
  }} />
})

// ─────────────────────────────────────────────────────────────────────────────
// DIGIT FLIP CARD — animates on value change
// ─────────────────────────────────────────────────────────────────────────────
const DigitFlip = memo(function DigitFlip({ value, label, glowColor = '#C8A2C8', size = 'lg' }) {
  const prev = useRef(value)
  const changed = prev.current !== value
  useEffect(() => { prev.current = value }, [value])

  const isLg  = size === 'lg'
  const cardW = isLg ? 'clamp(120px, 22vw, 160px)' : 'clamp(82px, 18vw, 115px)'
  const numSz = isLg ? 'clamp(2.2rem, 6vw, 3.6rem)' : 'clamp(1.6rem, 4.5vw, 2.6rem)'

  return (
    <div
      style={{
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        background: 'rgba(255,255,255,0.055)',
        border: `1px solid ${glowColor}55`, borderRadius: '22px',
        padding: isLg ? 'clamp(20px,3.5vw,30px) 8px' : 'clamp(14px,2.5vw,22px) 6px',
        textAlign: 'center', width: cardW,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 0 24px ${glowColor}22, inset 0 0 18px ${glowColor}0a`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        willChange: 'transform', transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 40px ${glowColor}55, inset 0 0 24px ${glowColor}18`
        e.currentTarget.style.borderColor = `${glowColor}99`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = `0 0 24px ${glowColor}22, inset 0 0 18px ${glowColor}0a`
        e.currentTarget.style.borderColor = `${glowColor}55`
      }}
    >
      {/* Inner glow shimmer */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'22px',
        background: `radial-gradient(ellipse at 50% 0%, ${glowColor}18 0%, transparent 70%)`,
        pointerEvents:'none', zIndex:0,
      }} />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={changed ? { y: -28, opacity: 0, scale: 0.85 } : { opacity: 1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 28, opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Poppins', sans-serif", fontSize: numSz,
            fontWeight: 800, color: '#fff', lineHeight: 1,
            position: 'relative', zIndex: 1,
            textShadow: `0 0 22px ${glowColor}88, 0 0 8px ${glowColor}44`,
            letterSpacing: '-0.02em',
          }}
          aria-live="polite"
          aria-label={`${label}: ${String(value).padStart(2,'0')}`}
        >
          {String(value).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>

      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 'clamp(0.6rem, 1.8vw, 0.82rem)',
        fontWeight: 600, color: glowColor, marginTop: '10px',
        textTransform: 'uppercase', letterSpacing: '0.28em',
        opacity: 0.85, position: 'relative', zIndex: 1,
      }}>
        {label}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// TYPING EFFECT HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useTyping(text, speed = 42) {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    let i = 0; setOut(''); setDone(false)
    const id = setInterval(() => {
      i++; setOut(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { out, done }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function CountdownTimer() {
  const initial = determineMode()
  const [mode, setMode]         = useState(initial.mode)
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(initial.target))
  const [age, setAge]           = useState(() => calcAge())

  const modeRef       = useRef(initial.mode)
  const confettiFired = useRef(false)

  // Fire confetti on mount if already celebrating
  useEffect(() => {
    if (modeRef.current === 'celebration' && !confettiFired.current) {
      confettiFired.current = true
      launchConfetti()
    }
  }, [])

  // Master 1-second tick
  useEffect(() => {
    const tick = () => {
      const cur = determineMode()
      if (cur.mode === 'celebration') {
        if (modeRef.current !== 'celebration') {
          modeRef.current = 'celebration'
          setMode('celebration')
          if (!confettiFired.current) {
            confettiFired.current = true
            setTimeout(launchConfetti, 500)
          }
        }
        setAge(calcAge())
      } else {
        if (modeRef.current !== 'countdown') {
          modeRef.current = 'countdown'
          setMode('countdown')
          confettiFired.current = false
        }
        setTimeLeft(calcTimeLeft(cur.target))
      }
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const { out: tagline, done: taglineDone } = useTyping(
    mode === 'celebration' ? 'Every second with you is a celebration 💫' : '', 44,
  )

  const COUNTDOWN_UNITS = [
    { label: 'Days',    value: timeLeft.days,    glow: '#C77DFF' },
    { label: 'Hours',   value: timeLeft.hours,   glow: '#C8A2C8' },
    { label: 'Minutes', value: timeLeft.minutes, glow: '#9D4EDD' },
    { label: 'Seconds', value: timeLeft.seconds, glow: '#FF69B4' },
  ]

  const AGE_UNITS = [
    { label: 'Years',   value: age.years,   glow: '#C77DFF' },
    { label: 'Months',  value: age.months,  glow: '#C8A2C8' },
    { label: 'Days',    value: age.days,    glow: '#9D4EDD' },
    { label: 'Hours',   value: age.hours,   glow: '#FF69B4' },
    { label: 'Minutes', value: age.minutes, glow: '#7DF9FF' },
    { label: 'Seconds', value: age.seconds, glow: '#FFD700' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <AnimatePresence mode="wait">

        {/* ─────────────── COUNTDOWN MODE ─────────────── */}
        {mode === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.94 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', width: '100%' }}
          >
            {/* Heading */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
                fontWeight: 500, color: 'rgba(200,162,200,0.9)',
                textAlign: 'center', letterSpacing: '0.06em',
                marginBottom: '8px', textTransform: 'uppercase',
              }}
            >
              ✨ Countdown To Neha&apos;s Special Day ✨
            </motion.p>

            {/* Cards row */}
            <div style={{
              position: 'relative', display: 'flex',
              gap: 'clamp(10px, 2.5vw, 24px)', justifyContent: 'center',
              flexWrap: 'wrap', marginTop: '32px',
              padding: '24px clamp(8px,3vw,24px)',
            }}>
              <div style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none' }}>
                <FloatingSparkles count={28} color="rgba(157,78,221," />
              </div>
              {COUNTDOWN_UNITS.map((u, i) => (
                <motion.div
                  key={u.label}
                  initial={{ opacity: 0, scale: 0.7, y: 24 }}
                  animate={{ opacity: 1, scale: 1,   y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <DigitFlip value={u.value} label={u.label} glowColor={u.glow} size="lg" />
                </motion.div>
              ))}
            </div>

            {/* Pulse glow */}
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: -20, left: '50%',
                transform: 'translateX(-50%)', width: '60%', height: '40px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(157,78,221,0.35) 0%, transparent 70%)',
                filter: 'blur(14px)', pointerEvents: 'none',
              }}
            />
          </motion.div>
        )}

        {/* ─────────────── CELEBRATION MODE ─────────────── */}
        {mode === 'celebration' && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.9,  y: 40 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -30 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: '40px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '28px', position: 'relative',
            }}
          >
            <div style={{ position:'absolute', inset:'-40px', zIndex:0, pointerEvents:'none' }}>
              <FloatingSparkles count={38} color="rgba(200,162,200," />
            </div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22,1,0.36,1] }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #C8A2C8 0%, #fff 50%, #C77DFF 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(200,162,200,0.55))',
                textAlign: 'center', lineHeight: 1.2,
                position: 'relative', zIndex: 1, margin: 0,
              }}
            >
              🎉 Congratulations Neha 🎉
            </motion.h2>

            {/* Age cards */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.22,1,0.36,1] }}
              style={{
                display: 'flex', gap: 'clamp(7px, 2vw, 14px)',
                justifyContent: 'center', flexWrap: 'wrap',
                position: 'relative', zIndex: 1,
              }}
            >
              {AGE_UNITS.map((u, i) => (
                <motion.div
                  key={u.label}
                  initial={{ opacity: 0, scale: 0.75, y: 18 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.5, ease: [0.22,1,0.36,1] }}
                >
                  <DigitFlip value={u.value} label={u.label} glowColor={u.glow} size="sm" />
                </motion.div>
              ))}
            </motion.div>

            {/* Age summary text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(0.78rem, 2.2vw, 1rem)', fontWeight: 500,
                color: 'rgba(234,234,234,0.72)', letterSpacing: '0.04em',
                textAlign: 'center', position: 'relative', zIndex: 1,
                lineHeight: 1.7, padding: '0 12px',
              }}
            >
              {age.years} Years • {age.months} Months • {age.days} Days<br />
              {age.hours} Hours • {age.minutes} Minutes • {age.seconds} Seconds
            </motion.p>

            {/* Typing tagline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.8 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(0.95rem, 2.8vw, 1.3rem)', fontWeight: 400,
                color: 'rgba(255,255,255,0.88)', fontStyle: 'italic',
                textAlign: 'center', minHeight: '2em',
                position: 'relative', zIndex: 1, padding: '0 16px',
              }}
            >
              {tagline}
              {!taglineDone && (
                <span style={{
                  display: 'inline-block', width: '2px', height: '1em',
                  background: '#C8A2C8', marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'ctCursorBlink 0.7s steps(2) infinite',
                }} />
              )}
            </motion.p>

            {/* Glow burst */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: -30, left: '50%',
                transform: 'translateX(-50%)', width: '70%', height: '50px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(200,162,200,0.4) 0%, transparent 70%)',
                filter: 'blur(18px)', pointerEvents: 'none', zIndex: 0,
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      <style>{`
        @keyframes ctCursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default CountdownTimer
