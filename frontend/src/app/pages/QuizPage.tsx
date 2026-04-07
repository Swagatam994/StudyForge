import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ClipboardList, Check, X, Trophy, RotateCw } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import {
  API_BASE_URL,
  getAuthToken,
  loadQuizFromSession,
  saveAttemptIdToSession,
  saveReportToSession,
  saveQuizToSession,
  type ReportPayload,
  type QuizPayload,
  type QuizQuestion,
} from "../lib/session";

type RouteState = {
  quiz?: QuizPayload;
} | null;

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/^[A-D][\.\):\-]\s*/i, "")
    .toLowerCase();

const resolveCorrectAnswer = (question: QuizQuestion): string => {
  const options = question.options.map((option) => String(option));
  const raw = String(question.correctAnswer || "").trim();

  if (options.includes(raw)) {
    return raw;
  }

  const letterMatch = raw.match(/^[A-D]/i);
  if (letterMatch) {
    const index = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
    if (options[index]) {
      return options[index];
    }
  }

  const normalizedRaw = normalizeText(raw);
  const matchingOption = options.find((option) => normalizeText(option) === normalizedRaw);
  return matchingOption || raw;
};

const sanitizeQuiz = (quiz: QuizPayload): QuizPayload => ({
  ...quiz,
  questions: quiz.questions
    .filter((item) => item?.question && Array.isArray(item?.options))
    .map((item) => {
      const options = item.options.map((option) => String(option)).slice(0, 4);
      return {
        ...item,
        question: String(item.question),
        topic: String(item.topic || "General"),
        options,
        correctAnswer: resolveCorrectAnswer({ ...item, options }),
      };
    })
    .filter((item) => item.options.length === 4),
});

export function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const startTimeRef = useRef<number>(Date.now());

  const [quizData, setQuizData] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverScore, setServerScore] = useState<number | null>(null);

  useEffect(() => {
    const routeState = location.state as RouteState;
    const sourceQuiz = routeState?.quiz || loadQuizFromSession();

    if (!sourceQuiz) {
      setQuizData(null);
      return;
    }

    const sanitized = sanitizeQuiz(sourceQuiz);
    if (!sanitized.questions.length) {
      toast.error("No valid quiz questions found. Please upload another PDF.");
      setQuizData(null);
      return;
    }

    setQuizData(sanitized);
    saveQuizToSession(sanitized);
    setAnswers(Array(sanitized.questions.length).fill(null));
    setShowResults(false);
    setServerScore(null);
    startTimeRef.current = Date.now();
  }, [location.state]);

  const totalQuestions = quizData?.questions.length ?? 0;
  const answeredCount = useMemo(() => answers.filter((answer) => answer !== null).length, [answers]);
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;

  const score = useMemo(() => {
    if (!quizData) return 0;
    return answers.reduce((count, answer, index) => {
      return answer === quizData.questions[index]?.correctAnswer ? count + 1 : count;
    }, 0);
  }, [answers, quizData]);

  const percentage = useMemo(() => {
    if (!quizData) return 0;
    if (typeof serverScore === "number") return serverScore;
    return Math.round((score / quizData.questions.length) * 100);
  }, [quizData, score, serverScore]);

  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = option;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    const allAnswered = answers.every((answer) => answer !== null);
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please sign in again");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const userAnswers = quizData.questions.map((question, index) => ({
        question: question.question,
        topic: question.topic,
        userAnswer: answers[index] || "",
        correctAnswer: question.correctAnswer,
      }));

      const timeTaken = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const { data } = await axios.post<{ score?: number; attemptId?: string }>(
        `${API_BASE_URL}/api/quiz/submit`,
        {
          quizId: quizData.quizId,
          userAnswers,
          timeTaken,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (typeof data.score === "number") {
        setServerScore(data.score);
      }

      if (data.attemptId) {
        saveAttemptIdToSession(data.attemptId);
        try {
          const reportResponse = await axios.post<ReportPayload>(
            `${API_BASE_URL}/api/report/generate/${data.attemptId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          saveReportToSession(reportResponse.data);
        } catch (_reportError) {
          toast.info("Quiz submitted, but report generation will be retried in Weak Analysis.");
        }
      }

      setShowResults(true);
      toast.success("Quiz completed!");
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? "Failed to submit quiz")
          : "Failed to submit quiz";
      toast.error(message);
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    if (!quizData) return;
    setAnswers(Array(quizData.questions.length).fill(null));
    setShowResults(false);
    setServerScore(null);
    startTimeRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!quizData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-semibold mb-3">No Quiz Found</h1>
          <p className="text-muted-foreground mb-6">
            Upload a PDF first so we can generate a Gemini-based quiz.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

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
            <p className="text-muted-foreground text-lg">Here&apos;s how you performed</p>
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
                {score}/{quizData.questions.length}
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
            {quizData.questions.map((question, index) => (
              <div
                key={`${question._id || question.question}-${index}`}
                className={`p-6 rounded-2xl border backdrop-blur-sm ${
                  answers[index] === question.correctAnswer
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      answers[index] === question.correctAnswer ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {answers[index] === question.correctAnswer ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={`${option}-${optionIndex}`}
                          className={`p-3 rounded-xl border ${
                            option === question.correctAnswer
                              ? "bg-green-500/10 border-green-500/30 text-green-500"
                              : option === answers[index]
                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                : "bg-background/50 border-border/30"
                          }`}
                        >
                          <span className="text-sm">{option}</span>
                          {option === question.correctAnswer && (
                            <span className="ml-2 text-xs">(Correct)</span>
                          )}
                          {option === answers[index] && option !== question.correctAnswer && (
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

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              Practice Quiz
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-[52px]">
            Answer all questions below and submit once.
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-card/70 border border-border/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Answered {answeredCount} of {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {quizData.questions.map((question, qIndex) => (
            <div key={`${question._id || question.question}-${qIndex}`} className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-2">{qIndex + 1}. {question.question}</h2>
              <p className="text-sm text-muted-foreground mb-4">Topic: {question.topic}</p>

              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={`${option}-${optionIndex}`}
                    onClick={() => handleSelectAnswer(qIndex, option)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                      answers[qIndex] === option
                        ? "bg-gradient-to-r from-[#6366f1]/20 to-[#3b82f6]/20 border-[#6366f1] shadow-lg shadow-[#6366f1]/10"
                        : "bg-background/50 border-border/50 hover:border-[#6366f1]/50 hover:bg-accent"
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          answers[qIndex] === option
                            ? "border-[#6366f1] bg-[#6366f1]"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {answers[qIndex] === option && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sticky bottom-4 z-10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
