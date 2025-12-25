import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 px-4 bg-background-secondary border-t border-border">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
          Ready to start learning?
        </h2>
        <p className="text-text-secondary mb-8">
          Join EduMind today and transform your learning experience with AI
        </p>
        <Button variant="hero-primary" size="lg" asChild>
          <Link to="/register">Get Started for Free</Link>
        </Button>
      </motion.div>
    </section>
  );
}
