import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { FileText, Sparkles, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { getDocumentDetail, getDocuments, type DocumentDetail } from "../../api/dashboardApi";
import { loadQuizFromSession } from "../lib/session";

type KeyPoint = {
  heading: string;
  content: string;
};

type SummaryViewData = {
  title: string;
  summary: string;
  keyPoints: KeyPoint[];
  keyTerms: string[];
};

const buildSummaryData = (detail: DocumentDetail): SummaryViewData | null => {
  const summaryText = detail.quiz.aiSummary?.trim();
  if (!summaryText) return null;

  const keyPoints: KeyPoint[] = [];

  keyPoints.push({
    heading: "Document Overview",
    content: summaryText,
  });

  const topFlashcards = (detail.quiz.aiFlashcards || detail.flashcards || []).slice(0, 4);
  topFlashcards.forEach((card) => {
    keyPoints.push({
      heading: card.topic || "Key Concept",
      content: card.back,
    });
  });

  const keyTerms = [...new Set((detail.quiz.aiFlashcards || detail.flashcards || []).map((card) => card.topic))]
    .filter(Boolean);

  return {
    title: detail.quiz.pdfName,
    summary: summaryText,
    keyPoints: keyPoints.slice(0, 5),
    keyTerms: keyTerms.slice(0, 12),
  };
};

export function SummaryPage() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessionQuizId = loadQuizFromSession()?.quizId;
        if (sessionQuizId) {
          const response = await getDocumentDetail(sessionQuizId);
          setDetail(response);
          return;
        }

        const documents = await getDocuments();
        if (!documents.length) {
          setDetail(null);
          return;
        }

        const preferredDoc = documents[0];
        const response = await getDocumentDetail(preferredDoc.quizId);
        setDetail(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const summaryData = useMemo(() => (detail ? buildSummaryData(detail) : null), [detail]);

  const handleCopy = () => {
    if (!summaryData) return;
    const text = `${summaryData.title}\n\n${summaryData.keyPoints
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
    <div className="max-w-5xl mx-auto text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
            <p className="text-slate-300 text-lg ml-[52px]">Gemini summary generated from your uploaded document</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl bg-card/80 border border-border/50 hover:bg-accent transition-all duration-200"
              disabled={!summaryData}
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200"
              disabled={!summaryData}
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-slate-300">
            Loading summary...
          </div>
        )}

        {error && (
          <div className="p-8 rounded-2xl bg-red-950/40 border border-red-700/60 backdrop-blur-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !summaryData && (
          <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-slate-300">
            No AI summary available yet. Upload a document and generate content first.
          </div>
        )}

        {!loading && !error && summaryData && (
          <>
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
                  <h2 className="text-2xl font-semibold mb-2 text-white">{summaryData.title}</h2>
                  <p className="text-slate-300">
                    This summary is generated by Gemini directly from your source document.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {summaryData.keyPoints.map((point, index) => (
                  <motion.div
                    key={`${point.heading}-${index}`}
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
                        <h3 className="text-lg font-semibold mb-2 text-white">{point.heading}</h3>
                        <p className="text-slate-300 leading-relaxed">{point.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-[#6366f1]/5 to-[#3b82f6]/5 border border-[#6366f1]/20 backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#6366f1]" />
                </div>
                Key Terms to Remember
              </h3>
              <div className="flex flex-wrap gap-3">
                {summaryData.keyTerms.map((term, index) => (
                  <motion.div
                    key={`${term}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="px-4 py-2 rounded-xl bg-card/80 border border-[#6366f1]/30 hover:border-[#6366f1]/60 hover:bg-card transition-all duration-200 cursor-pointer text-white"
                  >
                    <span className="text-sm font-medium">{term}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
