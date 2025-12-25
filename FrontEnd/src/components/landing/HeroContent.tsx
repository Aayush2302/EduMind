import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroContent() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-4"
      >
        <span className="text-text-secondary text-sm font-medium tracking-widest uppercase">
          AI-Powered Learning Platform
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-5xl md:text-7xl font-semibold text-foreground mb-6 tracking-tight"
      >
        EduMind
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="text-xl md:text-2xl text-text-secondary mb-4 max-w-2xl"
      >
        Learn Smarter with AI
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="text-base text-text-muted mb-10 max-w-xl"
      >
        Organize subjects, chat with AI tutors, and manage your learning materials
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button variant="hero-primary" size="lg" asChild>
          <Link to="/register">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="#features">Learn More</Link>
        </Button>
      </motion.div>
    </div>
  );
}
