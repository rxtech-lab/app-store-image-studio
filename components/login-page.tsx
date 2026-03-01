"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

const ease = [0.25, 0.4, 0, 1] as const;

export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
    </div>
  );
}

export function LoginHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="text-center mb-8"
    >
      <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-5">
        <Sparkles className="size-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your App Store Image Studio
      </p>
    </motion.div>
  );
}

export function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease }}
      className="w-full max-w-sm"
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-lg p-8">
        {children}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        By signing in you agree to our terms of service.
      </motion.p>
    </motion.div>
  );
}
