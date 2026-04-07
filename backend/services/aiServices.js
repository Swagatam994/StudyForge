import axios from "axios";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const AI_HTTP_TIMEOUT_MS = Number(process.env.AI_HTTP_TIMEOUT_MS || 25000);
const MAX_JSON_RETRY = Number(process.env.AI_JSON_RETRY || 2);

const NVIDIA_MODELS = {
  reasoning: process.env.NVIDIA_REASONING_MODEL || "deepseek-ai/deepseek-r1-distill-llama-8b",
  studyPlan: process.env.NVIDIA_STUDYPLAN_MODEL || "nvidia/nemotron-super-49b-v1",
  fallbackFast: process.env.NVIDIA_FAST_MODEL || "deepseek-ai/deepseek-r1-distill-llama-8b",
  fallbackLarge: process.env.NVIDIA_LARGE_MODEL || "meta/llama-3.3-70b-instruct",
};

const STRICT_JSON_SUFFIX = `

IMPORTANT:
- Return ONLY valid JSON.
- No markdown.
- No code fences.
- No text before or after the JSON.`;

const toUniqueModels = (models) => {
  const seen = new Set();
  const ordered = [];

  for (const model of models || []) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    ordered.push(model);
  }

  return ordered;
};

const isRetryableNvidiaError = (error) => {
  const status = Number(error?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  if ([408, 410, 429, 500, 502, 503, 504].includes(status)) return true;
  if (["ECONNABORTED", "ETIMEDOUT", "ECONNRESET"].includes(code)) return true;
  if (message.includes("timeout") || message.includes("timed out")) return true;

  return false;
};

const callGemini = async (prompt, expectJson = false) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend environment");
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (expectJson) {
    payload.generationConfig = { responseMimeType: "application/json" };
  }

  let response;
  try {
    response = await axios.post(GEMINI_URL, payload, { timeout: AI_HTTP_TIMEOUT_MS });
  } catch (error) {
    const status = error?.response?.status;
    const detail =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown Gemini error";

    const wrapped = new Error(`Gemini API error (${status || "unknown"}): ${detail}`);
    wrapped.status = status;
    wrapped.code = error?.code;
    throw wrapped;
  }

  const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini did not return a valid response.");
  }

  return text;
};

const callNvidia = async (prompt, model, maxTokens = 1200, temperature = 0.2) => {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is missing in backend environment");
  }

  let response;
  try {
    response = await axios.post(
      `${NVIDIA_BASE}/chat/completions`,
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: AI_HTTP_TIMEOUT_MS,
      },
    );
  } catch (error) {
    const status = error?.response?.status;
    const detail =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown NVIDIA error";

    const wrapped = new Error(`NVIDIA API error (${status || "unknown"}) [${model}]: ${detail}`);
    wrapped.status = status;
    wrapped.code = error?.code;
    wrapped.model = model;
    throw wrapped;
  }

  const content = response?.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`NVIDIA NIM did not return a valid response for model ${model}.`);
  }

  return content;
};

const callNvidiaWithFallback = async (prompt, models, maxTokens = 1200, temperature = 0.2) => {
  const orderedModels = toUniqueModels(models);
  let lastError = null;

  for (let i = 0; i < orderedModels.length; i += 1) {
    const model = orderedModels[i];

    try {
      const content = await callNvidia(prompt, model, maxTokens, temperature);
      return { content, model };
    } catch (error) {
      lastError = error;

      if (i < orderedModels.length - 1 && isRetryableNvidiaError(error)) {
        console.warn(`⚠️ NVIDIA model ${model} failed (${error.message}). Trying next model...`);
        continue;
      }

      if (i < orderedModels.length - 1) {
        console.warn(`⚠️ NVIDIA model ${model} failed. Trying next model...`);
        continue;
      }
    }
  }

  throw lastError || new Error("All NVIDIA models failed.");
};

const parseJsonSafely = (raw) => {
  const stripped = String(raw || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();

  const normalizeCandidate = (value) => {
    const base = String(value || "")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();

    return base
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null")
      .replace(/\bNaN\b/g, "null");
  };

  const quoteUnquotedKeys = (value) =>
    value.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');

  const singleToDoubleQuotedJson = (value) =>
    value
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => `"${content.replace(/"/g, '\\"')}"`);

  const tryParse = (value) => {
    const variants = [
      normalizeCandidate(value),
      quoteUnquotedKeys(normalizeCandidate(value)),
      singleToDoubleQuotedJson(quoteUnquotedKeys(normalizeCandidate(value))),
    ];

    for (const candidate of variants) {
      try {
        return JSON.parse(candidate);
      } catch {
        // try next repaired variant
      }
    }

    try {
      return JSON.parse(normalizeCandidate(value));
    } catch {
      return null;
    }
  };

  const direct = tryParse(stripped);
  if (direct !== null) return direct;

  const extractBalanced = (text, startIndex) => {
    const opening = text[startIndex];
    const expectedClose = opening === "[" ? "]" : "}";
    const stack = [expectedClose];
    let inString = false;
    let escaped = false;

    for (let i = startIndex + 1; i < text.length; i += 1) {
      const ch = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === "\"") {
          inString = false;
        }
        continue;
      }

      if (ch === "\"") {
        inString = true;
        continue;
      }

      if (ch === "{") stack.push("}");
      if (ch === "[") stack.push("]");

      if ((ch === "}" || ch === "]") && stack.length && ch === stack[stack.length - 1]) {
        stack.pop();
        if (!stack.length) {
          return text.slice(startIndex, i + 1);
        }
      }
    }

    return null;
  };

  for (let i = 0; i < stripped.length; i += 1) {
    if (stripped[i] !== "{" && stripped[i] !== "[") continue;
    const candidate = extractBalanced(stripped, i);
    if (!candidate) continue;
    const parsed = tryParse(candidate);
    if (parsed !== null) return parsed;
  }

  throw new Error("AI response could not be parsed. Please try again.");
};

const parseJsonWithRetry = async (runner, prompt, attempts = MAX_JSON_RETRY) => {
  let lastError;

  for (let i = 0; i < Math.max(1, attempts); i += 1) {
    const attemptPrompt = i === 0 ? prompt : `${prompt}${STRICT_JSON_SUFFIX}`;
    const raw = await runner(attemptPrompt);

    try {
      return parseJsonSafely(raw);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("AI response could not be parsed. Please try again.");
};

const parseNvidiaJsonWithFallback = async (prompt, models, maxTokens, temperature) => {
  let lastError;

  for (let i = 0; i < Math.max(1, MAX_JSON_RETRY); i += 1) {
    const attemptPrompt = i === 0 ? prompt : `${prompt}${STRICT_JSON_SUFFIX}`;

    try {
      const { content, model } = await callNvidiaWithFallback(
        attemptPrompt,
        models,
        maxTokens,
        temperature,
      );
      const parsed = parseJsonSafely(content);
      return { parsed, model };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("AI response could not be parsed. Please try again.");
};

const normalizeQuestions = (payload) => {
  const source = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(source)) return [];

  return source
    .filter((q) =>
      q?.question &&
      Array.isArray(q?.options) &&
      q.options.length === 4 &&
      q?.correctAnswer &&
      q?.topic,
    )
    .map((q) => ({
      question: String(q.question),
      options: q.options.map((o) => String(o)).slice(0, 4),
      correctAnswer: String(q.correctAnswer),
      topic: String(q.topic),
      type: ["conceptual", "applied", "factual"].includes(String(q.type || "").toLowerCase())
        ? String(q.type).toLowerCase()
        : "conceptual",
    }));
};

const extractStudyPlanArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const directKeys = [
    "days",
    "plan",
    "studyPlan",
    "study_plan",
    "schedule",
    "dailyPlan",
    "daily_plan",
    "items",
  ];

  for (const key of directKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  const firstArrayValue = Object.values(payload).find((value) => Array.isArray(value));
  if (Array.isArray(firstArrayValue)) {
    return firstArrayValue;
  }

  return [];
};

const normalizeStudyPlanDays = (days) => {
  return (days || [])
    .map((item, index) => ({
      day: Number(item?.day ?? index + 1),
      date: String(item?.date || ""),
      type: String(item?.type || "study").toLowerCase(),
      topic: String(item?.topic || item?.title || "General Review"),
      tasks: Array.isArray(item?.tasks)
        ? item.tasks.map((task) => String(task))
        : item?.tasks
          ? [String(item.tasks)]
          : [],
      goal: String(item?.goal || item?.objective || "Make progress in this topic"),
      estimatedHours: Number(item?.estimatedHours ?? item?.hours ?? 2),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.day) &&
        item.day > 0 &&
        ["study", "review", "rest"].includes(item.type) &&
        item.topic &&
        item.goal,
    );
};

const formatYmd = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildRuleBasedStudyPlan = (report, examDate, daysUntilExam) => {
  const weakTopics = Array.isArray(report?.weakTopics) ? report.weakTopics.filter(Boolean) : [];
  const strongTopics = Array.isArray(report?.strongTopics) ? report.strongTopics.filter(Boolean) : [];

  const weakPool = weakTopics.length ? weakTopics : ["Core Weak Concepts"];
  const strongPool = strongTopics.length ? strongTopics : ["General Revision"];

  let weakIndex = 0;
  let strongIndex = 0;
  let activeIndex = 0;

  const pickWeak = () => {
    const topic = weakPool[weakIndex % weakPool.length];
    weakIndex += 1;
    return topic;
  };

  const pickStrong = () => {
    const topic = strongPool[strongIndex % strongPool.length];
    strongIndex += 1;
    return topic;
  };

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const plan = [];

  for (let day = 1; day <= daysUntilExam; day += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);

    const isLastTwoDays = day >= daysUntilExam - 1;
    const isRestCycleDay = day % 4 === 0 && !isLastTwoDays;

    if (isLastTwoDays) {
      const topic = day === daysUntilExam ? "Pre-Exam Rest and Recall" : "Light Mixed Review";
      plan.push({
        day,
        date: formatYmd(date),
        type: day === daysUntilExam ? "rest" : "review",
        topic,
        tasks:
          day === daysUntilExam
            ? [
                "Take a short walk and relax your mind.",
                "Review only one-page notes for key formulas/concepts.",
              ]
            : [
                "Quickly revise weak-topic summary notes.",
                "Solve 8-10 mixed questions without time pressure.",
              ],
        goal:
          day === daysUntilExam
            ? "Stay calm and mentally fresh for the exam."
            : "Consolidate memory without cognitive overload.",
        estimatedHours: day === daysUntilExam ? 1 : 1.5,
      });
      continue;
    }

    if (isRestCycleDay) {
      plan.push({
        day,
        date: formatYmd(date),
        type: "rest",
        topic: "Rest Day",
        tasks: [
          "Take a complete break from heavy study.",
          "Do a 10-minute light recap only if needed.",
        ],
        goal: "Recover and prevent burnout.",
        estimatedHours: 0.5,
      });
      continue;
    }

    const shouldFocusWeak = activeIndex % 10 < 7 || !strongTopics.length;
    activeIndex += 1;

    const topic = shouldFocusWeak ? pickWeak() : pickStrong();

    plan.push({
      day,
      date: formatYmd(date),
      type: shouldFocusWeak ? "study" : "review",
      topic,
      tasks: shouldFocusWeak
        ? [
            `Read and summarize ${topic} in your own words.`,
            `Practice 12 focused questions on ${topic}.`,
          ]
        : [
            `Revise key notes for ${topic}.`,
            `Solve 6 mixed maintenance questions for ${topic}.`,
          ],
      goal: shouldFocusWeak
        ? `Strengthen understanding and recall of ${topic}.`
        : `Maintain confidence in ${topic} while prioritizing weak areas.`,
      estimatedHours: shouldFocusWeak ? 2 : 1.5,
    });
  }

  console.log(`📅 Study plan generated via local fallback: ${plan.length} days`);
  return plan;
};

export const generateQuiz = async (text) => {
  const prompt = `You are a quiz generator. Generate questions STRICTLY from this text only.

STRICT RULES:
1. Every question MUST be answerable from the provided text only
2. Do NOT use outside knowledge
3. Generate minimum 3, maximum 10 questions
4. Each question has exactly 4 options labeled A, B, C, D
5. The "type" field must be: "conceptual" | "applied" | "factual"
6. Topic label must be 2-4 words max from the text
7. Return ONLY valid JSON array, no markdown, no explanation

FORMAT:
[{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A. ...",
  "topic": "Topic Name",
  "type": "conceptual"
}]

TEXT:
${String(text || "").slice(0, 7000)}`;

  try {
    const parsed = await parseJsonWithRetry((p) => callGemini(p, true), prompt);
    const questions = normalizeQuestions(parsed);

    if (!questions.length) {
      throw new Error("No valid questions generated from Gemini response.");
    }

    console.log("✅ Quiz generated via Gemini");
    return questions;
  } catch (geminiErr) {
    console.warn("⚠️ Gemini unavailable/rate-limited. Falling back to NVIDIA NIM...");

    const { parsed, model } = await parseNvidiaJsonWithFallback(
      prompt,
      [NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
      1500,
      0.2,
    );
    const questions = normalizeQuestions(parsed);

    if (!questions.length) {
      throw new Error("AI could not generate valid quiz questions from this document.");
    }

    console.log(`✅ Quiz generated via NVIDIA NIM (${model})`);
    return questions;
  }
};

export const generateSummary = async (report) => {
  const prompt = `A student scored ${report.score}% on a quiz.
Strong topics: ${(report.strongTopics || []).join(", ")}.
Weak topics: ${(report.weakTopics || []).join(", ")}.
Learner type: ${report.learnerType}.
Write a short encouraging 3-4 sentence summary for the student.
Be specific about their strong and weak areas.`;

  try {
    const output = await callGemini(prompt, false);
    console.log("✅ Summary generated via Gemini");
    return output.trim();
  } catch (_geminiErr) {
    const { content, model } = await callNvidiaWithFallback(
      prompt,
      [NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
      260,
      0.2,
    );
    console.log(`✅ Summary generated via NVIDIA NIM (${model})`);
    return String(content).trim();
  }
};

export const analyzeCognitiveFailure = async (answers, topicName) => {
  const prompt = `You are a cognitive learning analyst. Analyze these quiz answers for 
the topic "${topicName}" and identify the exact cognitive failure pattern.

ANSWERS DATA:
${JSON.stringify(
  (answers || []).map((a) => ({
    question: a.question,
    userAnswer: a.userAnswer,
    correctAnswer: a.correctAnswer,
    isCorrect: a.isCorrect,
    confidence: a.confidence || "unknown",
    timeTaken: a.timeTaken || "unknown",
  })),
)}

COGNITIVE PATTERNS (pick exactly ONE):
- ILLUSION_OF_KNOWING: Student was confident but answered wrong repeatedly
- INTERFERENCE: Student confused this topic with a similar concept
- ENCODING_FAILURE: Student never understood this — answers are random/guessing
- RETRIEVAL_FAILURE: Student answered too fast and got it wrong (knew but panicked)
- TRANSFER_FAILURE: Student knows theory but fails applied/scenario questions
- COGNITIVE_OVERLOAD: Performance declined over time — too many concepts at once
- STRONG: Student consistently answered correctly

RETURN ONLY this JSON (no explanation, no markdown):
{
  "pattern": "PATTERN_NAME",
  "confidence": 0.85,
  "reason": "2-3 sentence explanation of why this pattern was detected",
  "intervention": "Specific actionable exercise to fix this pattern",
  "estimatedFixTime": "e.g. 2-3 focused study sessions"
}`;

  const { parsed, model } = await parseNvidiaJsonWithFallback(
    prompt,
    [NVIDIA_MODELS.reasoning, NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
    500,
    0.1,
  );

  if (!parsed || Array.isArray(parsed) || !parsed.pattern || !parsed.reason || !parsed.intervention) {
    throw new Error("Cognitive analysis response missing required fields.");
  }

  console.log(`🧠 Cognitive analysis complete via ${model}: ${parsed.pattern}`);
  return parsed;
};

export const generateStudyPlan = async (report, examDate) => {
  const exam = new Date(examDate);
  const now = new Date();
  const daysUntilExam = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExam < 1) {
    throw new Error("Exam date must be in the future.");
  }

  const planMaxTokens = Math.min(6000, Math.max(2000, daysUntilExam * 120));

  const prompt = `Create a structured ${daysUntilExam}-day study plan for a student.

STUDENT PROFILE:
- Learner Type: ${report.learnerType}
- Weak Topics (priority): ${(report.weakTopics || []).join(", ")}
- Strong Topics (maintain): ${(report.strongTopics || []).join(", ")}
- Days until exam: ${daysUntilExam}

RULES:
1. Weak topics get 70% of study days
2. Strong topics get 30% maintenance review
3. Include one rest day every 4 days
4. Each day has 1-2 topics maximum (prevent overload)
5. Include specific tasks not just topic names
6. Last 2 days before exam = light review + rest only

RETURN ONLY this JSON array (no markdown):
[{
  "day": 1,
  "date": "YYYY-MM-DD",
  "type": "study | review | rest",
  "topic": "Topic Name or Rest Day",
  "tasks": ["specific task 1", "specific task 2"],
  "goal": "what student should achieve today",
  "estimatedHours": 2
}]`;

  let parsed;
  let model = "local-fallback";

  try {
    const result = await parseNvidiaJsonWithFallback(
      prompt,
      [NVIDIA_MODELS.studyPlan, NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
      planMaxTokens,
      0.25,
    );
    parsed = result.parsed;
    model = result.model;
  } catch (err) {
    console.warn(`⚠️ All NVIDIA models failed for study plan. Falling back to local planner. Reason: ${err.message}`);
    return buildRuleBasedStudyPlan(report, examDate, daysUntilExam);
  }

  const extractedDays = extractStudyPlanArray(parsed);
  const validDays = normalizeStudyPlanDays(extractedDays);

  if (!validDays.length) {
    console.warn("⚠️ NVIDIA returned invalid study plan shape. Falling back to local planner.");
    return buildRuleBasedStudyPlan(report, examDate, daysUntilExam);
  }

  console.log(`📅 Study plan generated via ${model}: ${validDays.length} days`);
  return validDays;
};

export const generateIntervention = async (pattern, topicName, weakAnswers) => {
  const prompt = `A student has the cognitive pattern "${pattern}" for the topic "${topicName}".

Their wrong answers were:
${(weakAnswers || [])
  .map((a) => `Q: ${a.question} | Their answer: ${a.userAnswer} | Correct: ${a.correctAnswer}`)
  .join("\n")}

Generate a highly specific intervention exercise to fix this exact pattern.
The intervention must be something the student can do RIGHT NOW in 10-15 minutes.

RETURN ONLY this JSON:
{
  "title": "Exercise title",
  "instructions": "Step by step instructions (3-5 steps)",
  "exercise": "The actual exercise content — questions, prompts, or tasks",
  "successCriteria": "How student knows they completed it successfully",
  "followUpIn": "When to check again e.g. 24 hours"
}`;

  const { parsed } = await parseNvidiaJsonWithFallback(
    prompt,
    [NVIDIA_MODELS.reasoning, NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
    700,
    0.2,
  );

  if (!parsed || Array.isArray(parsed) || !parsed.title || !parsed.instructions || !parsed.exercise) {
    throw new Error("Intervention response missing required fields.");
  }

  return parsed;
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
${String(documentText || "").slice(0, 8000)}`;

  try {
    const summary = await callGemini(prompt, false);
    return summary.replace(/```/g, "").trim();
  } catch (_err) {
    const { content } = await callNvidiaWithFallback(
      prompt,
      [NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
      380,
      0.2,
    );
    return String(content).replace(/```/g, "").trim();
  }
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
${String(documentText || "").slice(0, 8000)}`;

  let parsed;
  try {
    parsed = await parseJsonWithRetry((p) => callGemini(p, true), prompt);
  } catch (_err) {
    const nvidiaResult = await parseNvidiaJsonWithFallback(
      prompt,
      [NVIDIA_MODELS.fallbackFast, NVIDIA_MODELS.fallbackLarge],
      1500,
      0.2,
    );
    parsed = nvidiaResult.parsed;
  }

  const cards = Array.isArray(parsed) ? parsed : parsed?.flashcards;

  if (!Array.isArray(cards)) {
    throw new Error("AI did not return a valid flashcards array.");
  }

  const normalized = cards
    .filter((item) => item?.front && item?.back)
    .map((item) => ({
      front: String(item.front),
      back: String(item.back),
      topic: String(item.topic || "General"),
    }));

  if (!normalized.length) {
    throw new Error("AI returned empty flashcard data.");
  }

  return normalized;
};

export { NVIDIA_MODELS };
