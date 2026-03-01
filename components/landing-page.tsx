"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Sparkles,
  Layers,
  Image,
  Wand2,
  MonitorSmartphone,
  ArrowRight,
} from "lucide-react";

const ease = [0.25, 0.4, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease },
  }),
};

const features = [
  {
    icon: Image,
    title: "Marketing Screenshots",
    description:
      "Design App Store screenshots with a powerful canvas editor. Add device frames, text overlays, and backgrounds.",
  },
  {
    icon: Wand2,
    title: "AI‑Powered Editing",
    description:
      "Describe what you want and let AI edit your canvas — change backgrounds, add text, rearrange elements instantly.",
  },
  {
    icon: Sparkles,
    title: "App Icon Generation",
    description:
      "Generate stunning app icons with AI. Create multiple variants and export at every required resolution.",
  },
  {
    icon: MonitorSmartphone,
    title: "Multi‑Device Presets",
    description:
      "iPhone, iPad, and Mac presets built in. One project, every screen size — export them all at once.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload your screenshots",
    description: "Drop in your raw app screenshots or UI captures.",
  },
  {
    number: "02",
    title: "Design with AI",
    description:
      "Use the canvas editor or ask AI to add frames, text, and polish.",
  },
  {
    number: "03",
    title: "Export everywhere",
    description:
      "Download optimized assets for every device — ready for App Store Connect.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50"
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <span className="text-base font-semibold tracking-tight">
            App Store Image Studio
          </span>
          <Button asChild size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-40 pb-28 px-6 text-center">
        {/* Gradient background orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="landing-orb landing-orb-1" />
          <div className="landing-orb landing-orb-2" />
          <div className="landing-orb landing-orb-3" />
        </div>

        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="size-3" />
            Powered by AI
          </Badge>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] max-w-3xl"
        >
          Your all‑in‑one{" "}
          <span className="landing-gradient-text">App Store</span> creative
          studio
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
        >
          Marketing screenshots, app icons, and store assets — designed in
          minutes with AI and a powerful canvas editor.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link href="/login">
              Get Started Free
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-6 text-base"
          >
            <a href="#features">See Features</a>
          </Button>
        </motion.div>

        {/* Hero device mockup */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-20 w-full max-w-4xl"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="size-3 rounded-full bg-red-400/80" />
              <div className="size-3 rounded-full bg-yellow-400/80" />
              <div className="size-3 rounded-full bg-green-400/80" />
              <span className="ml-2 text-xs text-muted-foreground">
                App Store Image Studio
              </span>
            </div>
            <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
              {/* Canvas mockup */}
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-2xl">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 1.0 + i * 0.15,
                      duration: 0.5,
                      ease,
                    }}
                    className="aspect-[9/19.5] rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 flex flex-col items-center justify-end p-3 landing-float"
                    style={{
                      animationDelay: `${i * 0.6}s`,
                    }}
                  >
                    <div className="w-full space-y-1.5">
                      <div className="h-1.5 rounded-full bg-primary/30 w-3/4 mx-auto" />
                      <div className="h-1.5 rounded-full bg-primary/20 w-1/2 mx-auto" />
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* AI sparkle overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 px-3 py-1.5 text-xs text-primary font-medium"
              >
                <Sparkles className="size-3" />
                AI editing
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section
        id="features"
        className="py-28 px-6 bg-muted/30 border-y border-border/40"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <motion.h2
              custom={0}
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Everything you need
            </motion.h2>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto"
            >
              One toolkit for every App Store creative — from screenshots to
              icons.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={scaleIn}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <motion.h2
              custom={0}
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Three steps. That&apos;s it.
            </motion.h2>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="mt-4 text-muted-foreground text-lg max-w-md mx-auto"
            >
              Go from raw screenshots to App Store‑ready assets in minutes.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                custom={i}
                variants={fadeUp}
                className="relative text-center"
              >
                <span className="landing-gradient-text text-5xl font-extrabold">
                  {s.number}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Device strip ───────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/30 border-y border-border/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div custom={0} variants={fadeUp}>
            <div className="flex items-center justify-center gap-3 mb-6 text-muted-foreground">
              <Smartphone className="size-5" />
              <Layers className="size-5" />
              <MonitorSmartphone className="size-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Every device. Every size.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built‑in presets for iPhone 5.5″, 6.5″, 6.7″, iPad, and Mac —
              export pixel‑perfect assets for all of them.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            custom={0}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Ready to ship beautiful store pages?
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="mt-4 text-muted-foreground text-lg max-w-md mx-auto"
          >
            Start creating your App Store assets today — no design skills
            required.
          </motion.p>
          <motion.div custom={2} variants={fadeUp} className="mt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/login">
                Get Started Free
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} App Store Image Studio</span>
          <span>Made for developers who ship.</span>
        </div>
      </footer>
    </div>
  );
}
