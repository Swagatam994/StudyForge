// services/aiService.js
const axios = require("axios");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const callGemini = async (prompt) => {
  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
  });
  return response.data.candidates[0].content.parts[0].text;
};

// Generate quiz from PDF text
export const generateQuiz = async (pdfText) => {
  const prompt = `Based on the following text, generate 10 multiple choice questions.
Each question must have exactly 4 options (A, B, C, D), a correct answer, and a topic label.
Return ONLY a valid JSON array. No explanation, no markdown, no backticks.

Format:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A. ...",
    "topic": "Topic Name"
  }
]

Text:
${pdfText.slice(0, 8000)}`;

  const raw = await callGemini(prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// Generate summary for report
export const generateSummary = async (report) => {
  const prompt = `A student scored ${report.score}% on a quiz.
Strong topics: ${report.strongTopics.join(", ")}.
Weak topics: ${report.weakTopics.join(", ")}.
Learner type: ${report.learnerType}.
Write a short, encouraging 3-4 sentence report summary for the student.`;

  return await callGemini(prompt);
};
