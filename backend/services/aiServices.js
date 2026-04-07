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

const normalizeFlashcardPayload = (payload) => {
  const cards = Array.isArray(payload) ? payload : payload?.flashcards;
  if (!Array.isArray(cards)) {
    throw new Error("Gemini flashcard payload is not an array");
  }

  return cards
    .filter((item) => item?.front && item?.back)
    .map((item) => ({
      front: String(item.front),
      back: String(item.back),
      topic: String(item.topic || "General"),
    }));
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

export const generateQuiz = async (cleanedText) => {
  const prompt = `You are a quiz generator. Your ONLY job is to create 
multiple choice questions STRICTLY based on the text provided below.

STRICT RULES:
1. Every question MUST be directly answerable from the provided text
2. Do NOT use any outside knowledge — only what is in the text
3. If the text does not contain enough information for 10 questions, 
   generate fewer questions (minimum 3) rather than making things up
4. Each question must have exactly 4 options labeled A, B, C, D
5. The correct answer must be explicitly stated or clearly implied in the text
6. Topic label must be a concept name from the text (2-4 words max)
7. Return ONLY a valid JSON array — no explanation, no markdown, no backticks

JSON FORMAT (return exactly this structure):
[
  {
    "question": "question text here",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "correctAnswer": "A. option1",
    "topic": "Topic Name",
    "type": "conceptual"
  }
]

The "type" field must be one of: "conceptual" | "applied" | "factual"
- factual: asks for a specific fact stated in the text
- conceptual: asks about understanding a concept
- applied: asks how to use or apply something from the text

TEXT TO USE:
${cleanedText.slice(0, 10000)}

Remember: ONLY use information from the text above. 
If you cannot generate at least 3 valid questions from this text, 
return an empty array [].`;

  const raw = await callGemini(prompt);

  const stripped = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const jsonMatch = stripped.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid questions. Please try again.");
  }

  let questions;
  try {
    questions = JSON.parse(jsonMatch[0]);
  } catch (_parseErr) {
    throw new Error("AI response could not be parsed. Please try again.");
  }

  questions = questions.filter((q) =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.correctAnswer &&
    q.topic,
  );

  if (questions.length === 0) {
    throw new Error(
      "The AI could not generate valid questions from your document. The content may be too technical, too short, or not in a question-answerable format.",
    );
  }

  return questions;
};

export const generateDocumentSummary = async (documentText, filename = "document") => {
  const prompt = `You are an educational assistant.
Create a concise learning summary for the following study material.

Rules:
- 5 to 7 sentences
- Clear, student-friendly tone
- Focus on key concepts only
- Plain text only (no markdown)

Document name: ${filename}
Document text:
${documentText.slice(0, 12000)}`;

  const summary = await callGemini(prompt);
  const clean = summary.replace(/```/g, "").trim();

  if (clean.length < 80) {
    throw new Error("Gemini returned an unusable document summary");
  }

  return clean;
};

export const generateFlashcards = async (documentText) => {
  const prompt = `Based on the following text, generate 12 study flashcards.
Each flashcard must include front, back, and topic.
Return ONLY valid JSON (no markdown, no explanation).

Format:
[
  {
    "front": "Question/prompt",
    "back": "Concise answer",
    "topic": "Topic name"
  }
]

Text:
${documentText.slice(0, 12000)}`;

  const raw = await callGemini(prompt);
  const parsed = parseGeminiJson(raw);
  const flashcards = normalizeFlashcardPayload(parsed);

  if (!flashcards.length) {
    throw new Error("Gemini returned empty flashcard data");
  }

  return flashcards;
};

export const generateSummary = async (report) => {
  const prompt = `A student scored ${report.score}% on a quiz.
Strong topics: ${report.strongTopics.join(", ")}.
Weak topics: ${report.weakTopics.join(", ")}.
Learner type: ${report.learnerType}.
Write a short, encouraging 3-4 sentence report summary for the student.`;

  return callGemini(prompt);
};
