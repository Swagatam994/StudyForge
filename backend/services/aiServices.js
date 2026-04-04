import axios from "axios";

const getGeminiUrl = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in backend environment");
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
};

const callGemini = async (prompt) => {
  let response;
  try {
    response = await axios.post(getGeminiUrl(), {
      contents: [{ parts: [{ text: prompt }] }],
    });
  } catch (error) {
    const apiMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message;

    if (apiMessage) {
      throw new Error(`Gemini API error: ${apiMessage}`);
    }

    throw error;
  }

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini did not return any content");
  }

  return text;
};

const normalizeQuizPayload = (payload) => {
  const questions = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(questions)) {
    throw new Error("Gemini quiz payload is not an array");
  }

  return questions
    .filter((item) => item?.question && Array.isArray(item?.options) && item?.correctAnswer)
    .map((item) => ({
      question: String(item.question),
      options: item.options.map((option) => String(option)).slice(0, 4),
      correctAnswer: String(item.correctAnswer),
      topic: String(item.topic || "General"),
    }))
    .filter((item) => item.options.length === 4);
};

const parseGeminiJson = (raw) => {
  const clean = raw.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(clean);
  } catch (_error) {
    const match = clean.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini did not return valid JSON");
    }
    return JSON.parse(match[0]);
  }
};

export const generateQuiz = async (pdfText) => {
  const prompt = `Based on the following text, generate 10 multiple choice questions.
Each question must have exactly 4 options (A, B, C, D), a correct answer, and a topic label.
Return ONLY valid JSON (no markdown, no explanation).

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
${pdfText.slice(0, 12000)}`;

  const raw = await callGemini(prompt);
  const parsed = parseGeminiJson(raw);
  const questions = normalizeQuizPayload(parsed);

  if (!questions.length) {
    throw new Error("Gemini returned empty quiz data");
  }

  return questions;
};

export const generateSummary = async (report) => {
  const prompt = `A student scored ${report.score}% on a quiz.
Strong topics: ${report.strongTopics.join(", ")}.
Weak topics: ${report.weakTopics.join(", ")}.
Learner type: ${report.learnerType}.
Write a short, encouraging 3-4 sentence report summary for the student.`;

  return callGemini(prompt);
};
