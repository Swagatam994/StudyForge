import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronLeft, ChevronRight, RotateCw, Shuffle, BookOpen } from "lucide-react";
import { toast } from "sonner";

const mockFlashcards = [
  {
    front: "What is Machine Learning?",
    back: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
  },
  {
    front: "What are the three main types of Machine Learning?",
    back: "1. Supervised Learning (labeled data)\n2. Unsupervised Learning (unlabeled data)\n3. Reinforcement Learning (reward-based)",
  },
  {
    front: "What is a Neural Network?",
    back: "A neural network is a computing system inspired by biological neural networks, consisting of interconnected nodes (neurons) that process and transmit information.",
  },
  {
    front: "What is Overfitting?",
    back: "Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor performance on new, unseen data.",
  },
  {
    front: "What is Cross-Validation?",
    back: "Cross-validation is a technique for assessing model performance by partitioning data into subsets, training on some subsets while validating on others.",
  },
  {
    front: "What is Feature Engineering?",
    back: "Feature engineering is the process of selecting, modifying, or creating new features from raw data to improve machine learning model performance.",
  },
];

export function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState(mockFlashcards);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 200);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.success("Flashcards shuffled!");
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.info("Reset to first card");
  };

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
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
                <Brain className="w-5 h-5 text-[#6366f1]" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
                Flashcards
              </h1>
            </div>
            <p className="text-muted-foreground text-lg ml-[52px]">
              Master concepts through active recall
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
              title="Reset"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleShuffle}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative mb-8" style={{ perspective: "1000px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                onClick={handleFlip}
                className="relative h-[400px] cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front of Card */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6366f1]/10 to-[#3b82f6]/10 border border-[#6366f1]/30 backdrop-blur-sm p-12 flex flex-col items-center justify-center text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-[#6366f1]" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-4">{currentCard.front}</h2>
                  <p className="text-sm text-muted-foreground">Click to reveal answer</p>
                </div>

                {/* Back of Card */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3b82f6]/10 to-[#6366f1]/10 border border-[#3b82f6]/30 backdrop-blur-sm p-12 flex flex-col items-center justify-center text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6]/20 to-[#6366f1]/20 flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-[#3b82f6]" />
                  </div>
                  <p className="text-lg leading-relaxed whitespace-pre-line">{currentCard.back}</p>
                  <p className="text-sm text-muted-foreground mt-6">Click to flip back</p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-4 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card/80"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleFlip}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200"
          >
            {isFlipped ? "Show Question" : "Show Answer"}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="p-4 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card/80"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
              {cards.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Cards</p>
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
              {currentIndex + 1}
            </div>
            <p className="text-sm text-muted-foreground">Current Card</p>
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
              {cards.length - currentIndex - 1}
            </div>
            <p className="text-sm text-muted-foreground">Remaining</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}