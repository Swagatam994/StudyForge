import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Play, BookOpen, Target, Zap, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from "recharts";

const performanceData = [
  { topic: "Neural Networks", score: 45, total: 100 },
  { topic: "Supervised Learning", score: 75, total: 100 },
  { topic: "Data Processing", score: 60, total: 100 },
  { topic: "Model Validation", score: 85, total: 100 },
  { topic: "Deep Learning", score: 50, total: 100 },
  { topic: "Feature Engineering", score: 70, total: 100 },
];

const radarData = [
  { subject: "Theory", score: 65 },
  { subject: "Practice", score: 75 },
  { subject: "Applications", score: 55 },
  { subject: "Problem Solving", score: 70 },
  { subject: "Algorithms", score: 60 },
];

const weakTopics = [
  {
    name: "Neural Networks",
    score: 45,
    recommendations: [
      "Introduction to Neural Networks - 15 min",
      "Backpropagation Explained - 20 min",
      "Building Your First Neural Network - 30 min",
    ],
  },
  {
    name: "Deep Learning",
    score: 50,
    recommendations: [
      "Deep Learning Fundamentals - 25 min",
      "CNN Architecture - 18 min",
      "Transfer Learning Tutorial - 22 min",
    ],
  },
];

export function WeakAnalysisPage() {
  const averageScore = performanceData.reduce((acc, item) => acc + item.score, 0) / performanceData.length;

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              Weak Topic Analysis
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-[52px]">
            Identify areas for improvement and get personalized recommendations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <Target className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              {Math.round(averageScore)}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Topics Analyzed</span>
              <BookOpen className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div className="text-3xl font-bold">{performanceData.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Strong Topics</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">
              {performanceData.filter((item) => item.score >= 70).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Needs Work</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-500">
              {performanceData.filter((item) => item.score < 60).length}
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#6366f1]" />
              </div>
              Performance by Topic
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fill: "#71717a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141419",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#e4e4e7",
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.score >= 70 ? "#10b981" : entry.score >= 50 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#6366f1]" />
              </div>
              Skills Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#71717a", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a" }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Weak Topics with Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[#6366f1]" />
            </div>
            Topics That Need Attention
          </h3>

          {weakTopics.map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-xl font-semibold mb-2">{topic.name}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden max-w-xs">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.score}%` }}
                        transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                      />
                    </div>
                    <span className="text-sm font-medium text-red-500">{topic.score}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Recommended Learning Videos
                </h5>
                <div className="space-y-3">
                  {topic.recommendations.map((video, vidIndex) => (
                    <motion.button
                      key={vidIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 + vidIndex * 0.05 }}
                      className="w-full p-4 rounded-xl bg-background/50 border border-border/50 hover:border-[#6366f1]/50 hover:bg-accent transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Play className="w-5 h-5 text-[#6366f1]" />
                        </div>
                        <span className="font-medium">{video}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-2xl hover:shadow-[#6366f1]/30 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
            <BookOpen className="w-6 h-6" />
            Start Focused Learning Session
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}