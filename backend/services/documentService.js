import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import pdfPoppler from "pdf-poppler";
import mammoth from "mammoth";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";

const MIN_TEXT_LENGTH = 100;

const detectFileType = (filename) => {
  const lower = String(filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".pptx")) return "pptx";
  if (lower.endsWith(".ppt")) return "ppt";

  throw new Error(
    "Unsupported file type. Please upload PDF, TXT, Word, or PowerPoint files only.",
  );
};

const downloadToBuffer = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
};

const ensureMinText = (text, message) => {
  const cleaned = String(text || "").trim();
  if (cleaned.length < MIN_TEXT_LENGTH) {
    throw new Error(message);
  }
  return cleaned;
};

const extractFromTxt = async (buffer) => {
  const text = buffer.toString("utf-8").trim();
  return ensureMinText(text, "Text file appears empty.");
};

const extractFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return ensureMinText(
    result.value,
    "Word document appears empty or has no extractable text.",
  );
};

const extractFromDoc = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return ensureMinText(
      result.value,
      "Could not extract text from .doc file. Try saving it as .docx and re-uploading.",
    );
  } catch (_err) {
    throw new Error("Could not extract text from .doc file. Try saving it as .docx and re-uploading.");
  }
};

const extractSlideTextFromZip = (buffer) => {
  const zip = new AdmZip(buffer);
  const entries = zip
    .getEntries()
    .filter((entry) => /ppt\/slides\/slide[0-9]+\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

  const texts = entries.map((entry) =>
    entry
      .getData()
      .toString("utf-8")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  return texts.filter(Boolean).join("\n\n").trim();
};

const extractFromPptx = async (buffer) => {
  const text = extractSlideTextFromZip(buffer);
  return ensureMinText(
    text,
    "PowerPoint appears empty or has no text content in slides.",
  );
};

const extractFromPpt = async (buffer) => {
  try {
    const text = extractSlideTextFromZip(buffer);
    return ensureMinText(
      text,
      "Could not extract text from .ppt file. Try saving it as .pptx and re-uploading.",
    );
  } catch (_err) {
    throw new Error("Could not extract text from .ppt file. Try saving it as .pptx and re-uploading.");
  }
};

const extractWithPdfParse = async (pdfBuffer) => {
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    return result?.text || "";
  } finally {
    await parser.destroy();
  }
};

const extractWithOcr = async (pdfBuffer) => {
  let tempDir = null;

  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ocr-pdf-"));
    const inputPdfPath = path.join(tempDir, "input.pdf");
    fs.writeFileSync(inputPdfPath, pdfBuffer);

    const poppler = pdfPoppler?.default ?? pdfPoppler;
    await poppler.convert(inputPdfPath, {
      format: "png",
      out_dir: tempDir,
      out_prefix: "page",
      page: null,
    });

    const imageFiles = fs
      .readdirSync(tempDir)
      .filter((name) => name.startsWith("page") && name.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    if (!imageFiles.length) {
      throw new Error("OCR could not process this PDF. No page images were generated.");
    }

    console.log(`📄 Running OCR on ${imageFiles.length} page(s)...`);

    const pageTexts = await Promise.all(
      imageFiles.map(async (imageFile) => {
        const imagePath = path.join(tempDir, imageFile);
        const { data } = await Tesseract.recognize(imagePath, "eng", { logger: () => {} });
        return data?.text || "";
      }),
    );

    const finalText = pageTexts.join("\n\n").trim();
    if (finalText.length < MIN_TEXT_LENGTH) {
      throw new Error("OCR could not extract enough text. PDF may be too blurry or low quality.");
    }

    console.log(`✅ OCR complete — extracted ${finalText.length} characters`);
    return finalText;
  } finally {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
};

const extractFromPdf = async (buffer) => {
  let normalText = "";
  try {
    normalText = (await extractWithPdfParse(buffer)).trim();
  } catch (_err) {
    normalText = "";
  }

  if (normalText.length >= MIN_TEXT_LENGTH) {
    console.log("✅ Text extracted normally from PDF");
    return normalText;
  }

  console.log("⚠️ PDF appears image-based — switching to OCR");
  return extractWithOcr(buffer);
};

export const extractTextFromUrl = async (fileUrl, filename) => {
  const fileType = detectFileType(filename);
  console.log(`📄 Extracting text from ${fileType} file: ${filename}`);

  const buffer = await downloadToBuffer(fileUrl);

  let text = "";
  if (fileType === "pdf") text = await extractFromPdf(buffer);
  else if (fileType === "txt") text = await extractFromTxt(buffer);
  else if (fileType === "docx") text = await extractFromDocx(buffer);
  else if (fileType === "doc") text = await extractFromDoc(buffer);
  else if (fileType === "pptx") text = await extractFromPptx(buffer);
  else if (fileType === "ppt") text = await extractFromPpt(buffer);

  console.log(`✅ Extracted ${text.length} characters from ${filename}`);
  return text;
};
