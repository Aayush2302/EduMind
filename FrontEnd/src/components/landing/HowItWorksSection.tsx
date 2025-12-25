import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create a Subject",
    description: "Organize your learning by creating subjects for different topics or courses.",
  },
  {
    number: "02",
    title: "Start Learning",
    description: "Begin conversations with AI tutors who adapt to your learning style.",
  },
  {
    number: "03",
    title: "Upload Materials",
    description: "Add documents, notes, and resources to enhance your learning context.",
  },
  {
    number: "04",
    title: "Track Progress",
    description: "Review your chats and materials to reinforce your understanding.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-text-secondary">
            Simple steps to accelerate your learning
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-6 p-6 bg-surface-1 border border-border rounded-sm hover:bg-surface-hover transition-colors duration-200"
            >
              <span className="text-2xl font-mono text-text-muted">{step.number}</span>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
