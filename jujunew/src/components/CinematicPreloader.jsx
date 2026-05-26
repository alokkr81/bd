import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicPreloader({ onComplete }) {
  const [phase, setPhase] = useState(1);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Sequence timing exactly as requested (~11 seconds total)
    // Phase 1 (0-2s): Ambient Rain Matrix
    const t1 = setTimeout(() => setPhase(2), 2000); // Phase 2: Particles gather
    const t2 = setTimeout(() => setPhase(3), 3500); // Phase 3: Countdown 3-2-1
    const t3 = setTimeout(() => setPhase(4), 6500); // Phase 4: YOU ARE MY LOVE
    const t4 = setTimeout(() => setPhase(5), 9000); // Phase 5: Heart Reveal
    const t5 = setTimeout(() => onComplete(), 11000); // Finish

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  // WebGL/Canvas Particle Logic for phases 1 & 2
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix Rain
    const texts = ["LOVE", "ILOVEYOU", "FOREVER", "NEHA", "❤️", "✨"];
    const rain = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 1 + 0.2, // Reduced by 50% for dreamy effect
      text: texts[Math.floor(Math.random() * texts.length)],
      opacity: Math.random() * 0.4 + 0.1,
      fontSize: Math.random() * 12 + 10
    }));

    // Gathering Dots
    const dots = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8, // Slower base drift
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 0.5,
      color: Math.random() > 0.5 ? 'rgba(255, 182, 193, 0.7)' : 'rgba(255, 255, 255, 0.6)',
      tx: canvas.width / 2,
      ty: canvas.height / 2
    }));

    const draw = () => {
      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#020617'); // very dark slate
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Phase 1+ (Always falling matrix text)
      ctx.textAlign = "center";
      rain.forEach(r => {
        ctx.fillStyle = `rgba(255, 192, 203, ${r.opacity})`;
        ctx.font = `${r.fontSize}px "Orbitron", "Inter", sans-serif`;
        ctx.fillText(r.text, r.x, r.y);
        r.y += r.speed;
        if (r.y > canvas.height) {
          r.y = -20;
          r.x = Math.random() * canvas.width;
        }
      });

      // Phase 2+ (Gathering / Exploding particles)
      if (phase >= 2) {
        dots.forEach(d => {
          if (phase === 2) {
            // Gather to center smoothly with cinematic easing
            d.x += (d.tx - d.x) * 0.02 + d.vx * 0.5;
            d.y += (d.ty - d.y) * 0.02 + d.vy * 0.5;
          } else if (phase === 5) {
            // Explode softly outward
            d.x -= (d.tx - d.x) * 0.03;
            d.y -= (d.ty - d.y) * 0.03;
          } else {
            // Swirl slowly
            d.x += d.vx * 0.5;
            d.y += d.vy * 0.5;
          }

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = d.color;
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(15px)' }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#020617',
        overflow: 'hidden',
        pointerEvents: 'none' // Don't block interactions if accidentally left mounted
      }}
    >
      {/* WebGL/Canvas Layer */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      
      {/* Morphing Typography Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Orbitron', 'Inter', sans-serif"
      }}>
        <AnimatePresence mode="wait">
          {phase === 3 && <CountdownPhase key="p3" />}
          {phase === 4 && <WordsPhase key="p4" />}
          {phase === 5 && <HeartPhase key="p5" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// Sub-components for Typography Morphs
// ----------------------------------------------------------------------------

function CountdownPhase() {
  const [num, setNum] = useState(3);
  useEffect(() => {
    const i = setInterval(() => {
      setNum(n => (n > 1 ? n - 1 : n));
    }, 1000); // 1 second per number
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div
      key={num}
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(15px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.2, filter: 'blur(15px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        fontSize: '15vw',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 0 20px rgba(255,182,193,0.8), 0 0 40px rgba(255,182,193,0.5)',
        background: 'linear-gradient(to bottom, #ffffff, #ffb6c1)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {num}
    </motion.div>
  );
}

function WordsPhase() {
  const words = ["YOU", "ARE", "MY", "LOVE"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setIdx(curr => (curr < words.length - 1 ? curr + 1 : curr));
    }, 625); // 2.5s total = ~625ms per word
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div
      key={words[idx]}
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        fontSize: '10vw',
        fontWeight: 'bold',
        letterSpacing: '0.2em',
        color: '#fff',
        textShadow: '0 0 30px rgba(255,105,180,0.8), 0 0 60px rgba(255,105,180,0.4)'
      }}
    >
      {words[idx]}
    </motion.div>
  );
}

function HeartPhase() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="#ff69b4"
        style={{ width: 'min(30vw, 150px)', height: 'min(30vw, 150px)' }}
        animate={{ 
          scale: [1, 1.15, 1], 
          filter: [
            'drop-shadow(0 0 20px #ff69b4)', 
            'drop-shadow(0 0 50px rgba(255,105,180, 0.9))', 
            'drop-shadow(0 0 20px #ff69b4)'
          ] 
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </motion.svg>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          fontFamily: "'Orbitron', 'Poppins', sans-serif",
          color: '#fff',
          textShadow: '0 0 20px #ff69b4, 0 0 40px #ff69b4',
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          letterSpacing: '0.15em',
          textAlign: 'center'
        }}
      >
        I LOVE YOU
      </motion.h2>
    </motion.div>
  );
}
