import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import {
  Mic, Brain, BarChart3, Check, X, Sparkles, Star,
  Zap, Shield, TrendingUp, ChevronDown, ArrowRight, Play,
  Volume2, MessageSquare, Clock, Target, Users, Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <div className="min-h-screen bg-transparent text-foreground overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
        : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">InterviewMate</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7">
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-5 font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all text-sm">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/6 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold tracking-wide uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Live AI Interruption Technology
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-heading font-extrabold leading-[1.08] tracking-tight text-foreground">
                  Practice interviews that
                  <br />
                  <span className="text-primary italic">actually push back.</span>
                </h1>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-md">
                  InterviewMate's AI listens, interrupts weak answers, and asks
                  real follow-ups — giving you genuine pressure before the real thing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/signup">
                  <Button size="lg" className="h-12 px-8 rounded-xl font-bold text-sm w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                    <Zap className="h-4 w-4 mr-2" />
                    Start free — no card needed
                  </Button>
                </Link>
                <button className="h-12 px-6 rounded-xl text-sm font-semibold border border-border/70 hover:bg-secondary/50 hover:border-border transition-all flex items-center gap-2 justify-center text-muted-foreground hover:text-foreground">
                  <Play className="h-4 w-4" />
                  Watch 60-second demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex -space-x-2.5">
                  {[11, 12, 13, 14, 15].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} alt=""
                      className="h-8 w-8 rounded-full border-2 border-background object-cover" />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" />)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">1,000+</span> learners trust us
                  </p>
                </div>
              </div>
            </div>

            {/* Right — animated chat demo */}
            <div className="relative">
              <div className="absolute inset-6 bg-primary/8 blur-3xl rounded-full" />
              <ChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / STATS STRIP ─────────────────────── */}
      <section className="py-10 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: "1,000+", l: "Active learners" },
              { n: "50K+", l: "Sessions completed" },
              { n: "4.9 ★", l: "Average rating" },
              { n: "3 AI", l: "Models powering it" },
            ].map(s => (
              <div key={s.l}>
                <div className="text-2xl md:text-3xl font-heading font-black">{s.n}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS SECTION ──────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <SectionBadge>The Difference</SectionBadge>
          <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
            Other tools let you answer in peace.
            <span className="text-primary italic"> We don't.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Real interviews are uncomfortable. Your prep should be too.
          </p>

          <div className="mt-14 grid md:grid-cols-2 gap-6 relative text-left">
            {/* VS badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-lg hidden md:flex items-center justify-center">
              <span className="text-xs font-black text-primary">VS</span>
            </div>

            {/* Traditional */}
            <div className="p-7 rounded-2xl border border-border/40 bg-muted/30 opacity-60">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                <X className="h-4 w-4 text-destructive" /> Traditional mock interviews
              </p>
              <ul className="space-y-3">
                {["You answer without any interruption", "Feedback hours later — you've already forgotten", "Scripted questions that never adapt", "Generic scores with no root cause"].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>

            {/* InterviewMate */}
            <div className="p-7 rounded-2xl border border-primary/25 bg-background shadow-[0_0_50px_-12px] shadow-primary/15 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> InterviewMate
              </p>
              <ul className="space-y-3">
                {["AI interrupts when you're vague or rambling", "Instant feedback mid-answer — as it happens", "Questions adapt to YOUR difficulty in real time", "Exact diagnosis of your communication gaps"].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-secondary/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionBadge>The Process</SectionBadge>
            <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
              From setup to diagnosis in one session
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n: "01", icon: <Shield className="h-5 w-5" />, title: "Configure", desc: "Choose your role, skills, difficulty level, and session duration." },
              { n: "02", icon: <Mic className="h-5 w-5" />, title: "Speak naturally", desc: "Answer out loud — exactly like a real interview, no typing." },
              { n: "03", icon: <Brain className="h-5 w-5" />, title: "AI intervenes", desc: "Rambling? Vague? The AI stops you, probes deeper, challenges you." },
              { n: "04", icon: <TrendingUp className="h-5 w-5" />, title: "Get diagnosed", desc: "Receive scores, weakness patterns, and exact improvement actions." },
            ].map((s, i) => (
              <div key={s.n} className="group relative p-6 rounded-2xl hover:bg-background hover:border hover:border-border/60 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                    {s.icon}
                  </div>
                  <span className="text-[11px] font-black text-muted-foreground tracking-widest uppercase">{s.n}</span>
                </div>
                <h3 className="font-heading font-bold text-base mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DIALOGUE CTA STRIP ─────────────────── */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,hsl(var(--primary-foreground)/0.06),transparent)]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <p className="text-primary-foreground/60 text-sm font-semibold uppercase tracking-widest mb-3">Live session snapshot</p>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold italic">
              This is what pressure feels like.
            </h2>
          </div>

          <div className="bg-background text-foreground rounded-2xl p-6 md:p-8 shadow-[0_30px_80px_-10px_rgba(0,0,0,0.4)] space-y-5">
            {/* AI question */}
            <ChatBubble speaker="AI Interviewer" side="left" highlight={false}>
              "Tell me about a time you handled serious conflict at work and what the outcome was."
            </ChatBubble>

            {/* User response */}
            <ChatBubble speaker="You" side="right">
              "So basically, I was working with another developer and we kinda disagreed on the approach and I tried to—"
            </ChatBubble>

            {/* AI interrupt */}
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/25">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[80%] space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  ⚡ AI Interrupts
                </span>
                <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-semibold leading-relaxed shadow-lg">
                  "Stop. Be specific — what was YOUR exact role in that conflict? Don't describe the situation, describe your decision."
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex flex-wrap gap-4 items-center justify-center text-xs text-muted-foreground">
              {[
                { color: "bg-emerald-500", label: "Deepgram STT" },
                { color: "bg-primary", label: "Gemini AI" },
                { color: "bg-purple-500", label: "ElevenLabs TTS" },
                { color: "bg-amber-500", label: "Real-time" },
              ].map(b => (
                <span key={b.label} className="flex items-center gap-1.5 font-medium">
                  <span className={`h-2 w-2 rounded-full ${b.color}`} />{b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionBadge>Capabilities</SectionBadge>
            <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
              Everything you need to prepare right
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto text-sm">
              Enterprise-grade AI. Genuinely simple to use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Mic className="h-5 w-5" />, title: "Voice-based sessions", desc: "Talk out loud, exactly as you would in a real interview. No typing.", color: "text-blue-500", bg: "bg-blue-500/8" },
              { icon: <Brain className="h-5 w-5" />, title: "Real-time AI follow-ups", desc: "Follow-up questions generated from YOUR specific answers — not a script.", color: "text-purple-500", bg: "bg-purple-500/8" },
              { icon: <BarChart3 className="h-5 w-5" />, title: "Skill diagnosis report", desc: "Scores on clarity, structure, confidence, depth, and consistency.", color: "text-emerald-500", bg: "bg-emerald-500/8" },
              { icon: <Target className="h-5 w-5" />, title: "Adaptive difficulty", desc: "Session gets harder or easier based on your actual performance.", color: "text-amber-500", bg: "bg-amber-500/8" },
            ].map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT PREVIEW ──────────────────────────── */}
      <section className="py-24 border-y border-border/40 bg-secondary/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <SectionBadge>After your session</SectionBadge>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight leading-tight">
                Not feedback.<br />
                A <span className="text-primary italic">precise diagnosis.</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Every session ends with a detailed report that shows exactly where you lost the interviewer and what to do about it.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Overall interview score & grade",
                  "Skill-by-skill breakdown (clarity, structure, depth…)",
                  "Detected weakness patterns",
                  "Rewritten sample answers",
                  "Specific improvement actions by priority",
                  "Full session transcript",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{t}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="rounded-xl px-7 h-11 font-bold text-sm shadow-md shadow-primary/15 hover:-translate-y-0.5 transition-all mt-2">
                  Try it free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mock report card */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-90" />
              <MockReport />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <SectionBadge>Who it helps</SectionBadge>
          <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-10">
            If interviews make you nervous — this is for you.
          </h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {["Software engineers", "Product managers", "Final-year students", "Career switchers", "Non-native English speakers", "MBA graduates", "Sales professionals", "Data scientists"].map(t => (
              <span key={t} className="px-5 py-2.5 rounded-full border border-border/60 bg-background text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 cursor-default shadow-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-secondary/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <SectionBadge>Pricing</SectionBadge>
          <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-3">
            Start free. Upgrade when ready.
          </h2>
          <p className="text-muted-foreground text-sm mb-14">No credit card needed. No lock-in.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">

            {/* Free */}
            <div className="p-7 rounded-2xl border border-border/50 bg-background/80">
              <div className="mb-6">
                <p className="font-heading font-bold text-lg">Free</p>
                <p className="text-muted-foreground text-sm mt-0.5">For serious starters</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black">₹0</span>
                <span className="text-muted-foreground text-sm ml-1">/forever</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {["50 free tokens on signup", "All interview modes", "Basic session reports", "Voice practice"].map(t => (
                  <PricingRow key={t} included>{t}</PricingRow>
                ))}
                {["Advanced analytics", "PDF export"].map(t => (
                  <PricingRow key={t}>{t}</PricingRow>
                ))}
              </ul>
              <Link to="/signup">
                <button className="w-full h-11 rounded-xl border border-border/70 text-sm font-bold hover:bg-secondary/50 hover:border-border transition-all">
                  Get started free →
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="p-7 rounded-2xl border border-primary/30 bg-background shadow-[0_0_60px_-15px] shadow-primary/20 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-heading font-bold text-lg">Pro</p>
                  <p className="text-muted-foreground text-sm mt-0.5">For serious job hunters</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full">Popular</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black">₹499</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {["Unlimited monthly tokens", "All modes & interview types", "Advanced analytics dashboard", "PDF session reports", "Priority AI model access", "Cancel anytime"].map(t => (
                  <PricingRow key={t} included>{t}</PricingRow>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="w-full h-11 rounded-xl font-bold text-sm shadow-md shadow-primary/15 hover:scale-[1.01] transition-all">
                  Upgrade to Pro →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="flex justify-center gap-0.5 mb-4">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />)}
            </div>
            <SectionBadge>Testimonials</SectionBadge>
            <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight">People love the pressure</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Testimonial
              quote="The AI interrupted me exactly where a real interviewer would have. I was genuinely shocked by how accurate it was."
              name="Software Engineer"
              sub="FAANG preparation"
            />
            <Testimonial
              quote="It exposed communication weaknesses I didn't even know I had. Best prep tool I've ever used before interviews."
              name="Product Manager"
              sub="Series B startup"
              featured
            />
            <Testimonial
              quote="The real-time feedback on answer structure completely changed how I respond to behavioral questions."
              name="MBA Graduate"
              sub="Final year"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section id="faq" className="py-24 border-t border-border/40 bg-secondary/10">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionBadge>FAQ</SectionBadge>
            <h2 className="mt-3 text-3xl md:text-4xl font-heading font-extrabold tracking-tight">Common questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              ["Is my data private?", "Yes. Sessions are encrypted and never shared. We use enterprise-grade security — your practice stays between you and the AI."],
              ["Do I need to download anything?", "No. InterviewMate runs entirely in your browser. Just allow microphone access and you're ready."],
              ["Is it really free to start?", "Yes. You get 50 free tokens on signup — enough for 5 full sessions. No credit card required at all."],
              ["What happens if Gemini is unavailable?", "We automatically fall back to our built-in question templates so your session always starts and runs smoothly."],
              ["Can I cancel my Pro plan anytime?", "Yes. Month-to-month, no lock-in, cancel in one click from your settings page."],
              ["What AI powers it?", "Google Gemini 2.0 Flash for real-time evaluation, Deepgram Nova-2 for speech-to-text, and ElevenLabs for natural voice responses."],
            ].map(([q, a], i) => (
              <AccordionItem key={i} value={`q${i}`}
                className="border border-border/40 rounded-xl px-5 bg-background/60 hover:border-primary/20 transition-colors">
                <AccordionTrigger className="text-sm font-bold py-4 text-left hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="py-32 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,hsl(var(--primary-foreground)/0.07),transparent)]" />
        <div className="max-w-2xl mx-auto px-6 relative z-10 space-y-7">
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight leading-tight">
            Stop practicing <br />in your comfort zone.
          </h2>
          <p className="text-primary-foreground/65 text-lg">
            Get the pressure of a real interview — before it counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/signup">
              <Button className="h-13 px-10 text-base font-extrabold rounded-xl bg-background text-primary hover:bg-background/92 shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all"
                style={{ height: 52 }}>
                <Zap className="mr-2 h-5 w-5" />
                Start for free
              </Button>
            </Link>
            <p className="text-primary-foreground/50 text-sm">50 free tokens · No card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="py-12 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold tracking-tight">InterviewMate</span>
          </Link>
          <div className="flex gap-7 text-sm text-muted-foreground">
            {["Privacy Policy", "Terms", "Contact"].map(l => (
              <Link key={l} to={`/${l.toLowerCase().replace(/ /g, "-")}`}
                className="hover:text-foreground transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">© 2026 InterviewMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/* ─────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────── */

function SectionBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
      <span className="h-1 w-4 rounded-full bg-primary/50" />
      {children}
      <span className="h-1 w-4 rounded-full bg-primary/50" />
    </span>
  )
}

function FeatureCard({ icon, title, desc, color, bg }) {
  return (
    <div className="group p-6 rounded-2xl border border-border/40 bg-background hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-default">
      <div className={`h-11 w-11 rounded-xl ${bg} ${color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <h3 className="font-heading font-bold text-sm mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function PricingRow({ children, included = false }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 ${included ? "bg-emerald-500/10" : "bg-muted/50"}`}
        style={{ height: 18, width: 18 }}>
        {included
          ? <Check className="h-2.5 w-2.5 text-emerald-500" />
          : <X className="h-2.5 w-2.5 text-muted-foreground/40" />}
      </div>
      <span className={included ? "text-foreground font-medium" : "text-muted-foreground/50"}>{children}</span>
    </li>
  )
}

function Testimonial({ quote, name, sub, featured = false }) {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-200 ${featured
      ? "border-primary/25 shadow-[0_0_50px_-15px] shadow-primary/20 bg-background relative overflow-hidden"
      : "border-border/40 bg-background/60 hover:bg-background hover:shadow-sm"}`}>
      {featured && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />}
      <div className="flex gap-0.5 mb-4">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" />)}
      </div>
      <p className="text-sm leading-relaxed italic text-foreground mb-5">"{quote}"</p>
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 shrink-0" />
        <div>
          <p className="text-xs font-bold">{name}</p>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ children, speaker, side = "left", highlight = false }) {
  const isLeft = side === "left"
  return (
    <div className={`flex gap-3 ${isLeft ? "" : "flex-row-reverse"}`}>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isLeft ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
        {isLeft ? <Sparkles className="h-4 w-4" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] ${isLeft ? "" : "items-end"} flex flex-col gap-1`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{speaker}</span>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${isLeft
          ? "rounded-tl-sm bg-card border-border/40"
          : "rounded-tr-sm bg-secondary border-border/30"}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ANIMATED CHAT DEMO (hero)
───────────────────────────────────────── */
function ChatDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 3), 3000)
    return () => clearInterval(t)
  }, [])

  const messages = [
    { side: "left", label: "AI Interviewer", text: "Walk me through the most complex project you've led end to end.", type: "question" },
    { side: "right", label: "You", text: "So basically I was leading a microservices migration and we had a lot of moving parts and dependencies…", type: "user" },
    { side: "left", label: "⚡ AI Interrupts", text: "Pause. What was YOUR specific technical decision that made or broke that migration?", type: "interrupt" },
  ]

  return (
    <div className="relative bg-background rounded-2xl border border-border/50 shadow-[0_20px_60px_-12px] shadow-black/10 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-secondary/30">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 px-3 py-1 bg-background rounded-full flex items-center gap-2 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · 4:12
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4 min-h-[220px]">
        {messages.slice(0, step + 1).map((m, i) => {
          const isLeft = m.side === "left"
          return (
            <div key={i}
              className={`flex gap-3 transition-all duration-500 ${isLeft ? "" : "flex-row-reverse"}`}
              style={{ opacity: i === step ? 1 : 0.45 }}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${m.type === "interrupt" ? "bg-red-500 text-white" : isLeft ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {isLeft ? <Sparkles className="h-3.5 w-3.5" /> : <span className="text-[10px]">You</span>}
              </div>
              <div className={`max-w-[80%] space-y-1 flex flex-col ${isLeft ? "items-start" : "items-end"}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</span>
                <div className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border ${m.type === "interrupt"
                  ? "border-red-500/20 bg-red-500/8 text-foreground font-semibold italic"
                  : isLeft ? "border-border/40 bg-card" : "border-border/30 bg-secondary"
                  } ${isLeft ? "rounded-tl-sm" : "rounded-tr-sm"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mic bar */}
      <div className="px-5 pb-4 pt-2 border-t border-border/40 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />Recording…
        </span>
        <div className="flex items-end gap-0.5 h-5">
          {[3, 6, 9, 5, 8, 4, 7, 3, 6, 9].map((h, i) => (
            <div key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
              style={{ height: `${h * 2}px`, animationDelay: `${i * 0.07}s`, animationDuration: "0.7s" }} />
          ))}
        </div>
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mic className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MOCK REPORT CARD
───────────────────────────────────────── */
function MockReport() {
  return (
    <div className="relative bg-background rounded-2xl border border-border/50 shadow-[0_20px_60px_-12px] shadow-black/8 p-6 space-y-5 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Session Report</p>
          <p className="font-heading font-bold text-base mt-0.5">Senior Software Engineer</p>
          <p className="text-xs text-muted-foreground mt-0.5">Technical Interview · Hard · 28 min</p>
        </div>
        <div className="h-14 w-14 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
          <span className="text-xl font-black text-primary leading-none">82</span>
          <span className="text-[9px] font-bold text-muted-foreground mt-0.5">/100</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { label: "Clarity", score: 78, color: "bg-blue-500" },
          { label: "Structure", score: 85, color: "bg-purple-500" },
          { label: "Confidence", score: 71, color: "bg-amber-500" },
          { label: "Depth", score: 89, color: "bg-emerald-500" },
          { label: "Consistency", score: 82, color: "bg-primary" },
        ].map(s => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{s.label}</span>
              <span>{s.score}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/6 border border-emerald-500/15">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">Strength</p>
          <p className="text-xs text-muted-foreground">Clear problem-solving, strong technical depth</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/6 border border-red-500/15">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-1">Improve</p>
          <p className="text-xs text-muted-foreground">Use STAR method for behavioral answers</p>
        </div>
      </div>
    </div>
  )
}
