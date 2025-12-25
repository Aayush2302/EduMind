import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-foreground font-semibold text-lg">
          EduMind
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-text-secondary hover:text-foreground transition-colors text-sm">
            Features
          </a>
          <a href="#how-it-works" className="text-text-secondary hover:text-foreground transition-colors text-sm">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="hero-primary" size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
