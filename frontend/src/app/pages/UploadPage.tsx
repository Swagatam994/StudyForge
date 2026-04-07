import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, FileText, X, Sparkles, Brain, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { API_BASE_URL, getAuthToken, saveQuizToSession, type QuizPayload } from "../lib/session";

export function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const supportedExtensions = [".pdf", ".txt", ".doc", ".docx", ".ppt", ".pptx"];

  const isSupportedFile = (file: File) => {
    const filename = file.name.toLowerCase();
    return supportedExtensions.some((ext) => filename.endsWith(ext));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!isSupportedFile(file)) {
        toast.error("Supported types: PDF, TXT, DOC, DOCX, PPT, PPTX");
        return;
      }
      setUploadedFile(file);
      toast.success("File uploaded successfully!");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isSupportedFile(file)) {
        toast.error("Supported types: PDF, TXT, DOC, DOCX, PPT, PPTX");
        return;
      }
      setUploadedFile(file);
      toast.success("File uploaded successfully!");
    }
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please sign in to generate a quiz");
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const { data } = await axios.post<QuizPayload>(`${API_BASE_URL}/api/quiz/generate`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!data?.quizId || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Quiz generation failed: no questions returned");
      }

      saveQuizToSession(data);
      toast.success("Quiz generated successfully!");
      navigate("/quiz", { state: { quiz: data } });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        const payload = (error.response.data as { message?: string; stage?: string } | undefined) || {};
        const message = payload.message || "Failed to generate quiz";
        const stage = payload.stage;

        if (stage === "extraction") {
          toast.error(`Could not read your file. ${message}`);
        } else if (stage === "validation") {
          toast.error(`Document issue: ${message}`);
        } else if (stage === "generation") {
          toast.error(`Quiz generation failed. ${message}`);
        } else {
          toast.error(message);
        }
      } else {
        const message =
          error instanceof AxiosError
            ? ((error.response?.data as { message?: string } | undefined)?.message ?? "Failed to generate quiz")
            : "Failed to generate quiz";
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const FileIcon = FileText;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
            Upload Your Document
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload PDF, TXT, Word, or PowerPoint to generate a Gemini-powered quiz
          </p>
        </div>

        {/* Upload Area */}
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 backdrop-blur-sm ${
            isDragging
              ? "border-[#6366f1] bg-[#6366f1]/10 scale-105"
              : "border-border/50 bg-card/50 hover:border-[#6366f1]/50 hover:bg-card/80"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{
                y: isDragging ? -10 : 0,
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-6 mx-auto">
                <Upload className="w-10 h-10 text-[#6366f1]" />
              </div>
            </motion.div>

            <h3 className="text-2xl font-semibold mb-2">Drop your files here</h3>
            <p className="text-muted-foreground mb-6">
              or{" "}
              <label htmlFor="file-upload" className="text-[#6366f1] hover:text-[#3b82f6] cursor-pointer font-medium transition-colors">
                browse
              </label>{" "}
              to upload
            </p>

            {/* Supported Formats */}
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { icon: FileText, label: "PDF" },
                { icon: FileText, label: "TXT" },
                { icon: FileText, label: "DOC/DOCX" },
                { icon: FileText, label: "PPT/PPTX" },
                { icon: Sparkles, label: "Gemini Quiz" },
                { icon: ClipboardList, label: "10 Questions" },
              ].map((format, index) => (
                <motion.div
                  key={format.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 border border-border/50"
                >
                  <format.icon className="w-4 h-4 text-[#6366f1]" />
                  <span className="text-sm">{format.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Uploaded File Display */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-[#6366f1]" />
                  </div>
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    toast.info("File removed");
                  }}
                  className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-2xl hover:shadow-[#6366f1]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Quiz
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: FileText,
              title: "Smart Summaries",
              description: "AI-powered summaries that capture key concepts",
            },
            {
              icon: Brain,
              title: "Flashcards",
              description: "Interactive flashcards for effective memorization",
            },
            {
              icon: ClipboardList,
              title: "Practice Quizzes",
              description: "Test your knowledge with AI-generated questions",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-[#6366f1]/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-[#6366f1]" />
              </div>
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
