import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import pdfPoppler from "pdf-poppler";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

const MIN_TEXT_LENGTH = 100;

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

export const extractTextFromUrl = async (pdfUrl) => {
  const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
  const pdfBuffer = Buffer.from(response.data);

  let normalText = "";
  try {
    normalText = (await extractWithPdfParse(pdfBuffer)).trim();
  } catch (_err) {
    normalText = "";
  }

  if (normalText.length >= MIN_TEXT_LENGTH) {
    console.log("✅ Text extracted normally from PDF");
    return normalText;
  }

  console.log("⚠️ PDF appears image-based — switching to OCR");
  return extractWithOcr(pdfBuffer);
};
