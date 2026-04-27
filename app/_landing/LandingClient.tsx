"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useInView,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  ArrowRight, CheckCircle2, Search, Brain, FileText, Sparkles,
  BarChart3, Globe, Zap, Star, ChevronRight, MessageCircle,
  Volume2, GraduationCap, Home, Share2, ShoppingCart, Scale,
  Play, UtensilsCrossed, Heart, BatteryCharging, Tv2, Stethoscope,
  Landmark, Plane, Trophy, Shirt, Car, Building2, Code2,
  Send, Menu, X
} from "lucide-react";

/* ─── DATA ──────────────────────────────────────────────────── */

const QUOTES = [
  "Be the answer the algorithms crave.",
  "Be the answer Google and ChatGPT is looking for.",
];

const PROCESS_STEPS = [
  { icon: FileText, title: "Enter Niche + Topic + Region", desc: "Tell us what to write about and where you want to rank." },
  { icon: Brain, title: "AI Brainstorms Topics", desc: "No topic? Our AI suggests 5 high-value, rankable ideas instantly." },
  { icon: Search, title: "Scrape Top 10 Ranking Pages", desc: "Firecrawl scans the actual pages outranking you right now." },
  { icon: Sparkles, title: "Extract Keywords & Meta Data", desc: "1 primary, 4 secondary, 20 semantic keywords + SEO title, description, permalink." },
  { icon: FileText, title: "Generate SEO Blog Structure", desc: "10 keyword-rich H2 sections: intro, body, conclusion, CTA, FAQ — built to surpass competitors." },
  { icon: Zap, title: "Write Content Section by Section", desc: "Streamed live to your screen. Human-like, E-E-A-T optimised, 1,500 words total." },
  { icon: BarChart3, title: "AI Audit + SEO Score", desc: "Grammar check, keyword injection, E-E-A-T review, score out of 100." },
  { icon: CheckCircle2, title: "Schema + Featured Image", desc: "JSON-LD markup generated. AI image created by Replicate." },
  { icon: Globe, title: "Publish to WordPress", desc: "One click. Blog goes live with correct slug, meta, and featured image." },
];

const INDUSTRIES = [
  { icon: Code2, name: "Technology", color: "from-blue-500 to-cyan-400" },
  { icon: Volume2, name: "Marketing", color: "from-orange-500 to-amber-400" },
  { icon: GraduationCap, name: "Education", color: "from-yellow-500 to-orange-400" },
  { icon: Home, name: "Real Estate", color: "from-green-500 to-emerald-400" },
  { icon: Share2, name: "Social Network", color: "from-pink-500 to-rose-400" },
  { icon: ShoppingCart, name: "E-Commerce", color: "from-purple-500 to-violet-400" },
  { icon: Scale, name: "Legal", color: "from-slate-500 to-slate-400" },
  { icon: Play, name: "Entertainment", color: "from-indigo-500 to-blue-400" },
  { icon: UtensilsCrossed, name: "Food & Beverage", color: "from-red-500 to-orange-400" },
  { icon: Heart, name: "Hospitality", color: "from-rose-500 to-pink-400" },
  { icon: BatteryCharging, name: "Energy", color: "from-yellow-400 to-lime-400" },
  { icon: Tv2, name: "Media", color: "from-red-500 to-rose-400" },
  { icon: Stethoscope, name: "Healthcare", color: "from-teal-500 to-cyan-400" },
  { icon: Landmark, name: "Finance", color: "from-blue-600 to-indigo-400" },
  { icon: Plane, name: "Travel", color: "from-sky-500 to-blue-400" },
  { icon: Trophy, name: "Sports", color: "from-green-500 to-lime-400" },
  { icon: Shirt, name: "Fashion", color: "from-purple-500 to-fuchsia-400" },
  { icon: Car, name: "Automotive", color: "from-gray-600 to-slate-400" },
  { icon: Building2, name: "Architecture", color: "from-amber-600 to-yellow-400" },
];

const STATS = [
  { value: "2,400+", label: "Blogs Written" },
  { value: "180+", label: "Happy Users" },
  { value: "20+", label: "Industries Served" },
  { value: "~10 min", label: "Average Generation" },
];

const TESTIMONIALS = [
  { name: "Sarah Mitchell", role: "SEO Consultant, London", text: "BlogOS cut my content production time by 80%. The keyword research alone is worth 10x the price." },
  { name: "James Okafor", role: "Agency Owner, Lagos", text: "My clients don't know I use BlogOS. Their rankings jumped within 3 weeks of switching." },
  { name: "Priya Nair", role: "E-Commerce Founder, Mumbai", text: "The 30-day cluster engine mapped out an entire content calendar in one afternoon. Incredible." },
  { name: "Daniel Reyes", role: "Freelance Writer, Madrid", text: "I deliver 5x more articles to clients now. BlogOS handles the research, I handle the relationship." },
  { name: "Aisha Kamara", role: "Marketing Director, Nairobi", text: "We went from page 3 to page 1 in 6 weeks. The E-E-A-T focus in every article makes the difference." },
  { name: "Tom Brennan", role: "Digital Strategist, Dublin", text: "First AI writing tool I've used that actually understands search intent. The output reads like a human expert." },
  { name: "Fatima Al-Rashid", role: "Content Agency, Dubai", text: "WordPress integration is seamless. Write it, click publish, done. My team loves it." },
  { name: "Carlos Mendez", role: "Local Business Owner, Miami", text: "Finally ranking for 'best plumber Miami'. Three blog posts and my phone doesn't stop ringing." },
  { name: "Emma Thompson", role: "SaaS Marketer, Austin", text: "The semantic keyword coverage is insane. Every post topically dominates its subject area." },
  { name: "Raj Patel", role: "Affiliate Blogger, Birmingham", text: "My affiliate site went from 200 to 8,000 monthly visitors in 4 months. BlogOS is the reason." },
  { name: "Nadia Volkov", role: "Content Strategist, Berlin", text: "I've tried Jasper, Surfer, Frase. BlogOS beats them all because it scrapes real competitors." },
  { name: "Michael O'Brien", role: "SEO Manager, Toronto", text: "The AI score audit catches things I'd miss. It's like having a senior editor built into the tool." },
  { name: "Yuki Tanaka", role: "Tech Blogger, Tokyo", text: "Produces content in my niche that I'm genuinely proud to put my name on. That's rare for AI." },
  { name: "Amara Diallo", role: "Health Coach, Accra", text: "My wellness blog went from invisible to ranking for 40+ keywords. BlogOS understands local SEO." },
  { name: "Liam O'Connor", role: "Real Estate Agent, Sydney", text: "Every neighbourhood page I publish ranks within weeks. The region targeting is spot on." },
  { name: "Sofia Petrov", role: "E-Learning Creator, Prague", text: "I generate a week's worth of educational content in one afternoon. Absolutely game-changing." },
  { name: "Hassan Al-Farsi", role: "Law Firm Partner, Riyadh", text: "Legal content is hard to get right. BlogOS nails the professional tone every time." },
  { name: "Grace Mensah", role: "Beauty Brand Founder, Accra", text: "My product blog now drives 60% of my organic sales. The commercial content type setting is genius." },
  { name: "Ivan Kowalski", role: "Travel Blogger, Warsaw", text: "I cover 3 new destinations a week. BlogOS researches the local keywords I'd never think of." },
  { name: "Chloe Beaumont", role: "PR Specialist, Paris", text: "The meta descriptions and schema markup alone save me hours every week. Worth every cent." },
];

const DEMO_STEPS = [
  { label: "Scraping competitor pages…", icon: Search },
  { label: "Extracting 25 keywords…", icon: Brain },
  { label: "Building 10-section structure…", icon: FileText },
  { label: "Writing section 1 / 10…", icon: Sparkles },
  { label: "Writing section 5 / 10…", icon: Sparkles },
  { label: "Writing section 10 / 10…", icon: Sparkles },
  { label: "Running AI audit (score: 91/100)…", icon: BarChart3 },
  { label: "Generating schema + image…", icon: CheckCircle2 },
  { label: "Blog ready to publish ✓", icon: Globe },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ═════════════════════════════════════════════════════════════
   GLOBAL ANIMATED BACKGROUND
   ═════════════════════════════════════════════════════════════ */
function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
        <div className="aurora-blob aurora-4" />
      </div>
      <div className="absolute inset-0 dot-grid opacity-[0.35] dark:opacity-[0.18]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_85%)]" />
      <div className="absolute inset-0 noise opacity-[0.04] dark:opacity-[0.06]" />

      <style jsx>{`
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.55;
          mix-blend-mode: screen;
          will-change: transform;
        }
        :global(.dark) .aurora-blob { opacity: 0.4; mix-blend-mode: lighten; }
        .aurora-1 {
          width: 55vw; height: 55vw; left: -10vw; top: -10vw;
          background: radial-gradient(circle, hsl(217 91% 60% / 0.7), transparent 70%);
          animation: float-1 22s ease-in-out infinite;
        }
        .aurora-2 {
          width: 45vw; height: 45vw; right: -10vw; top: 20vh;
          background: radial-gradient(circle, hsl(280 90% 65% / 0.55), transparent 70%);
          animation: float-2 28s ease-in-out infinite;
        }
        .aurora-3 {
          width: 50vw; height: 50vw; left: 20vw; top: 60vh;
          background: radial-gradient(circle, hsl(190 95% 55% / 0.5), transparent 70%);
          animation: float-3 25s ease-in-out infinite;
        }
        .aurora-4 {
          width: 40vw; height: 40vw; right: 10vw; bottom: -10vh;
          background: radial-gradient(circle, hsl(330 90% 65% / 0.45), transparent 70%);
          animation: float-1 30s ease-in-out infinite reverse;
        }
        @keyframes float-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(8vw, 5vh) scale(1.1); }
          66% { transform: translate(-5vw, 8vh) scale(0.95); }
        }
        @keyframes float-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-10vw, -5vh) scale(1.15); }
        }
        @keyframes float-3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(6vw, -8vh) scale(0.9); }
        }
        .dot-grid {
          background-image: radial-gradient(circle, var(--foreground) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═════════════════════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-[60]"
    />
  );
}

/* ═════════════════════════════════════════════════════════════
   MOUSE SPOTLIGHT
   ═════════════════════════════════════════════════════════════ */
function MouseSpotlight() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 200, damping: 25 });
  const sy = useSpring(y, { stiffness: 200, damping: 25 });

  useEffect(() => {
    function handle(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [x, y]);

  return (
    <motion.div
      style={{ left: sx, top: sy, translateX: "-50%", translateY: "-50%" }}
      className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-[5] hidden md:block"
    >
      <div className="w-full h-full rounded-full bg-[radial-gradient(circle,hsl(217_91%_60%/0.08),transparent_70%)] dark:bg-[radial-gradient(circle,hsl(217_91%_60%/0.12),transparent_70%)]" />
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   3D PARTICLE MORPHING LOGO
   - Shared promise so Three.js only downloads once
   - requestIdleCallback so WebGL never blocks hero paint
   ═════════════════════════════════════════════════════════════ */

// Module-level shared promise — Three.js loads once, all instances reuse it
let _threeReady: Promise<void> | null = null;
function loadThree(): Promise<void> {
  // eslint-disable-next-line
  if ((window as any).THREE) return Promise.resolve();
  if (!_threeReady) {
    _threeReady = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return _threeReady;
}

function ParticleMorphLogo({ height = 480, particleCount = 3000 }: { height?: number; particleCount?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup = () => {};
    let cancelled = false;
    let idleHandle: number | ReturnType<typeof setTimeout>;

    // requestIdleCallback: hero paints first, THREE starts when browser is free
    const scheduleInit = window.requestIdleCallback
      ? (cb: () => void) => { idleHandle = window.requestIdleCallback(cb, { timeout: 2000 }); }
      : (cb: () => void) => { idleHandle = setTimeout(cb, 50); };

    scheduleInit(() => {
      if (cancelled) return;
      (async () => {
        await loadThree();
        if (cancelled) return;
        // eslint-disable-next-line
        const THREE = (window as any).THREE;

      const width = container.clientWidth;
      const h = height;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
      camera.position.z = 14;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, h);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      const PC = particleCount;

      function sampleTextPoints(text: string, fontSize = 220) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pts: { x: number; y: number; z: number }[] = [];
        const step = 3;
        for (let yy = 0; yy < canvas.height; yy += step) {
          for (let xx = 0; xx < canvas.width; xx += step) {
            const i = (yy * canvas.width + xx) * 4 + 3;
            if (data[i] > 128) {
              const nx = (xx - canvas.width / 2) / 50;
              const ny = -(yy - canvas.height / 2) / 50;
              pts.push({ x: nx, y: ny, z: (Math.random() - 0.5) * 0.3 });
            }
          }
        }
        const out: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i < PC; i++) {
          out.push(pts[i % pts.length] || { x: 0, y: 0, z: 0 });
        }
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      }

      function spherePoints(radius = 5) {
        const pts = [];
        for (let i = 0; i < PC; i++) {
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * Math.PI * 2;
          pts.push({
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
          });
        }
        return pts;
      }

      function torusPoints(R = 4, r = 1.5) {
        const pts = [];
        for (let i = 0; i < PC; i++) {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          pts.push({
            x: (R + r * Math.cos(v)) * Math.cos(u),
            y: (R + r * Math.cos(v)) * Math.sin(u),
            z: r * Math.sin(v),
          });
        }
        return pts;
      }

      function helixPoints() {
        const pts = [];
        for (let i = 0; i < PC; i++) {
          const t = (i / PC) * Math.PI * 8;
          const radius = 3.5;
          const yPos = (i / PC - 0.5) * 10;
          const offset = Math.floor(i / (PC / 2));
          pts.push({
            x: radius * Math.cos(t + offset * Math.PI),
            y: yPos,
            z: radius * Math.sin(t + offset * Math.PI),
          });
        }
        return pts;
      }

      function galaxyPoints() {
        const pts = [];
        for (let i = 0; i < PC; i++) {
          const r = Math.pow(Math.random(), 0.5) * 6;
          const branch = (i % 4) * ((Math.PI * 2) / 4);
          const spin = r * 0.8;
          const angle = branch + spin;
          const randX = (Math.random() - 0.5) * 0.4 * r;
          const randY = (Math.random() - 0.5) * 0.4;
          const randZ = (Math.random() - 0.5) * 0.4 * r;
          pts.push({
            x: Math.cos(angle) * r + randX,
            y: randY,
            z: Math.sin(angle) * r + randZ,
          });
        }
        return pts;
      }

      const shapes = [
        sampleTextPoints("BlogOS"),
        spherePoints(),
        galaxyPoints(),
        torusPoints(),
        helixPoints(),
      ];

      const positions = new Float32Array(PC * 3);
      const targets = new Float32Array(PC * 3);
      const colors = new Float32Array(PC * 3);

      for (let i = 0; i < PC; i++) {
        const p = shapes[0][i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        targets[i * 3] = p.x;
        targets[i * 3 + 1] = p.y;
        targets[i * 3 + 2] = p.z;

        const t = i / PC;
        const hue = 200 + t * 140;
        const c = new THREE.Color().setHSL(hue / 360, 0.85, 0.65);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const spriteCanvas = document.createElement("canvas");
      spriteCanvas.width = spriteCanvas.height = 64;
      const sctx = spriteCanvas.getContext("2d")!;
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
      const sprite = new THREE.CanvasTexture(spriteCanvas);

      const material = new THREE.PointsMaterial({
        size: height < 300 ? 0.08 : 0.12,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      setLoaded(true);

      const mouse = { x: 0, y: 0 };
      function onMove(e: MouseEvent) {
        const rect = container!.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
      container.addEventListener("mousemove", onMove);

      let shapeIndex = 0;
      let morphProgress = 1;
      const HOLD_DURATION = 3;
      let lastSwitch = performance.now() / 1000;

      function setNextTarget() {
        shapeIndex = (shapeIndex + 1) % shapes.length;
        const shape = shapes[shapeIndex];
        for (let i = 0; i < PC; i++) {
          targets[i * 3] = shape[i].x;
          targets[i * 3 + 1] = shape[i].y;
          targets[i * 3 + 2] = shape[i].z;
        }
        morphProgress = 0;
      }

      const clock = new THREE.Clock();
      let raf = 0;

      function animate() {
        raf = requestAnimationFrame(animate);
        const dt = clock.getDelta();
        const now = performance.now() / 1000;

        if (morphProgress >= 1 && now - lastSwitch > HOLD_DURATION) {
          setNextTarget();
          lastSwitch = now;
        }
        if (morphProgress < 1) {
          morphProgress = Math.min(1, morphProgress + dt / 2.5);
        }

        const posAttr = geometry.attributes.position;
        for (let i = 0; i < PC; i++) {
          const ix = i * 3;
          posAttr.array[ix] += (targets[ix] - posAttr.array[ix]) * 0.06;
          posAttr.array[ix + 1] += (targets[ix + 1] - posAttr.array[ix + 1]) * 0.06;
          posAttr.array[ix + 2] += (targets[ix + 2] - posAttr.array[ix + 2]) * 0.06;

          if (morphProgress >= 1) {
            posAttr.array[ix] += Math.sin(now * 0.5 + i * 0.01) * 0.001;
            posAttr.array[ix + 1] += Math.cos(now * 0.5 + i * 0.013) * 0.001;
          }
        }
        posAttr.needsUpdate = true;

        points.rotation.y += (mouse.x * 0.5 - points.rotation.y) * 0.05;
        points.rotation.x += (mouse.y * 0.3 - points.rotation.x) * 0.05;
        points.rotation.z += dt * 0.05;

        renderer.render(scene, camera);
      }
      animate();

      function onResize() {
        if (!container) return;
        const w = container.clientWidth;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        container?.removeEventListener("mousemove", onMove);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        sprite.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
      })();
    });

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idleHandle === 'number') {
        window.cancelIdleCallback(idleHandle as number);
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
      cleanup();
    };
  }, [height, particleCount]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" style={{ height }} />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   FLOATING WHATSAPP
   ═════════════════════════════════════════════════════════════ */
function FloatingWhatsApp() {
  return (
    <motion.a
      href="https://wa.me/923290503919?text=Hi%20Esha%2C%20I%20saw%20your%20website%20and%20want%20to%20discuss%20a%20project."
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-2xl shadow-green-500/40 transition-colors"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
      <MessageCircle size={26} className="text-white relative z-10" />
    </motion.a>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAGNETIC BUTTON
   ═════════════════════════════════════════════════════════════ */
function MagneticWrapper({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  function handleMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   ANIMATED DEMO
   ═════════════════════════════════════════════════════════════ */
function AnimatedDemo() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [inputText, setInputText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const fullInput = "Plumbing services in London";

  useEffect(() => {
    let running = true;

    async function run() {
      while (running) {
        setVisibleSteps([]);
        setInputText("");
        setShowResult(false);
        await sleep(600);

        for (let c = 0; c <= fullInput.length; c++) {
          if (!running) return;
          setInputText(fullInput.slice(0, c));
          await sleep(55);
        }
        await sleep(500);

        for (let s = 0; s < DEMO_STEPS.length; s++) {
          if (!running) return;
          setVisibleSteps((prev) => [...prev, s]);
          await sleep(s === DEMO_STEPS.length - 1 ? 400 : 1300);
        }
        setShowResult(true);
        await sleep(3500);
      }
    }
    run();
    return () => { running = false; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className="relative max-w-2xl mx-auto"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-60" />
      <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">BlogOS — Generate</span>
        </div>
        <div className="p-5 space-y-4 font-mono text-sm min-h-[340px]">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xs">$</span>
            <span className="text-foreground">{inputText}</span>
            <span className="w-1.5 h-4 bg-primary animate-pulse" />
          </div>

          {visibleSteps.map((i) => {
            const step = DEMO_STEPS[i];
            const Icon = step.icon;
            const isDone = i < DEMO_STEPS.length - 1 || showResult;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <Icon size={12} className={i === DEMO_STEPS.length - 1 ? "text-green-500" : "text-primary"} />
                <span className={i === DEMO_STEPS.length - 1 ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                  {step.label}
                </span>
                {isDone && i < DEMO_STEPS.length - 1 && (
                  <CheckCircle2 size={10} className="text-green-500 ml-auto" />
                )}
              </motion.div>
            );
          })}

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1"
              >
                <p className="text-primary font-semibold text-xs">Blog ready</p>
                <p className="text-muted-foreground text-xs">&ldquo;10 Best Emergency Plumbers in London (2025 Tested)&rdquo;</p>
                <p className="text-xs text-muted-foreground">1,512 words · Score: 91/100 · Schema included</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   PROCESS STEP
   ═════════════════════════════════════════════════════════════ */
function ProcessStep({ step, index }: { step: typeof PROCESS_STEPS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = step.icon;
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className={`flex items-start gap-6 ${isLeft ? "flex-row" : "flex-row-reverse"} md:flex-row`}>
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`relative bg-card/70 backdrop-blur-md border border-border rounded-2xl p-5 space-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all ${isLeft ? "mr-0 md:mr-8" : "ml-0 md:ml-8"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-12">{step.desc}</p>
        </motion.div>
      </motion.div>

      <div className="flex flex-col items-center gap-0 shrink-0">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/40 z-10 ring-4 ring-background"
        >
          {index + 1}
        </motion.div>
        {index < PROCESS_STEPS.length - 1 && (
          <motion.div
            initial={{ height: 0 }}
            animate={inView ? { height: 48 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-0.5 bg-gradient-to-b from-primary/40 to-transparent mt-1"
          />
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   INDUSTRIES MARQUEE
   ═════════════════════════════════════════════════════════════ */
function IndustriesMarquee() {
  const doubled = [...INDUSTRIES, ...INDUSTRIES];
  return (
    <div className="overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="flex gap-4 w-max"
      >
        {doubled.map((ind, i) => {
          const Icon = ind.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08, y: -4 }}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-card/70 backdrop-blur-md cursor-default group shrink-0"
              style={{ minWidth: "170px" }}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ind.color} flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{ind.name}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TESTIMONIALS MARQUEE
   ═════════════════════════════════════════════════════════════ */
function TestimonialsMarquee({ direction = "left", duration = 50 }: { direction?: "left" | "right"; duration?: number }) {
  const half = TESTIMONIALS.slice(0, 10);
  const doubled = [...half, ...half];
  return (
    <div className="overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <motion.div
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        className="flex gap-4 w-max"
      >
        {doubled.map((t, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            className="w-80 shrink-0 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-5 space-y-3 hover:border-primary/30 hover:shadow-xl transition-all"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, s) => (
                <Star key={s} size={11} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   STAT CARD
   ═════════════════════════════════════════════════════════════ */
function StatCard({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, type: "spring" }}
      className="text-center space-y-1"
    >
      <p className="text-4xl md:text-5xl font-display font-bold gradient-text">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   THEME TOGGLE — FIX #11: default light, uses Instrument Sans font
   ═════════════════════════════════════════════════════════════ */
function SmallThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // FIX #11: Default to light theme on first load
    const stored = localStorage.getItem("theme");
    const html = document.documentElement;
    if (stored === "dark") {
      html.classList.add("dark");
      setDark(true);
    } else {
      html.classList.remove("dark");
      setDark(false);
    }
  }, []);

  function toggle() {
    const html = document.documentElement;
    if (dark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDark(!dark);
  }

  return (
    <button
      onClick={toggle}
      className="w-7 h-7 rounded-full border border-border bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
      aria-label="Toggle theme"
    >
      {dark ? "☀" : "🌙"}
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════
   LAZY SECTION — renders children only when near viewport.
   Prevents below-fold components from blocking initial paint.
   ═════════════════════════════════════════════════════════════ */
function LazySection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "300px" } // start loading 300px before it enters viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div style={{ minHeight: 1 }} />}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   FADE-IN HELPER
   ═════════════════════════════════════════════════════════════ */
function FadeIn({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   LOGO COMPONENT — FIX #11: matches provided logo design exactly
   Uses Instrument Sans for "Blog" and Syne for "OS"
   ═════════════════════════════════════════════════════════════ */
function BlogOSLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const prefixSize = size === "sm" ? "text-2xl" : size === "lg" ? "text-5xl" : "text-[38px]";
  const nameSize = size === "sm" ? "text-[24px]" : size === "lg" ? "text-5xl" : "text-[36px]";

  return (
    <div className="flex flex-col">
      <div
        className="flex items-baseline gap-0"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
        }}
      >
        <span
          className={`${prefixSize} text-foreground/60 leading-none`}
          style={{ fontWeight: 500, letterSpacing: "-2px" }}
        >
          Blog
        </span>
        <span
          className={`${nameSize} lowercase leading-none`}
          style={{
            fontWeight: 800,
            letterSpacing: "-1px",
            paddingRight: "3px",
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px rgba(6, 182, 212, 0.2))",
          }}
        >
          OS
        </span>
      </div>
      <span
        className="text-[9px] text-foreground/35 uppercase tracking-[6px] mt-0.5 ml-1"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        Build With Esha
      </span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════════ */
export default function LandingClient() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const id = setInterval(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Kick off Three.js download immediately on page load so it's ready when particle section mounts
  useEffect(() => {
    loadThree().catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">
      {/* Preload Three.js so the particle logo is ready when it scrolls into view.
          Fonts come from next/font in the root layout — no runtime Google Fonts fetch needed. */}
      <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" as="script" />
      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, #2563EB, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <GlobalBackground />
      <ScrollProgress />
      <MouseSpotlight />
      <FloatingWhatsApp />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      {/* FIX #1 & #2: Navbar layout fixed — all items aligned on same row with no floating */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0 group transition-transform hover:scale-105">
            <BlogOSLogo size="sm" />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {[
              ["Features", "#features"],
              ["How It Works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["Industries", "#industries"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="relative hover:text-foreground transition-colors group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Sign In + Get Started together, toggle at far right */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
            <SmallThemeToggle />
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border bg-background/90 backdrop-blur-xl px-6 py-4 space-y-3 overflow-hidden"
            >
              {["Features", "How It Works", "Pricing", "Industries"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
                  {item}
                </a>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <Link href="/signup" className="flex-1 text-center text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">Get Started</Link>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
                <SmallThemeToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════ */}
      {/* FIX #3: Added pb-0 and reduced pt to give breathing room between quote and subtext */}
      <section ref={heroRef} className="relative pt-16 pb-0 px-6">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-md text-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-muted-foreground">2,400+ blogs ranked · </span>
            <span className="text-foreground font-medium">Live now</span>
          </motion.div>

          {/* FIX #3: Removed fixed height, use min-h with overflow visible, added bottom margin */}
          <div className="min-h-[100px] md:min-h-[120px] flex items-center justify-center mb-2">
            <AnimatePresence mode="wait">
              <motion.h1
                key={quoteIndex}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight gradient-text px-4"
              >
                {QUOTES[quoteIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* FIX #3: Added explicit top margin so subtext never collides with quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4"
          >
            BlogOS researches your competitors, extracts winning keywords, and writes full SEO-optimised articles — ready to publish to WordPress in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap pt-2"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-xl shadow-primary/30 group"
            >
              Start Writing Free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>



      {/* ═══════════════════════════════════════════════════════
          DEMO
          FIX #5: Reduced top padding, removed "— live." from subtext
          ═══════════════════════════════════════════════════════ */}
      <section id="features" className="relative max-w-5xl mx-auto px-6 pt-6 pb-8 space-y-6">
        <FadeIn>
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Live Demo</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Watch <span className="gradient-text">BlogOS</span> work
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">Enter a topic. The AI does the rest.</p>
          </div>
        </FadeIn>

        <AnimatedDemo />

        <FadeIn delay={0.2}>
          <p className="text-center text-xs text-muted-foreground">
            Then upload to WordPress with one click · Or export as .docx · Or check your profile to view all your work.
          </p>
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROCESS
          ═══════════════════════════════════════════════════════ */}
      <LazySection>
      <section id="how-it-works" className="relative max-w-3xl mx-auto px-6 pt-20 pb-8 space-y-10">
        <FadeIn>
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Process</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold flex items-center justify-center gap-3 flex-wrap">
              How{" "}
              <span
                className="inline-flex items-baseline gap-0"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                <span style={{
                  fontWeight: 500,
                  opacity: 0.6,
                  fontSize: "inherit",
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}>Blog</span>
                <span style={{
                  fontWeight: 800,
                  fontSize: "inherit",
                  lineHeight: 1,
                  letterSpacing: "-1px",
                  paddingRight: "3px",
                  background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textTransform: "lowercase",
                  filter: "drop-shadow(0 0 10px rgba(6, 182, 212, 0.2))",
                }}>OS</span>
              </span>{" "}
              works
            </h2>
            <p className="text-muted-foreground">9 steps from idea to ranked article. Scroll to see them unfold.</p>
          </div>
        </FadeIn>
        <div className="space-y-0">
          {PROCESS_STEPS.map((step, i) => (
            <ProcessStep key={i} step={step} index={i} />
          ))}
        </div>
      </section>
      </LazySection>

      <LazySection>
      {/* ═══════════════════════════════════════════════════════
          ABOUT
          FIX #6: Removed the "E / Esha Sabir / Founder" overlay text from photo
          FIX #7: Changed "Message Esha" → "Message Us", removed bounce (no whileHover scale)
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-8">
        <FadeIn>
          <div className="relative bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-pink-500/15 to-blue-500/15 blur-3xl" />

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative space-y-5"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Built by</p>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Build With Esha</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                BlogOS is a product of <span className="text-foreground font-semibold">Build With Esha</span> — a software studio founded by <span className="text-foreground font-semibold">Esha Sabir</span>, dedicated to building SaaS tools that give creators and businesses an unfair advantage online.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Esha started BlogOS because she saw SEO agencies charging thousands for what AI could do in minutes — if the AI was trained correctly. BlogOS is the result of that mission: powerful, affordable, and built by someone who actually understands search.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {/* FIX #7: No whileHover/whileTap on the wrapper — button doesn't bounce */}
                <a
                  href="https://wa.me/923290503919?text=Hi%20Esha%2C%20I%20saw%20your%20website%20and%20want%20to%20discuss%20a%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors shadow-lg shadow-green-500/30"
                >
                  <MessageCircle size={15} />
                  {/* FIX #7: Changed text */}
                  Message Us
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 to-pink-500/30 blur-2xl scale-110 animate-pulse" />
                {/* FIX #6: Image container — no fallback overlay with text */}
                <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden border-2 border-border shadow-2xl">
                  <Image
                    src="/esha.jpg"
                    alt="Esha Sabir — Founder of Build With Esha"
                    fill
                    className="object-cover"
                  />
                  {/* FIX #6: Removed the "E / Esha Sabir / Founder" overlay entirely */}
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </section>
      </LazySection>

      <LazySection>
      {/* ═══════════════════════════════════════════════════════
          INDUSTRIES
          ═══════════════════════════════════════════════════════ */}
      <section id="industries" className="relative pt-20 pb-8 space-y-10">
        <FadeIn>
          <div className="text-center space-y-3 px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Verticals</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Industries we serve</h2>
            <p className="text-muted-foreground">BlogOS understands the language of every niche.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <IndustriesMarquee />
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-5xl mx-auto px-6 pt-12 pb-8">
        <FadeIn>
          <div className="relative bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            {STATS.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        </FadeIn>
      </section>
      </LazySection>

      {/* ═══════════════════════════════════════════════════════
          PRICING
          FIX #8: Removed gradient colouring from "Most popular" badge
          FIX #9: Removed WhatsApp upgrade message
          ═══════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative max-w-6xl mx-auto px-6 pt-20 pb-8 space-y-12">
        <FadeIn>
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Simple, honest pricing</h2>
            <p className="text-muted-foreground">Pay via WhatsApp · Manual activation · Cancel anytime</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Free", price: "$0", sub: "forever",
              features: ["2 high-quality blog posts", "AI keyword research", "10-section blog structure", "SEO score + schema"],
              cta: "Start Free", highlight: false,
            },
            {
              name: "Pro", price: "$19", sub: "per month",
              features: ["12 blog posts/month", "WordPress auto-publish", "AI featured image", ".docx export", "All Free features"],
              cta: "Get Pro", highlight: true,
            },
            {
              name: "Business", price: "$39", sub: "per month",
              features: ["30 blog posts/month", "30-day cluster engine", "NLP keyword workbook", "Auto-scheduler", "All Pro features"],
              cta: "Get Business", highlight: false,
            },
          ].map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl border p-7 space-y-5 flex flex-col transition-all backdrop-blur-md ${
                plan.highlight
                  ? "border-primary/60 bg-card/60 shadow-2xl shadow-primary/10"
                  : "border-border bg-card/60 hover:shadow-xl"
              }`}
            >
              {plan.highlight && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Most popular</div>
              )}
              <div>
                <p className="text-lg font-display font-bold">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.sub}</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30"
                    : "border border-border hover:bg-muted"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
        {/* FIX #9: Removed the WhatsApp upgrade message entirely */}
      </section>

      <LazySection>
      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-8 space-y-6 overflow-hidden">
        <FadeIn>
          <div className="text-center space-y-3 px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">Loved by content teams worldwide</h2>
            <p className="text-muted-foreground">Real results from real users.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="space-y-4">
            <TestimonialsMarquee direction="left" duration={55} />
            <TestimonialsMarquee direction="right" duration={45} />
          </div>
        </FadeIn>
      </section>
      </LazySection>

      {/* ═══════════════════════════════════════════════════════
          MORE PRODUCTS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-8 space-y-10">
        <FadeIn>
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Coming Soon</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold">More from Build With Esha</h2>
            <p className="text-muted-foreground">Explore the full suite of SaaS tools by Esha Sabir.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "ResumeOS", desc: "AI-powered resume builder that tailors your CV for each job application automatically.", badge: "Coming Soon" },
            { name: "ShopOS", desc: "Product description writer for e-commerce stores. SEO-optimised listings in seconds.", badge: "Coming Soon" },
            { name: "SocialOS", desc: "Social media content planner and caption writer for Instagram, LinkedIn, and X.", badge: "Coming Soon" },
          ].map((product, idx) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 space-y-3 hover:border-primary/40 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">{product.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{product.badge}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.desc}</p>
              <a href="https://wa.me/923290503919" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Join waitlist <ChevronRight size={11} />
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          FIX #10: Send Message button full width, no bounce
          ═══════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-border/50 mt-16 backdrop-blur-md bg-background/40">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <BlogOSLogo size="md" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Sign Up", "/signup"], ["Sign In", "/login"]].map(([label, href]) => (
                <Link key={label} href={href} className="hover:text-foreground transition-colors">{label}</Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">© 2025 BlogOS · Build With Esha · All rights reserved.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-semibold text-foreground">Get in touch</h3>
            <LeadForm />
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   LEAD FORM
   FIX #10: Button is full-width, no bounce animation
   ═════════════════════════════════════════════════════════════ */
function LeadForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Hi Esha! My name is ${form.name} (${form.email}). ${form.message}`
    );
    window.open(`https://wa.me/923290503919?text=${msg}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      />
      <input
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      />
      <textarea
        placeholder="What would you like to discuss?"
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        rows={3}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow resize-none"
      />
      {/* FIX #10: Plain button, no MagneticWrapper, full width matching inputs, no bounce */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
      >
        {sent ? "Opening WhatsApp…" : (
          <>
            <Send size={13} />
            Send Message
          </>
        )}
      </button>
      <p className="text-xs text-muted-foreground text-center">Opens WhatsApp with your message pre-filled.</p>
    </form>
  );
}