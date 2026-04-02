import { useState } from "react";
import { motion } from "motion/react";
import { FileText, Sparkles, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

const mockSummary = {
  title: "Introduction to Machine Learning",
  keyPoints: [
    {
      heading: "What is Machine Learning?",
      content: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
    },
    {
      heading: "Types of Machine Learning",
      content: "There are three main types: Supervised Learning (labeled data), Unsupervised Learning (unlabeled data), and Reinforcement Learning (reward-based).",
    },
    {
      heading: "Key Algorithms",
      content: "Popular algorithms include Linear Regression, Decision Trees, Neural Networks, K-Means Clustering, and Support Vector Machines.",
    },
    {
      heading: "Applications",
      content: "Machine learning powers recommendation systems, image recognition, natural language processing, autonomous vehicles, and predictive analytics.",
    },
    {
      heading: "Model Training Process",
      content: "Training involves feeding data to the algorithm, adjusting parameters, validating performance, and testing on new data to ensure generalization.",
    },
  ],
  keyTerms: [
    "Neural Networks",
    "Deep Learning",
    "Training Data",
    "Model Validation",
    "Feature Engineering",
    "Overfitting",
    "Cross-Validation",
  ],
};

export function SummaryPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${mockSummary.title}\n\n${mockSummary.keyPoints
      .map((point) => `${point.heading}\n${point.content}`)
      .join("\n\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    toast.success("Summary downloaded as PDF!");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#6366f1]" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
                AI-Generated Summary
              </h1>
            </div>
            <p className="text-muted-foreground text-lg ml-[52px]">
              Key concepts extracted from your study material
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm mb-6"
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">{mockSummary.title}</h2>
              <p className="text-muted-foreground">
                This summary was generated using advanced AI to extract the most important concepts from your material.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {mockSummary.keyPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/10 to-[#3b82f6]/10 flex items-center justify-center flex-shrink-0 mt-1 border border-[#6366f1]/20 group-hover:border-[#6366f1]/50 transition-all duration-200">
                    <span className="text-sm font-semibold text-[#6366f1]">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{point.heading}</h3>
                    <p className="text-muted-foreground leading-relaxed">{point.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Key Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-[#6366f1]/5 to-[#3b82f6]/5 border border-[#6366f1]/20 backdrop-blur-sm"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#6366f1]" />
            </div>
            Key Terms to Remember
          </h3>
          <div className="flex flex-wrap gap-3">
            {mockSummary.keyTerms.map((term, index) => (
              <motion.div
                key={term}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="px-4 py-2 rounded-xl bg-card/80 border border-[#6366f1]/30 hover:border-[#6366f1]/60 hover:bg-card transition-all duration-200 cursor-pointer"
              >
                <span className="text-sm font-medium">{term}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button className="p-6 rounded-2xl bg-card/80 border border-border/50 hover:border-[#6366f1]/50 hover:bg-card transition-all duration-200 text-left group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h4 className="font-semibold mb-1">Create Flashcards</h4>
            <p className="text-sm text-muted-foreground">Generate flashcards from this summary</p>
          </button>

          <button className="p-6 rounded-2xl bg-card/80 border border-border/50 hover:border-[#6366f1]/50 hover:bg-card transition-all duration-200 text-left group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h4 className="font-semibold mb-1">Take a Quiz</h4>
            <p className="text-sm text-muted-foreground">Test your understanding</p>
          </button>

          <button className="p-6 rounded-2xl bg-card/80 border border-border/50 hover:border-[#6366f1]/50 hover:bg-card transition-all duration-200 text-left group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h4 className="font-semibold mb-1">Deep Dive</h4>
            <p className="text-sm text-muted-foreground">Explore topics in detail</p>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
