const COMMON_ENGLISH = [
  "the", "a", "an", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "of", "in", "to", "for", "on", "with", "at", "by", "from", "as", "into",
  "through", "about", "between", "out", "off", "over", "under", "again", "then",
];

const cleanText = (rawText) => {
  let text = String(rawText || "");

  for (let i = 0; i < 3; i += 1) {
    const updated = text.replace(
      /\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g,
      (match) => match.replace(/\s+/g, ""),
    );
    if (updated === text) break;
    text = updated;
  }

  text = text.replace(/[^\x20-\x7E\n\t]/g, " ");

  text = text
    .replace(/(?<=[a-zA-Z])0(?=[a-zA-Z])/g, "o")
    .replace(/(?<=[a-zA-Z])1(?=[a-zA-Z])/g, "l")
    .replace(/(?<=[a-zA-Z])3(?=[a-zA-Z])/g, "e")
    .replace(/(?<=[a-zA-Z])5(?=[a-zA-Z])/g, "s");

  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  const removePatterns = [
    /all rights reserved/i,
    /copyright/i,
    /confidential/i,
    /www\.[a-z]+\.[a-z]+/i,
    /page \d+ of \d+/i,
    /^\s*figure \d+/i,
    /^\s*table \d+/i,
  ];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/^\s*\d+\s*$/.test(line))
    .filter((line) => line.trim().length >= 4)
    .filter((line) => !removePatterns.some((pattern) => pattern.test(line)));

  text = lines.join("\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
};

const validateText = (cleanedText, filename) => {
  if (cleanedText.length < 300) {
    throw new Error(
      `Not enough text could be extracted from your file (${filename}). The document may be mostly images, empty, or password-protected. Please try a text-based version of the document.`,
    );
  }

  const words = cleanedText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords < 50) {
    throw new Error(
      `Your document (${filename}) contains too little text to generate meaningful questions. Please upload a document with more written content.`,
    );
  }

  const longWords = words.filter((word) => word.length > 3).length;
  const meaningfulRatio = longWords / totalWords;
  if (meaningfulRatio < 0.4) {
    throw new Error(
      `The extracted text from ${filename} appears to be mostly noise or garbled characters. If this is a scanned document, please ensure the scan is clear and high resolution (300 DPI or above).`,
    );
  }

  const chunkMap = new Map();
  for (let i = 0; i < cleanedText.length; i += 100) {
    const chunk = cleanedText.slice(i, i + 100).trim().toLowerCase();
    if (!chunk) continue;
    chunkMap.set(chunk, (chunkMap.get(chunk) || 0) + 1);
  }

  const hasRepeatedChunk = [...chunkMap.values()].some((count) => count > 5);
  if (hasRepeatedChunk) {
    throw new Error(
      `Your document (${filename}) appears to contain mostly repeated content (headers, footers, or watermarks). Please upload the actual content pages.`,
    );
  }

  const englishWordCount = words.reduce((count, word) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
    return COMMON_ENGLISH.includes(normalized) ? count + 1 : count;
  }, 0);
  const englishRatio = englishWordCount / totalWords;

  if (englishRatio < 0.01) {
    throw new Error(
      `Your document (${filename}) does not appear to be in English or the text could not be read correctly. Currently only English documents are supported.`,
    );
  }

  const uniqueWords = new Set(
    words.map((word) => word.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean),
  ).size;
  const uniqueRatio = uniqueWords / totalWords;

  if (uniqueRatio < 0.1) {
    throw new Error(
      `Your document (${filename}) does not contain enough diverse content to generate varied questions.`,
    );
  }

  return cleanedText;
};

export const processExtractedText = async (rawText, filename) => {
  const cleaned = cleanText(rawText);
  console.log(`🧹 Text cleaned: ${String(rawText || "").length} → ${cleaned.length} chars`);

  let validated = validateText(cleaned, filename);

  if (validated.length > 10000) {
    console.warn(`⚠️ Cleaned text too long (${validated.length}). Truncating to 10000 characters.`);
    validated = validated.slice(0, 10000);
  }

  console.log("✅ Text validated: ready for quiz generation");
  return validated;
};
