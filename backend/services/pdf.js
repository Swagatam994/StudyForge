import { pdfParse } from "pdf-parse";
import axios from "axios";

export const extractTextFromUrl = async (pdfUrl) => {
  const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
  const data = await pdfParse(Buffer.from(response.data));
  return data.text;
};