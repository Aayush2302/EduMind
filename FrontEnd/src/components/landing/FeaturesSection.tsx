import { motion } from "framer-motion";
import { MessageSquare, FolderOpen, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Tutoring",
    description: "Intelligent AI conversations tailored to your learning needs and pace.",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Organize your subjects with folders and manage all your learning chats efficiently.",
  },
  {
    icon: FileText,
    title: "Document Integration",
    description: "Upload documents and query them with AI to extract insights and answers.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 bg-background-secondary">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Everything you need to learn
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            A complete platform designed to enhance your learning experience
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card variant="hover" className="h-full p-6">
                <CardHeader className="p-0">
                  <div className="w-10 h-10 rounded-sm bg-surface-2 border border-border flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <CardTitle className="text-base mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
