import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Activity, 
  Shield, 
  Sparkles, 
  Calendar, 
  Users, 
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Globe,
  Zap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20 selection:text-primary">
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/40 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_2px_8px_hsl(var(--primary)/0.4)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_4px_16px_hsl(var(--primary)/0.5)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-xl ring-2 ring-primary/30 animate-pulse-dot" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Prime<span className="text-primary">Health</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Solutions</Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 auth-bg overflow-hidden">
        {/* Decorative Blurs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="animate-fade-up">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3 w-3 mr-2" />
              Next-Gen Clinic Management
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Modernize Your Practice with <br className="hidden md:block" />
              <span className="gradient-text">AI-Powered</span> Intelligence
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Prime Health is the all-in-one platform for modern clinics. Manage appointments, 
              patients, and records with an AI booking assistant that works 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-1">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold glow group">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold border-border/60 hover:bg-muted">
              Schedule Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-12 flex flex-col items-center gap-6 animate-fade-up stagger-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trusted by leading medical practices</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-xl font-bold italic"><Activity className="h-6 w-6 text-primary" />MediCloud</div>
              <div className="flex items-center gap-2 text-xl font-bold italic"><Shield className="h-6 w-6 text-primary" />HealthSafe</div>
              <div className="flex items-center gap-2 text-xl font-bold italic"><Zap className="h-6 w-6 text-primary" />QuickCare</div>
              <div className="flex items-center gap-2 text-xl font-bold italic"><Globe className="h-6 w-6 text-primary" />GlobalHealth</div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview / Mockup */}
        <div className="mt-20 max-w-6xl mx-auto relative animate-fade-up stagger-3">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-3xl translate-y-12" />
          <div className="rounded-3xl border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-slate-900/5 dark:bg-white/5 backdrop-blur-md p-2 overflow-hidden group">
            <div className="rounded-2xl bg-white dark:bg-slate-950 aspect-[16/9] overflow-hidden relative shadow-inner">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />
               <div className="absolute top-4 left-4 right-4 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/40 flex items-center px-4 gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/20" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/20" />
                  </div>
                  <div className="h-6 w-1/3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
               </div>
               <div className="absolute top-20 left-4 bottom-4 w-64 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/40 p-4 space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-8 rounded-lg bg-slate-200/40 dark:bg-slate-800/40" />)}
               </div>
               <div className="absolute top-20 left-[284px] right-4 bottom-4 grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/40 p-6 space-y-6">
                    <div className="h-8 w-1/2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
                    <div className="space-y-4">
                       {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl border border-border/20 bg-white dark:bg-slate-950" />)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/40 p-6 space-y-6">
                    <div className="aspect-square rounded-full border-8 border-primary/20 flex items-center justify-center">
                       <div className="h-1/2 w-1/2 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-8 w-8 text-primary animate-pulse" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="h-4 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
                       <div className="h-4 w-2/3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 mx-auto" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features --- */}
      <section id="features" className="py-24 px-6 md:px-12 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to <span className="text-primary">scale your clinic</span></h2>
            <p className="text-muted-foreground text-lg">Powerful tools designed for the modern healthcare professional. Simple, fast, and secure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-lift border-border/40 group">
              <CardContent className="p-8 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Smart Scheduling</h3>
                  <p className="text-muted-foreground leading-relaxed">Automate your bookings with a smart calendar that optimizes your slots and prevents double-booking.</p>
                </div>
                <ul className="space-y-2.5 pt-2">
                  {["Instant Confirmation", "Waitlist Management", "Calendar Sync"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/40 group">
              <CardContent className="p-8 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI Booking Widget</h3>
                  <p className="text-muted-foreground leading-relaxed">A custom AI chat assistant for your website that answers patient queries and books appointments automatically.</p>
                </div>
                <ul className="space-y-2.5 pt-2">
                  {["24/7 Availability", "Multi-language Support", "Natural Conversation"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-lift border-border/40 group">
              <CardContent className="p-8 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Patient Portal</h3>
                  <p className="text-muted-foreground leading-relaxed">Centralized patient records, medical history, and communication logs in one secure, organized place.</p>
                </div>
                <ul className="space-y-2.5 pt-2">
                  {["Encrypted Records", "Communication History", "Quick Onboarding"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 px-6 md:px-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ready to give your practice <br className="hidden md:block" /> 
            the Prime Health advantage?
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto">
            Join hundreds of doctors who are saving hours every week and providing a 
            premium experience to their patients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link href="/signup">
              <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-white text-primary hover:bg-slate-100 shadow-2xl transition-transform hover:scale-105 active:scale-95">
                Get Started for Free
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-white/80 font-medium">
               <Shield className="h-5 w-5" /> No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 md:px-12 bg-slate-50 dark:bg-slate-900/50 border-t border-border/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Prime<span className="text-primary">Health</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              The next-generation clinic management platform powered by AI. 
              Helping doctors deliver exceptional patient care through intelligence.
            </p>
            <div className="flex items-center gap-4 pt-4">
               {["twitter", "linkedin", "github"].map(social => (
                 <div key={social} className="h-10 w-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all cursor-pointer">
                    <Globe className="h-5 w-5" />
                 </div>
               ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Product</h4>
            <ul className="space-y-4">
              {["Features", "Integrations", "Pricing", "Widget"].map(item => (
                <li key={item}><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Company</h4>
            <ul className="space-y-4">
              {["About", "Privacy", "Terms", "Contact"].map(item => (
                <li key={item}><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Prime Scale Studio. Built with ❤️ for healthcare professionals.</p>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 Systems Operational
              </div>
              <div className="text-xs text-muted-foreground">Version 1.0.0</div>
           </div>
        </div>
      </footer>
    </div>
  );
}
