import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  Mic,
  Brain,
  BarChart3,
  Users,
  Check,
  X,
  Sparkles,
  Play,
  Star,
  Quote,
  Plus,
  Minus,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* 1. TOP NAVIGATION (Sticky) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight">Interviewmate</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link to="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link to="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</Link>
            <Link to="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
            <Link to="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</Link>
          </div>

          <Link to="/signup">
            <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-105">
              Start Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest border border-primary/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live AI Interruption Enabled
              </div>
              <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.1] tracking-tight text-foreground">
                Practice Interviews That <span className="text-primary italic">Interrupt You.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                InterviewMate listens while you speak, interrupts weak answers, and asks real follow-ups — just like a real interviewer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/signup">
                  <Button size="lg" className="h-16 px-8 text-lg font-bold rounded-2xl w-full sm:w-auto shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all">
                    Start Free Interview
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-16 px-8 text-lg font-bold rounded-2xl w-full sm:w-auto border-primary/10 hover:bg-secondary/50">
                  <Play className="h-5 w-5 mr-3 fill-current" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Loved by 1000+ learners</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-x-12 translate-y-12 animate-pulse"></div>
              <Card className="relative p-0 overflow-hidden border-primary/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[2rem]">
                <img
                  src="/hero_visual_ai_interrupt_1768544053584.png"
                  alt="InterviewMate Interface showing AI Interruption"
                  className="w-full object-cover"
                />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. “HOW IT’S DIFFERENT” SECTION */}
      <section className="py-24 bg-secondary/30 border-y border-primary/5">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-16 tracking-tight">
            Why Interviewmate feels real
          </h2>
          <div className="grid md:grid-cols-2 gap-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-background rounded-full border border-primary/5 items-center justify-center hidden md:flex font-heading font-bold text-primary z-10">
              VS
            </div>

            <Card className="p-8 text-left space-y-6 border-transparent bg-background/50 backdrop-blur-sm grayscale opacity-70">
              <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                Traditional Mock Interviews
              </h3>
              <ul className="space-y-4">
                {['You answer fully', 'Feedback comes later', 'No interruptions', 'No follow-ups', 'Generic scoring'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8 text-left space-y-6 border-primary/20 shadow-2xl bg-background scale-105">
              <h3 className="text-xl font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Interviewmate
              </h3>
              <ul className="space-y-4">
                {[
                  'AI listens while you speak',
                  'Interrupts unclear answers',
                  'Asks smart follow-ups',
                  'Adapts difficulty in real time',
                  'Diagnoses communication gaps'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <p className="mt-16 text-2xl font-heading font-bold text-primary italic">
            "This is the difference between practice and pressure."
          </p>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight">
            From start to report — in one live session
          </h2>
          <p className="text-muted-foreground text-lg mb-16">No waiting. No guessing.</p>

          <div className="grid md:grid-cols-4 gap-8">
            <StepCard number="1" title="Set up your interview" desc="Choose role, skills, difficulty, and interview type." />
            <StepCard number="2" title="Speak naturally" desc="Answer questions out loud like a real interview." />
            <StepCard number="3" title="AI interrupts & probes" desc="Rambling? Vague answer? The AI stops you and pushes deeper." />
            <StepCard number="4" title="Get a clear report" desc="See strengths, weaknesses, and exactly how to improve." />
          </div>
        </div>
      </section>

      {/* 5. LIVE EXPERIENCE PREVIEW */}
      <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-background/[0.03] skew-x-12 translate-x-24"></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight italic">That’s the experience.</h2>
          </div>
          <Card className="bg-background text-foreground p-8 text-lg border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[2rem] space-y-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Interviewer</span>
                <p className="leading-relaxed font-medium">“Tell me about a time you handled conflict at work.”</p>
              </div>
            </div>

            <div className="flex gap-4 justify-end text-right">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">You</span>
                <div className="bg-secondary p-4 rounded-2xl rounded-tr-none">
                  <p className="leading-relaxed">“So basically, I was working with another developer and—”</p>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=12" alt="you" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">AI Interrupts...</span>
                </div>
                <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tl-none border-2 border-primary-foreground/20">
                  <p className="leading-relaxed font-bold italic">“Pause. What was YOUR responsibility in that situation?”</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. FEATURES SECTION */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight">What powers InterviewMate</h2>
          <p className="text-muted-foreground text-lg mb-16">Support that helps, not hype that distracts.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard title="Voice-Based Interviews" icon={<Mic className="h-8 w-8" />} desc="Talk, don’t type. Practice how interviews actually happen." />
            <FeatureCard title="Smart Cross-Questioning" icon={<Brain className="h-8 w-8" />} desc="AI follows up based on your answers — not scripts." />
            <FeatureCard title="Clear Performance Reports" icon={<BarChart3 className="h-8 w-8" />} desc="Know exactly where you’re strong and where you’re weak." />
            <FeatureCard title="Multiple Interview Types" icon={<Users className="h-8 w-8" />} desc="HR, Technical, Behavioral, Managerial, and Custom." />
          </div>
        </div>
      </section>

      {/* 7. WHO IT’S FOR */}
      <section className="py-24 border-b border-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-16 tracking-tight">InterviewMate is built for:</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Final-year students', 'Software engineers', 'Product managers', 'Career switchers', 'Non-native English speakers'].map((tag) => (
              <div key={tag} className="px-8 py-4 rounded-2xl bg-secondary font-heading font-bold text-lg border border-primary/5 hover:bg-primary hover:text-primary-foreground transition-all cursor-default">
                {tag}
              </div>
            ))}
          </div>
          <p className="mt-12 text-muted-foreground italic text-xl">"If interviews make you nervous — this is for you."</p>
        </div>
      </section>

      {/* 8. REPORT & ANALYTICS PREVIEW */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Card className="p-0 overflow-hidden border-primary/5 shadow-2xl rounded-[2rem]">
              <img src="/analytics_report_preview_premium_1768544075500.png" alt="Detailed Analytics Report" className="w-full" />
            </Card>
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight">
                This is not generic feedback. <br /> It’s <span className="text-primary italic">diagnosis.</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Overall interview score',
                  'Communication clarity rating',
                  'Structure & confidence analysis',
                  'Weakness patterns',
                  'Actionable improvement steps',
                  'Example better answers'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRICING */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight">Start free. Upgrade when ready.</h2>
          <p className="text-muted-foreground text-lg mb-16">No credit card required.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 text-left space-y-8 border-primary/5 bg-secondary/20">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground">For serious starters.</p>
              </div>
              <div className="text-4xl font-bold">₹0</div>
              <ul className="space-y-4">
                {['Limited interviews', 'Basic feedback', 'All interview types'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant="outline" className="w-full h-14 rounded-xl font-bold text-lg border-primary/20 hover:bg-background">
                  Start Free Interview
                </Button>
              </Link>
            </Card>

            <Card className="p-8 text-left space-y-8 border-primary shadow-2xl relative overflow-hidden">
              <div className="absolute top-4 right-4 rotate-12 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">Most Popular</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="text-muted-foreground">For job hunters.</p>
              </div>
              <div className="text-4xl font-bold">₹499<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-4">
                {['Unlimited interviews', 'Advanced analytics', 'PDF reports', 'Priority AI access'].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium">
                    <Check className="h-5 w-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  Upgrade to Pro
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. SOCIAL PROOF */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center gap-2 mb-12">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-8 w-8 text-yellow-500 fill-current" />)}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard quote="The AI interrupted me exactly where real interviewers do." author="Software Engineer" />
            <TestimonialCard quote="This exposed problems I didn’t know I had." author="Product Manager" />
            <TestimonialCard quote="Best interview practice I’ve ever used." author="Final-year student" />
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="py-24 border-t border-primary/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-16 text-center tracking-tight">Common Fears</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-primary/5 px-6 rounded-2xl bg-secondary/30">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">Is my data private?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                Yes. Your sessions are encrypted and never shared. We use enterprise-grade security to ensure your practice stays between you and the AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-primary/5 px-6 rounded-2xl bg-secondary/30">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">Can I use this on mobile?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                Yes. Works perfectly on desktop and mobile browsers. No app download required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-primary/5 px-6 rounded-2xl bg-secondary/30">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">Is it really free to try?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                Yes. No credit card or payment required to start your first interview.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-primary/5 px-6 rounded-2xl bg-secondary/30">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">Can I cancel anytime?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                Yes. Our Pro plan is month-to-month. No long-term lock-in or hidden fees.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="py-32 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-foreground/10 to-transparent opacity-50 ring-offset-primary"></div>
        <div className="container mx-auto px-6 relative z-10 space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-7xl font-heading font-bold tracking-tighter">
              Stop practicing alone.
            </h2>
            <p className="text-2xl md:text-4xl font-serif italic opacity-70">
              Practice with an AI that challenges you.
            </p>
          </div>
          <Link to="/signup">
            <Button className="h-20 px-12 text-2xl font-extrabold rounded-2xl bg-background text-primary hover:bg-background/90 hover:scale-105 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              Start Free Interview
            </Button>
          </Link>
        </div>
      </section>

      {/* 13. FOOTER */}
      <footer className="py-12 border-t border-primary/5 text-center bg-background">
        <div className="container mx-auto px-6 space-y-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-lg font-heading font-bold">InterviewMate</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground font-medium uppercase tracking-widest">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground font-medium opacity-50">
            © 2026 InterviewMate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Components ---------- */

function FeatureCard({ icon, title, desc }) {
  return (
    <Card className="p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-primary/5 group bg-background">
      <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-heading font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </Card>
  )
}

function StepCard({ number, title, desc }) {
  return (
    <div className="text-left space-y-4 group">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-heading font-black text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        {number}
      </div>
      <h3 className="text-xl font-heading font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function TestimonialCard({ quote, author }) {
  return (
    <Card className="p-8 text-left space-y-6 border-primary/5 bg-background shadow-xl hover:shadow-2xl transition-all">
      <Quote className="h-8 w-8 text-primary opacity-20" />
      <p className="text-lg font-medium leading-relaxed italic">“{quote}”</p>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-secondary" />
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">— {author}</span>
      </div>
    </Card>
  )
}

function PricingItem({ children, included = false }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <Check className="h-5 w-5 text-primary" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50" />
      )}
      <span className={included ? "text-foreground" : "text-muted-foreground/50"}>
        {children}
      </span>
    </li>
  )
}
