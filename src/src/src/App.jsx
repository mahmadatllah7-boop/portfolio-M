import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from "react";

/* ============================================================
   MOCK FIRESTORE LAYER
   In the real Next.js build this entire block is replaced by
   actual Firebase SDK calls (see /lib/firestore.ts in the real
   project). The shape of the data and the function signatures
   are kept identical on purpose, so swapping this out for real
   Firebase later is a drop-in replacement, not a rewrite.
   ============================================================ */

const DISCIPLINES = [
  { id: "identity", label: "Identity", color: "#D4AF37", glow: "rgba(212,175,55,0.35)" },
  { id: "ai", label: "AI Media", color: "#7C3AED", glow: "rgba(124,58,237,0.35)" },
  { id: "erp", label: "Systems", color: "#3FB8AF", glow: "rgba(63,184,175,0.30)" },
];

const seedProjects = [
  { id: "p1", title: "Veylith — Skincare Identity", discipline: "identity", category: "Branding", cover: "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1200&auto=format&fit=crop", year: 2025, blurb: "Full identity system for a clinical skincare line — wordmark, packaging, and a restrained gold-on-cream palette." },
  { id: "p2", title: "Solace Pharmacy Mark", discipline: "identity", category: "Logos", cover: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?q=80&w=1200&auto=format&fit=crop", year: 2024, blurb: "A pharmacy chain's mark, built to read clearly at counter-signage scale and as a small app icon." },
  { id: "p3", title: "Nocturne — AI Fragrance Film", discipline: "ai", category: "AI Videos", cover: "https://images.unsplash.com/photo-1541779408-04ac0f3e3e58?q=80&w=1200&auto=format&fit=crop", year: 2025, blurb: "A 40-second generative film for a fragrance launch, built from a custom prompt pipeline and color-graded by hand." },
  { id: "p4", title: "Glasshouse Campaign Stills", discipline: "ai", category: "AI Images", cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop", year: 2025, blurb: "A full social campaign generated and composited for an architecture studio's product line." },
  { id: "p5", title: "Retail ERP — Inventory Core", discipline: "erp", category: "ERP Projects", cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop", year: 2024, blurb: "A multi-branch inventory and POS backend for a 12-store retail group, with live stock sync." },
  { id: "p6", title: "Pharmacy ERP — Dispense Flow", discipline: "erp", category: "ERP Projects", cover: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop", year: 2024, blurb: "Prescription intake, batch expiry tracking, and insurance reconciliation in one dispensing workflow." },
];

const seedServices = [
  { id: "s1", discipline: "identity", title: "Logo & Wordmark Design", desc: "Distinct marks built to survive a business card and a billboard equally well." },
  { id: "s2", discipline: "identity", title: "Full Brand Identity", desc: "Color, type, voice, and the system that holds them together across every surface." },
  { id: "s3", discipline: "ai", title: "AI Image Direction", desc: "Generated visuals with a real art-directed point of view, not default model output." },
  { id: "s4", discipline: "ai", title: "AI Video Production", desc: "Short-form generative film for launches, campaigns, and product reveals." },
  { id: "s5", discipline: "erp", title: "Retail Management Systems", desc: "Inventory, POS, and multi-branch reporting built around how your floor actually runs." },
  { id: "s6", discipline: "erp", title: "Pharmacy Management Systems", desc: "Dispensing, expiry tracking, and compliance-ready records." },
];

const seedTestimonials = [
  { id: "t1", name: "Lina Haddad", role: "Founder, Veylith", quote: "He understood the brand before we'd finished explaining it.", rating: 5 },
  { id: "t2", name: "Omar Khalil", role: "Ops Director, Solace Pharmacy Group", quote: "The dispensing system cut our counter wait times by half.", rating: 5 },
  { id: "t3", name: "Maya Chen", role: "Creative Lead, Glasshouse Studio", quote: "The AI stills looked like a campaign shoot, not a prompt.", rating: 5 },
];

const seedStats = [
  { id: "st1", label: "Projects Completed", value: 142 },
  { id: "st2", label: "Clients Served", value: 58 },
  { id: "st3", label: "Brands Created", value: 37 },
  { id: "st4", label: "Systems Delivered", value: 21 },
];

const seedSite = {
  heroHeadline: "I Design Brands, Create AI Experiences & Build Business Systems.",
  heroSub: "Visual Identity · AI Creativity · ERP Solutions",
  aboutName: "Mohamed Atallah",
  aboutTitle: "Creative Designer & ERP Solutions Developer",
  aboutBody: "I work across three disciplines that most studios keep separate: brand identity, AI-driven visual production, and the enterprise systems that run pharmacies, retailers, and companies day to day. The thread between them is the same — clarity, under pressure, at scale.",
};

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

/* A tiny in-memory "Firestore" with the same async shape the real SDK has,
   so the components below never need to change when wired to real Firebase. */
function createMockDB() {
  let state = {
    projects: seedProjects,
    services: seedServices,
    testimonials: seedTestimonials,
    stats: seedStats,
    site: seedSite,
  };
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(state));
  return {
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    getState() { return state; },
    add(collection, doc) {
      const withId = { ...doc, id: uid(collection.slice(0, 2)) };
      state = { ...state, [collection]: [...state[collection], withId] };
      notify();
      return withId;
    },
    update(collection, id, patch) {
      state = { ...state, [collection]: state[collection].map((d) => (d.id === id ? { ...d, ...patch } : d)) };
      notify();
    },
    remove(collection, id) {
      state = { ...state, [collection]: state[collection].filter((d) => d.id !== id) };
      notify();
    },
    updateSite(patch) {
      state = { ...state, site: { ...state.site, ...patch } };
      notify();
    },
  };
}

const DBContext = createContext(null);
function useDB() {
  const db = useContext(DBContext);
  const [data, setData] = useState(db.getState());
  useEffect(() => db.subscribe(setData), [db]);
  return [data, db];
}

/* ============================================================
   SHARED UI ATOMS
   ============================================================ */

function useDiscipline(id) {
  return DISCIPLINES.find((d) => d.id === id) || DISCIPLINES[0];
}

function GlassCard({ children, className = "", style = {}, accent }) {
  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(155deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: accent ? `0 0 0 1px ${accent}22, 0 30px 60px -30px ${accent}33` : "0 30px 60px -30px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl border animate-[fadeIn_0.2s_ease]"
          style={{
            background: "rgba(14,14,14,0.95)",
            borderColor: "rgba(212,175,55,0.4)",
            color: "#fff",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (msg) => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  };
  return [toasts, push];
}

/* ============================================================
   PUBLIC SITE
   ============================================================ */

function Nav({ active, onNavigate, onAdmin }) {
  const links = ["Work", "Services", "Systems", "About", "Contact"];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(7,7,7,0.75)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-white font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem" }}>
          M. Atallah
        </span>
        <div className="hidden md:flex gap-8 text-sm">
          {links.map((l) => (
            <button
              key={l}
              onClick={() => onNavigate(l.toLowerCase())}
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={onAdmin}
          className="text-xs px-3.5 py-1.5 rounded-full border text-white/70 hover:text-white hover:border-white/40 transition-all"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          Admin
        </button>
      </div>
    </nav>
  );
}

function Hero({ site, activeDiscipline, setActiveDiscipline }) {
  const d = useDiscipline(activeDiscipline);
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden" id="hero">
      <div
        className="absolute inset-0 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${d.glow}, transparent 60%)`,
        }}
      />
      {/* floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              background: d.color,
              opacity: 0.25,
              animation: `float${i % 4} ${8 + (i % 5)}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl text-center">
        <div className="flex justify-center gap-2 mb-8">
          {DISCIPLINES.map((disc) => (
            <button
              key={disc.id}
              onClick={() => setActiveDiscipline(disc.id)}
              className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300"
              style={{
                borderColor: activeDiscipline === disc.id ? disc.color : "rgba(255,255,255,0.12)",
                color: activeDiscipline === disc.id ? disc.color : "rgba(255,255,255,0.5)",
                background: activeDiscipline === disc.id ? `${disc.color}14` : "transparent",
              }}
            >
              {disc.label}
            </button>
          ))}
        </div>

        <h1
          className="text-white leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", fontWeight: 500 }}
        >
          {site.heroHeadline}
        </h1>
        <p className="mt-6 text-white/50 text-base md:text-lg tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
          {site.heroSub}
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a
            href="#work"
            className="px-7 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-[1.03]"
            style={{ background: d.color, color: "#070707" }}
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="px-7 py-3 rounded-full font-medium text-sm border text-white/80 hover:text-white transition-all duration-300 hover:border-white/40"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            Start A Project
          </a>
        </div>
      </div>

      <style>{`
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
      `}</style>
    </section>
  );
}

function About({ site }) {
  return (
    <section id="about" className="max-w-5xl mx-auto px-6 py-28">
      <GlassCard className="p-10 md:p-14">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">About</p>
        <h2 className="text-white text-3xl md:text-4xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          {site.aboutName}
        </h2>
        <p className="mb-6" style={{ color: "#D4AF37" }}>{site.aboutTitle}</p>
        <p className="text-white/60 leading-relaxed max-w-2xl text-[15px]">{site.aboutBody}</p>
      </GlassCard>
    </section>
  );
}

function Services({ services, activeDiscipline }) {
  const filtered = services.filter((s) => s.discipline === activeDiscipline);
  const d = useDiscipline(activeDiscipline);
  return (
    <section id="services" className="max-w-6xl mx-auto px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Services</p>
      <h2 className="text-white text-2xl md:text-3xl mb-10" style={{ fontFamily: "'Fraunces', serif" }}>
        What I build in {d.label}
      </h2>
      <div className="grid md:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <GlassCard key={s.id} accent={d.color} className="p-6 transition-transform duration-300 hover:-translate-y-1">
            <div className="w-9 h-9 rounded-lg mb-4" style={{ background: `${d.color}22` }} />
            <h3 className="text-white font-medium mb-2">{s.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/40 text-sm col-span-3">No services added for this discipline yet.</p>
        )}
      </div>
    </section>
  );
}

const CATEGORIES = ["All", "Logos", "Branding", "AI Images", "AI Videos", "ERP Projects"];

function Portfolio({ projects }) {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const filtered = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="work" className="max-w-6xl mx-auto px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Selected Work</p>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <h2 className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'Fraunces', serif" }}>
          Portfolio
        </h2>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-3.5 py-1.5 rounded-full text-xs border transition-all"
              style={{
                borderColor: filter === c ? "#D4AF37" : "rgba(255,255,255,0.12)",
                color: filter === c ? "#D4AF37" : "rgba(255,255,255,0.5)",
                background: filter === c ? "rgba(212,175,55,0.08)" : "transparent",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40 text-sm py-12 text-center">
          No projects in this category yet — add one from the Admin dashboard and it appears here instantly.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{ gridAutoFlow: "dense" }}>
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              className="relative rounded-xl overflow-hidden group text-left"
              style={{ gridRow: i % 5 === 0 ? "span 2" : "span 1" }}
            >
              <img src={p.cover} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ aspectRatio: i % 5 === 0 ? "3/4" : "4/3" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white text-sm font-medium">{p.title}</p>
                <p className="text-white/50 text-xs">{p.category} · {p.year}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <GlassCard className="overflow-hidden">
              <img src={lightbox.cover} alt={lightbox.title} className="w-full h-72 object-cover" />
              <div className="p-6">
                <p className="text-xs text-white/40 mb-1">{lightbox.category} · {lightbox.year}</p>
                <h3 className="text-white text-xl mb-3" style={{ fontFamily: "'Fraunces', serif" }}>{lightbox.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{lightbox.blurb}</p>
                <button onClick={() => setLightbox(null)} className="mt-5 text-xs text-white/50 hover:text-white">Close ✕</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </section>
  );
}

function Stats({ stats }) {
  const [counts, setCounts] = useState(stats.map(() => 0));
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const duration = 1200;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setCounts(stats.map((s) => Math.round(s.value * p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, stats]);

  return (
    <section ref={ref} className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <GlassCard key={s.id} className="p-7 text-center">
            <p className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Fraunces', serif" }}>{counts[i]}+</p>
            <p className="text-white/40 text-xs mt-2 uppercase tracking-wide">{s.label}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ testimonials }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (testimonials.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, [testimonials.length]);
  if (testimonials.length === 0) return null;
  const cur = testimonials[idx];
  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-8">What clients say</p>
      <GlassCard className="p-10">
        <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
          “{cur.quote}”
        </p>
        <p className="text-white text-sm font-medium">{cur.name}</p>
        <p className="text-white/40 text-xs mt-1">{cur.role}</p>
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? "#D4AF37" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="max-w-2xl mx-auto px-6 py-24">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3 text-center">Get in touch</p>
      <h2 className="text-white text-2xl md:text-3xl mb-10 text-center" style={{ fontFamily: "'Fraunces', serif" }}>Start a project</h2>
      <GlassCard className="p-8">
        {sent ? (
          <p className="text-white/70 text-center py-8">Thanks — message received. I'll reply within a day.</p>
        ) : (
          <div className="space-y-4">
            <input placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
              <input placeholder="Phone" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
            </div>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37]/50">
              <option className="bg-[#0E0E0E]">Project type</option>
              <option className="bg-[#0E0E0E]">Identity & Branding</option>
              <option className="bg-[#0E0E0E]">AI Media</option>
              <option className="bg-[#0E0E0E]">ERP / Business Systems</option>
            </select>
            <textarea placeholder="Message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
            <button onClick={() => setSent(true)} className="w-full py-3 rounded-lg font-medium text-sm" style={{ background: "#D4AF37", color: "#070707" }}>
              Send Message
            </button>
            <a href="#" className="block text-center text-sm text-white/50 hover:text-white pt-2">or message on WhatsApp →</a>
          </div>
        )}
      </GlassCard>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-white/40 text-sm">© 2026 Mohamed Atallah</span>
        <div className="flex gap-5 text-white/40 text-sm">
          <a href="#" className="hover:text-white">Instagram</a>
          <a href="#" className="hover:text-white">Behance</a>
          <a href="#" className="hover:text-white">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}

function PublicSite({ onAdmin }) {
  const [data] = useDB();
  const [activeDiscipline, setActiveDiscipline] = useState("identity");

  const handleNav = (id) => {
    const map = { work: "work", services: "services", systems: "services", about: "about", contact: "contact" };
    const el = document.getElementById(map[id] || id);
    el && el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#070707" }}>
      <Nav onNavigate={handleNav} onAdmin={onAdmin} />
      <Hero site={data.site} activeDiscipline={activeDiscipline} setActiveDiscipline={setActiveDiscipline} />
      <About site={data.site} />
      <Services services={data.services} activeDiscipline={activeDiscipline} />
      <Portfolio projects={data.projects} />
      <Stats stats={data.stats} />
      <Testimonials testimonials={data.testimonials} />
      <Contact />
      <Footer />
    </div>
  );
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#070707" }}>
      <GlassCard className="p-8 w-full max-w-sm">
        <p className="text-white text-lg mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Admin Login</p>
        <p className="text-white/40 text-xs mb-6">Demo only — any password works. Real build uses Firebase Auth.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(""); }}
          placeholder="Password"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50 mb-3"
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button
          onClick={() => (pw.length > 0 ? onLogin() : setError("Enter a password."))}
          className="w-full py-2.5 rounded-lg font-medium text-sm"
          style={{ background: "#D4AF37", color: "#070707" }}
        >
          Sign In
        </button>
      </GlassCard>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-white/40 mb-1.5">{label}</span>
      <input {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
    </label>
  );
}

function TextAreaField({ label, ...props }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-white/40 mb-1.5">{label}</span>
      <textarea {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-white/40 mb-1.5">{label}</span>
      <select value={value} onChange={onChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#D4AF37]/50">
        {options.map((o) => <option key={o} value={o} className="bg-[#0E0E0E]">{o}</option>)}
      </select>
    </label>
  );
}

function ConfirmDelete({ onConfirm, onCancel, label }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <GlassCard className="p-6 max-w-sm">
        <p className="text-white text-sm mb-1">Delete this {label}?</p>
        <p className="text-white/40 text-xs mb-5">This can't be undone in the live site.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm border border-white/15 text-white/70 hover:text-white">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-sm bg-red-500/90 text-white hover:bg-red-500">Delete</button>
        </div>
      </GlassCard>
    </div>
  );
}

function AdminProjects({ db, data, toast }) {
  const [editing, setEditing] = useState(null); // project object or "new"
  const [toDelete, setToDelete] = useState(null);
  const blank = { title: "", discipline: "identity", category: "Branding", cover: "", year: new Date().getFullYear(), blurb: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (editing === "new") setForm(blank);
    else if (editing) setForm(editing);
  }, [editing]);

  const save = () => {
    if (!form.title.trim()) return toast("Title is required.");
    if (editing === "new") {
      db.add("projects", form);
      toast("Project added — live on the site now.");
    } else {
      db.update("projects", editing.id, form);
      toast("Project updated.");
    }
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-lg" style={{ fontFamily: "'Fraunces', serif" }}>Portfolio Projects</h3>
        <button onClick={() => setEditing("new")} className="text-xs px-3.5 py-2 rounded-lg font-medium" style={{ background: "#D4AF37", color: "#070707" }}>
          + Add Project
        </button>
      </div>

      <div className="grid gap-3">
        {data.projects.map((p) => (
          <GlassCard key={p.id} className="p-4 flex items-center gap-4">
            <img src={p.cover} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{p.title}</p>
              <p className="text-white/40 text-xs">{p.category} · {p.discipline} · {p.year}</p>
            </div>
            <button onClick={() => setEditing(p)} className="text-xs text-white/60 hover:text-white px-2">Edit</button>
            <button onClick={() => setToDelete(p)} className="text-xs text-red-400 hover:text-red-300 px-2">Delete</button>
          </GlassCard>
        ))}
        {data.projects.length === 0 && <p className="text-white/40 text-sm">No projects yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <GlassCard className="p-6">
              <p className="text-white text-sm mb-4 font-medium">{editing === "new" ? "New Project" : "Edit Project"}</p>
              <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title" />
              <SelectField label="Discipline" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} options={DISCIPLINES.map((d) => d.id)} />
              <SelectField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.filter((c) => c !== "All")} />
              <Field label="Cover image URL" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} placeholder="https://..." />
              <Field label="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              <TextAreaField label="Description" rows={3} value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="Short project description" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg text-sm border border-white/15 text-white/70 hover:text-white">Cancel</button>
                <button onClick={save} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: "#D4AF37", color: "#070707" }}>Save</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmDelete
          label="project"
          onCancel={() => setToDelete(null)}
          onConfirm={() => { db.remove("projects", toDelete.id); toast("Project deleted."); setToDelete(null); }}
        />
      )}
    </div>
  );
}

function AdminServices({ db, data, toast }) {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const blank = { title: "", discipline: "identity", desc: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (editing === "new") setForm(blank);
    else if (editing) setForm(editing);
  }, [editing]);

  const save = () => {
    if (!form.title.trim()) return toast("Title is required.");
    if (editing === "new") { db.add("services", form); toast("Service added."); }
    else { db.update("services", editing.id, form); toast("Service updated."); }
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-lg" style={{ fontFamily: "'Fraunces', serif" }}>Services</h3>
        <button onClick={() => setEditing("new")} className="text-xs px-3.5 py-2 rounded-lg font-medium" style={{ background: "#D4AF37", color: "#070707" }}>+ Add Service</button>
      </div>
      <div className="grid gap-3">
        {data.services.map((s) => (
          <GlassCard key={s.id} className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{s.title}</p>
              <p className="text-white/40 text-xs">{s.discipline} — {s.desc}</p>
            </div>
            <button onClick={() => setEditing(s)} className="text-xs text-white/60 hover:text-white px-2">Edit</button>
            <button onClick={() => setToDelete(s)} className="text-xs text-red-400 hover:text-red-300 px-2">Delete</button>
          </GlassCard>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <GlassCard className="p-6">
              <p className="text-white text-sm mb-4 font-medium">{editing === "new" ? "New Service" : "Edit Service"}</p>
              <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <SelectField label="Discipline" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} options={DISCIPLINES.map((d) => d.id)} />
              <TextAreaField label="Description" rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg text-sm border border-white/15 text-white/70 hover:text-white">Cancel</button>
                <button onClick={save} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: "#D4AF37", color: "#070707" }}>Save</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
      {toDelete && <ConfirmDelete label="service" onCancel={() => setToDelete(null)} onConfirm={() => { db.remove("services", toDelete.id); toast("Service deleted."); setToDelete(null); }} />}
    </div>
  );
}

function AdminTestimonials({ db, data, toast }) {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const blank = { name: "", role: "", quote: "", rating: 5 };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (editing === "new") setForm(blank);
    else if (editing) setForm(editing);
  }, [editing]);

  const save = () => {
    if (!form.name.trim() || !form.quote.trim()) return toast("Name and quote are required.");
    if (editing === "new") { db.add("testimonials", form); toast("Testimonial added."); }
    else { db.update("testimonials", editing.id, form); toast("Testimonial updated."); }
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-lg" style={{ fontFamily: "'Fraunces', serif" }}>Testimonials</h3>
        <button onClick={() => setEditing("new")} className="text-xs px-3.5 py-2 rounded-lg font-medium" style={{ background: "#D4AF37", color: "#070707" }}>+ Add Testimonial</button>
      </div>
      <div className="grid gap-3">
        {data.testimonials.map((t) => (
          <GlassCard key={t.id} className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{t.name} <span className="text-white/30">— {t.role}</span></p>
              <p className="text-white/40 text-xs truncate">“{t.quote}”</p>
            </div>
            <button onClick={() => setEditing(t)} className="text-xs text-white/60 hover:text-white px-2">Edit</button>
            <button onClick={() => setToDelete(t)} className="text-xs text-red-400 hover:text-red-300 px-2">Delete</button>
          </GlassCard>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <GlassCard className="p-6">
              <p className="text-white text-sm mb-4 font-medium">{editing === "new" ? "New Testimonial" : "Edit Testimonial"}</p>
              <Field label="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Field label="Role / Company" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <TextAreaField label="Quote" rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg text-sm border border-white/15 text-white/70 hover:text-white">Cancel</button>
                <button onClick={save} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: "#D4AF37", color: "#070707" }}>Save</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
      {toDelete && <ConfirmDelete label="testimonial" onCancel={() => setToDelete(null)} onConfirm={() => { db.remove("testimonials", toDelete.id); toast("Testimonial deleted."); setToDelete(null); }} />}
    </div>
  );
}

function AdminStats({ db, data, toast }) {
  return (
    <div>
      <h3 className="text-white text-lg mb-5" style={{ fontFamily: "'Fraunces', serif" }}>Statistics</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {data.stats.map((s) => (
          <GlassCard key={s.id} className="p-4">
            <span className="block text-xs text-white/40 mb-1.5">{s.label}</span>
            <input
              type="number"
              value={s.value}
              onChange={(e) => db.update("stats", s.id, { value: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#D4AF37]/50"
            />
          </GlassCard>
        ))}
      </div>
      <button onClick={() => toast("Stats saved.")} className="mt-5 text-xs px-3.5 py-2 rounded-lg font-medium" style={{ background: "#D4AF37", color: "#070707" }}>Save Changes</button>
    </div>
  );
}

function AdminSiteContent({ db, data, toast }) {
  const [form, setForm] = useState(data.site);
  useEffect(() => setForm(data.site), [data.site]);
  return (
    <div>
      <h3 className="text-white text-lg mb-5" style={{ fontFamily: "'Fraunces', serif" }}>Homepage Content</h3>
      <GlassCard className="p-6 max-w-xl">
        <Field label="Hero Headline" value={form.heroHeadline} onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })} />
        <Field label="Hero Subheadline" value={form.heroSub} onChange={(e) => setForm({ ...form, heroSub: e.target.value })} />
        <Field label="About — Name" value={form.aboutName} onChange={(e) => setForm({ ...form, aboutName: e.target.value })} />
        <Field label="About — Title" value={form.aboutTitle} onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })} />
        <TextAreaField label="About — Body" rows={4} value={form.aboutBody} onChange={(e) => setForm({ ...form, aboutBody: e.target.value })} />
        <button
          onClick={() => { db.updateSite(form); toast("Homepage content updated."); }}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#D4AF37", color: "#070707" }}
        >
          Save Changes
        </button>
      </GlassCard>
    </div>
  );
}

function AdminDashboard({ onExit }) {
  const [data, db] = useDB();
  const [tab, setTab] = useState("projects");
  const [toasts, push] = useToasts();

  const tabs = [
    { id: "projects", label: "Portfolio" },
    { id: "services", label: "Services" },
    { id: "testimonials", label: "Testimonials" },
    { id: "stats", label: "Stats" },
    { id: "site", label: "Homepage Content" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#070707" }}>
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-medium" style={{ fontFamily: "'Fraunces', serif" }}>Admin Dashboard</span>
        <button onClick={onExit} className="text-xs text-white/50 hover:text-white">← Back to site</button>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        <div className="w-44 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full text-left text-sm px-3 py-2.5 rounded-lg mb-1 transition-colors"
              style={{
                background: tab === t.id ? "rgba(212,175,55,0.1)" : "transparent",
                color: tab === t.id ? "#D4AF37" : "rgba(255,255,255,0.5)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {tab === "projects" && <AdminProjects db={db} data={data} toast={push} />}
          {tab === "services" && <AdminServices db={db} data={data} toast={push} />}
          {tab === "testimonials" && <AdminTestimonials db={db} data={data} toast={push} />}
          {tab === "stats" && <AdminStats db={db} data={data} toast={push} />}
          {tab === "site" && <AdminSiteContent db={db} data={data} toast={push} />}
        </div>
      </div>
      <Toast toasts={toasts} />
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */

export default function App() {
  const dbRef = useRef(null);
  if (!dbRef.current) dbRef.current = createMockDB();
  const [view, setView] = useState("site"); // "site" | "login" | "admin"

  return (
    <DBContext.Provider value={dbRef.current}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        {view === "site" && <PublicSite onAdmin={() => setView("login")} />}
        {view === "login" && <AdminLogin onLogin={() => setView("admin")} />}
        {view === "admin" && <AdminDashboard onExit={() => setView("site")} />}
      </div>
    </DBContext.Provider>
  );
}
