import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronLeft, ChevronRight, RotateCw, Shuffle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getDocumentDetail, getDocuments } from "../../api/dashboardApi";
import { loadQuizFromSession } from "../lib/session";

type Flashcard = {
  front: string;
  back: string;
  topic: string;
};

export function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessionQuizId = loadQuizFromSession()?.quizId;
        if (sessionQuizId) {
          const detail = await getDocumentDetail(sessionQuizId);
          const aiCards = (detail.quiz.aiFlashcards || detail.flashcards || [])
            .filter((card) => card.front && card.back)
            .map((card) => ({
              front: card.front,
              back: card.back,
              topic: card.topic || "General",
            }));
          setCards(aiCards);
          return;
        }

        const documents = await getDocuments();
        if (!documents.length) {
          setCards([]);
          return;
        }

        const preferredDoc = documents[0];
        const detail = await getDocumentDetail(preferredDoc.quizId);

        const dynamicCards = (detail.quiz.aiFlashcards || detail.flashcards || [])
          .filter((card) => card.front && card.back)
          .map((card) => ({
            front: card.front,
            back: card.back,
            topic: card.topic || "General",
          }));

        setCards(dynamicCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flashcards");
      } finally {
        setLoading(false);
      }
    };

    loadFlashcards();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards.length]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 200);
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
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
  const progress = cards.length ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const hasCards = useMemo(() => cards.length > 0, [cards.length]);

  return (
    <div className="max-w-4xl mx-auto text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
            <p className="text-slate-300 text-lg ml-[52px]">Master concepts through active recall</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
              title="Reset"
              disabled={!hasCards}
            >
              <RotateCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleShuffle}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
              title="Shuffle"
              disabled={!hasCards}
            >
              <Shuffle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-slate-300">
            Loading flashcards...
          </div>
        )}

        {error && (
          <div className="p-8 rounded-2xl bg-red-950/40 border border-red-700/60 backdrop-blur-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !hasCards && (
          <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-slate-300">
            No AI flashcards available yet. Upload a document and generate content first.
          </div>
        )}

        {!loading && !error && hasCards && currentCard && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <span className="text-sm text-slate-300">{Math.round(progress)}% Complete</span>
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
                      <h2 className="text-2xl font-semibold mb-4 text-white">{currentCard.front}</h2>
                      <p className="text-sm text-slate-400">Click to reveal answer</p>
                    </div>

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
                      <p className="text-lg leading-relaxed whitespace-pre-line text-white">{currentCard.back}</p>
                      <span className="mt-4 inline-block rounded-full bg-indigo-900/80 px-3 py-1 text-xs text-indigo-300">
                        {currentCard.topic}
                      </span>
                      <p className="text-sm text-slate-400 mt-6">Click to flip back</p>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-4 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card/80"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
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
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

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
                <p className="text-sm text-slate-300">Total Cards</p>
              </div>

              <div className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                  {currentIndex + 1}
                </div>
                <p className="text-sm text-slate-300">Current Card</p>
              </div>

              <div className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                  {cards.length - currentIndex - 1}
                </div>
                <p className="text-sm text-slate-300">Remaining</p>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
