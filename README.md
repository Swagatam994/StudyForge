📖 What is StudyForge?

StudyForge is not just a quiz generator. It is a personalized learning intelligence system that:

Transforms any document (PDF, Word, PowerPoint, TXT) into an adaptive quiz
Measures your cognitive behavior during the quiz — not just what you got wrong, but why your brain failed
Detects your specific learning failure pattern using DeepSeek-R1 reasoning AI
Builds a day-by-day study plan calibrated to your exact weaknesses using NVIDIA Nemotron
Schedules spaced repetition reviews based on the Ebbinghaus Forgetting Curve
Sends email reminders before you forget what you studied
Tracks your memory decay in real time with a visual graph


"Every other quiz app tells you what you got wrong. We tell you WHY your brain fails — and fix it automatically."

✨ Features
📄 Multi-Format Document Processing

Supports PDF, DOCX, DOC, PPTX, PPT, TXT — any document, not just PDFs
Smart OCR fallback using Tesseract.js for scanned/image-based PDFs
Handwriting recognition via Google Vision API
Text cleaning and validation pipeline — no nonsense questions from bad text

🎯 AI-Powered Quiz Generation

Questions generated strictly from your document — no hallucinated content
Three question types: Conceptual, Applied, Factual
Automatic difficulty tagging per question
Gemini 2.5 Flash as primary with NVIDIA Llama 3.3 as intelligent fallback
Minimum 3, maximum 10 questions with strict JSON validation

🧠 Cognitive Failure Fingerprinting (Powered by DeepSeek-R1)
Detects one of 6 cognitive failure patterns per weak topic

 📅AI Study Plan Generator (Powered by NVIDIA Nemotron)

Enter your exam date → get a complete day-by-day plan
Weak topics get 70% of study days, strong topics get 30% maintenance
Study tasks calibrated to each topic's cognitive failure pattern

🔐 Authentication

Email/password registration with bcrypt hashing
Google OAuth via one-click login
JWT tokens with automatic expiry handling
Account linking — Google and manual accounts merged if same email
