import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);
const router = express.Router();

// Multer storage + upload limit (10MB)
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.post('/', upload.single('audio'), async (req, res) => {
  const start = Date.now(); // ⏱️ Track processing time

  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  const selectedLang = req.body.language || 'en'; // default to English
  const safeId = uuid();
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const originalPath = path.join(uploadsDir, req.file.filename);
  const mp3Path = path.join(uploadsDir, `transcript-ready-${safeId}.mp3`);
  const resultTxtPath = path.join(__dirname, '..', `result-${safeId}.txt`);

  try {
    const ext = path.extname(originalPath).toLowerCase();
    if (ext !== '.mp3') {
      await new Promise((resolve, reject) => {
        ffmpeg(originalPath)
          .outputOptions('-y')
          .audioCodec('libmp3lame')
          .on('end', resolve)
          .on('error', reject)
          .save(mp3Path);
      });
    } else {
      await fs.copyFile(originalPath, mp3Path);
    }

    const whisperPath = process.env.WHISPER_PATH || path.resolve('./whisper.cpp/build/bin/Release/whisper-cli.exe');
    const modelPath = selectedLang === 'en'
      ? path.resolve('./whisper.cpp/models/ggml-base.en.bin')
      : path.resolve('./whisper.cpp/models/ggml-base.bin');

    const whisperCmd = `"${whisperPath}" -m "${modelPath}" -f "${mp3Path}" -otxt -of result-${safeId} --language ${selectedLang}`;

    await new Promise((resolve, reject) => {
      exec(whisperCmd, { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
        if (err) {
          console.error('❌ Whisper Error:', stderr);
          reject(err);
        } else {
          console.log('✅ Transcription done');
          resolve(stdout);
        }
      });
    });

    let transcript = '';
    try {
      transcript = await fs.readFile(resultTxtPath, 'utf-8');
    } catch {
      throw new Error('❌ Could not read transcript');
    }

    // ❌ Guardrail for empty transcript
    if (!transcript.trim()) {
      return res.status(400).json({ message: 'Transcript is empty or unreadable.' });
    }

    const buildPrompt = (transcript) => `
If the transcript is not in English (e.g., Hindi, Tamil), translate it to English first. Then follow the instructions.
“Regenerate the same 3-part response, but rephrase in a different way using new examples where possible.”

1. Write 4 to 6 bullet points to explain the main ideas. Use short, simple sentences. Imagine you are teaching a 10-year-old.

2. Then create 5 flashcards. Each flashcard must include:
Question: [A short question]  
Answer: [A short, clear answer]

3. Then give a detailed explanation of the full transcript in simple language. Use very simple words, like you're explaining to a beginner.

Rules:
- Do not include any headings or labels
- Do not explain what you are doing
- Only write the content
- Keep everything clear and easy to understand
- Do not repeat or include these instructions in your response.
- Insert one blank line between each section (summary, flashcards, explanation).

Transcript:
${transcript}
`;
    const prompt = buildPrompt(transcript).trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => {
    controller.abort();
    console.error('❌ Ollama timed out after 30 seconds');
    }, 300000); // 30 seconds timeout


    let aiResponse = '';
    try {
       const response = await fetch('http://localhost:11434/v1/chat/completions', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
       model: 'phi',
       messages: [{ role: 'user', content: prompt }],
       temperature: 0.3
    }),
     signal: controller.signal
   });

  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Local LLM Error: ${text}`);
  }

   const data = await response.json();
   aiResponse = data.choices?.[0]?.message?.content?.trim() || '⚠️ Empty AI response.';
 } catch (error) {
  clearTimeout(timeout); // always clear timeout in catch
  console.error('🔴 AI Fetch Error:', error.message || error);

  // NEW: Tell frontend exactly why it failed
  if (!res.headersSent) {
    return res.status(500).json({
      message: 'AI processing failed. Ollama might be slow or unresponsive.',
      error: error.message || error.toString()
    });
  }
   return;
  }


    // Send final response
    if (!res.headersSent) {
      res.json({
        modelUsed: 'phi',
        transcript,
        ai_notes_and_flashcards: aiResponse,
        filePath: `/uploads/${req.file.filename}`
      });
    }

    // Cleanup files (use Promise.allSettled to prevent crash if any file is missing)
    await Promise.allSettled([
      fs.unlink(originalPath),
      fs.unlink(mp3Path),
      fs.unlink(resultTxtPath)
    ]);

    console.log(`⏱️ Total processing time: ${Date.now() - start}ms`);
  } catch (err) {
    console.error('🔴 Final Catch Error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error processing audio.' });
    }
  }
});

export default router;