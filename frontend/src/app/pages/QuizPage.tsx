import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Check, X, Trophy, RotateCw } from "lucide-react";
import { toast } from "sonner";

const mockQuiz = [
  {
    question: "What is the primary goal of Machine Learning?",
    options: [
      "To replace human intelligence",
      "To enable systems to learn from experience",
      "To create robots",
      "To store data efficiently",
    ],
    correctAnswer: 1,
  },
  {
    question: "Which type of learning uses labeled data?",
    options: ["Unsupervised Learning", "Reinforcement Learning", "Supervised Learning", "Deep Learning"],
    correctAnswer: 2,
  },
  {
    question: "What is overfitting in machine learning?",
    options: [
      "When a model performs too well on training data but poorly on new data",
      "When a model doesn't learn anything",
      "When a model is too simple",
      "When training takes too long",
    ],
    correctAnswer: 0,
  },
  {
    question: "What is the purpose of cross-validation?",
    options: [
      "To increase training speed",
      "To assess model performance and prevent overfitting",
      "To visualize data",
      "To clean data",
    ],
    correctAnswer: 1,
  },
  {
    question: "Which of these is NOT a type of machine learning?",
    options: ["Supervised Learning", "Unsupervised Learning", "Quantum Learning", "Reinforcement Learning"],
    correctAnswer: 2,
  },
];

export function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(mockQuiz.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelectAnswer = (index: number) => {
    if (!submitted) {
      setSelectedAnswer(index);
    }
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);

      if (currentQuestion < mockQuiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(answers[currentQuestion + 1]);
        setSubmitted(false);
      }
    } else {
      toast.error("Please select an answer");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setSubmitted(false);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    const allAnswered = newAnswers.every((ans) => ans !== null);
    if (allAnswered) {
      setShowResults(true);
      toast.success("Quiz completed!");
    } else {
      toast.error("Please answer all questions");
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(Array(mockQuiz.length).fill(null));
    setShowResults(false);
    setSubmitted(false);
  };

  const calculateScore = () => {
    return answers.reduce((score, answer, index) => {
      return answer === mockQuiz[index].correctAnswer ? score + 1 : score;
    }, 0);
  };

  const score = calculateScore();
  const percentage = Math.round((score / mockQuiz.length) * 100);
  const progress = ((currentQuestion + 1) / mockQuiz.length) * 100;

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mx-auto mb-6"
            >
              <Trophy className="w-12 h-12 text-[#6366f1]" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              Quiz Complete!
            </h1>
            <p className="text-muted-foreground text-lg">Here's how you performed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                {percentage}%
              </div>
              <p className="text-muted-foreground">Score</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                {score}/{mockQuiz.length}
              </div>
              <p className="text-muted-foreground">Correct Answers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                {percentage >= 80 ? "A" : percentage >= 60 ? "B" : percentage >= 40 ? "C" : "D"}
              </div>
              <p className="text-muted-foreground">Grade</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            {mockQuiz.map((q, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border backdrop-blur-sm ${
                  answers[index] === q.correctAnswer
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      answers[index] === q.correctAnswer ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {answers[index] === q.correctAnswer ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3">
                      {index + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-xl border ${
                            optIndex === q.correctAnswer
                              ? "bg-green-500/10 border-green-500/30 text-green-500"
                              : optIndex === answers[index]
                              ? "bg-red-500/10 border-red-500/30 text-red-500"
                              : "bg-background/50 border-border/30"
                          }`}
                        >
                          <span className="text-sm">{option}</span>
                          {optIndex === q.correctAnswer && (
                            <span className="ml-2 text-xs">(Correct)</span>
                          )}
                          {optIndex === answers[index] && optIndex !== q.correctAnswer && (
                            <span className="ml-2 text-xs">(Your answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <button
            onClick={handleRetake}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <RotateCw className="w-5 h-5" />
            Retake Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = mockQuiz[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              Practice Quiz
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-[52px]">Test your understanding of the material</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {mockQuiz.length}
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

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm mb-6">
              <h2 className="text-2xl font-semibold mb-6">{currentQ.question}</h2>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                      selectedAnswer === index
                        ? "bg-gradient-to-r from-[#6366f1]/20 to-[#3b82f6]/20 border-[#6366f1] shadow-lg shadow-[#6366f1]/10"
                        : "bg-background/50 border-border/50 hover:border-[#6366f1]/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          selectedAnswer === index
                            ? "border-[#6366f1] bg-[#6366f1]"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedAnswer === index && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestion === mockQuiz.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200"
            >
              Next Question
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}