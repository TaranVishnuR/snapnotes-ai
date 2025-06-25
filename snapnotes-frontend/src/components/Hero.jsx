import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import FadeIn from './FadeIn';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMicrophone, FaStop, FaUpload, FaCheckCircle, FaTimesCircle,
  FaRedo, FaRobot, FaClipboard, FaBrain, FaFileAlt, FaSearch
} from 'react-icons/fa';

 // adjust path as needed

const HeroSection = styled.section`
  background: #f3f1ff;
  padding: 6rem 1rem;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const BotContainer = styled.div`
  font-size: 5rem;
  color: #5C33FF;
  margin: 0 auto 2rem auto;
  animation: ${props => props.$processing ? 'rotateRobot 1.2s linear infinite' : 'pulseGlow 2.5s ease-in-out infinite'};

  @keyframes pulseGlow {
    0%, 100% { text-shadow: 0 0 10px #c2aaff, 0 0 20px #b18eff; }
    50% { text-shadow: 0 0 20px #8f68ff, 0 0 30px #5C33FF; }
  }

  @keyframes rotateRobot {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: scale(1.1);  
  }
`;
 
const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #5C33FF;
`;

const Subtext = styled.p`
  font-size: 1.25rem;
  color: #555;
`;

const CTAButton = styled.button`
  padding: 1rem 2rem;
  background-color: ${props => (props.variant === 'ghost' ? 'white' : '#5C33FF')};
  color: ${props => (props.variant === 'ghost' ? '#5C33FF' : 'white')};
  border: ${props => (props.variant === 'ghost' ? '2px solid #5C33FF' : 'none')};
  font-weight: bold;
  border-radius: 8px;
  margin: 1rem 0.5rem;
  cursor: pointer;
  min-width: 160px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Icon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
`;

const StatusBox = styled.p`
  margin-top: 2rem;
  font-size: 1.1rem;
  color: #444;
`;

const NotesBox = styled.div`
  text-align: left;
  background: #fff;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
`;

const Flashcard = styled.details`
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
  background: #fdfdfd;
  summary {
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
`;

const TabButton = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${props => (props.$active ? '#5C33FF' : 'white')};
  color: ${props => (props.$active ? 'white' : '#5C33FF')};
  border: 2px solid #5C33FF;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Snackbar = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #323232;
  color: #fff;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1rem;
  z-index: 999;
  animation: fadein 0.3s, fadeout 0.3s 2.7s;
  @keyframes fadein { from {opacity: 0;} to {opacity: 1;} }
  @keyframes fadeout { from {opacity: 1;} to {opacity: 0;} }
`;

const Spinner = styled.div`
  margin: 2rem auto;
  border: 4px solid #ccc;
  border-top: 4px solid #5C33FF;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #ddd;
  overflow: hidden;
  border-radius: 6px;
  margin: 1rem auto;
  width: 80%;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: 40%;
    background: linear-gradient(90deg, #5C33FF, #B89CFF);
    animation: loading 1.5s linear infinite;
  }

  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
  }
`;

const WaveformContainer = styled.div`
  margin: 1rem auto;
  max-width: 600px;
  height: 100px;
`;

export default function Hero() {
  const [status, setStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [snack, setSnack] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isRecording, setIsRecording] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const isBusy = status === 'processing' || status === 'confirming';
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const fileInputRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackURL, setPlaybackURL] = useState(null);
  const [language, setLanguage] = useState('en');
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const statusMessages = [
  'machine is learning...',
  'going thorough your beautiful voice...',
  'Generating notes & flashcards...',
  'Analyzing your audio...',
  'Crafting clear explanations...',
  'Creating study-friendly flashcards...',
  'Summarizing concepts with AI...',
  'Processing your audio file...',
  'Preparing your personalized notes...',
  'Enhancing learning with AI insights...',
  'Finalizing your study materials...',
  'Almost there, hang tight...'  
   ];

  const resetUploadState = () => {
    setFile(null);
    setHasUploaded(false);
    setStatus('idle');
  };

  const showSnackbar = (msg) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recordedChunks.current = [];
    recorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    recorder.onstop = () => {
      const audioBlob = new Blob(recordedChunks.current, { type: 'audio/webm' });
      const namedFile = new File([audioBlob], 'recorded_audio.webm', { type: 'audio/webm' });
      setFile(namedFile);
      setHasUploaded(false);
      confirmUpload(namedFile);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    showSnackbar('Recording started...');
   } catch (err) {
    console.error(err);
    showSnackbar('Failed to access microphone');
    }
   };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showSnackbar('Recording stopped');
    }
  };

  const handleMicClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleUploadClick = () => {
    if (!isRecording) fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    if (!selected || !selected.type.startsWith('audio/')) {
      showSnackbar('Please upload a valid audio file.');
      return;
    }
    setFile(selected);
    setStatus('confirming');
    setHasUploaded(true);
    setPlaybackURL(URL.createObjectURL(selected));
  };

  const cancelUpload = () => {
    resetUploadState();
    showSnackbar('Upload cancelled.');
  };

  const confirmUpload = async (inputFile = file) => {
  if (!inputFile) return;

  setStatus('processing');
  setResult('');
  const rotateInterval = setInterval(() => {
    setStatusMessageIndex(prev => (prev + 1) % statusMessages.length);
  }, 3000);

  const formData = new FormData();
  formData.append('language', language);
  formData.append('audio', inputFile);

  const controller = new AbortController();
  setAbortController(controller);

  const startTime = Date.now(); // ⏱️ latency tracking

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal
      }
    );

    // 🛡️ Handle empty transcript case
    if (res.data.message === 'Transcript is empty or unreadable.') {
      showSnackbar('Audio too silent or unclear. Please try a louder/clearer recording.');
      resetUploadState();
      return;
    }

    setResult(res.data.ai_notes_and_flashcards?.trim() || '⚠️ Response was empty.');
    setStatus('done');
    setActiveTab('summary');

    const latency = Date.now() - startTime;
    console.log(`⏱️ Total processing time: ${latency}ms`); // 📈 latency log
    showSnackbar(`Notes ready! Processed in ${latency}ms`);

  } catch (error) {
    if (axios.isCancel(error)) {
      showSnackbar('Upload aborted.');
    } else if (error.response?.status === 413) {
      showSnackbar('File too large. Max 10MB allowed.');
    } else {
      console.error(error);
      showSnackbar('Upload failed. Try again.');
    }
    resetUploadState();
  } finally {
    setAbortController(null);
    clearInterval(rotateInterval);
  }
 };

  const stopProcess = () => {
    if (abortController) abortController.abort();
    resetUploadState();
    showSnackbar('Process cancelled. You can start a new one.');
  };

  useEffect(() => {
  let timer;
  if (isRecording) {
    setRecordingTime(0); // reset timer when starting
    timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }
  return () => clearInterval(timer); // cleanup when recording stops
 }, [isRecording]);

  useEffect(() => {
  if (playbackURL && waveformRef.current) {
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#ccc',
      progressColor: '#5C33FF',
      height: 100
    });
    wavesurfer.current.load(playbackURL);
  }

  return () => {
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }
  };
 }, [playbackURL]);

  const { summaryLines, flashcards } = (() => {
    if (!result) return { summaryLines: [], flashcards: [] };
    const rawLines = result.split('\n').map(l => l.trim()).filter(Boolean);
    const summaryLines = [], flashcards = [], seen = new Set();
    let currentQ = null;
    for (let line of rawLines) {
      if (/^[-•\d.]+\s*/.test(line)) {
        const point = line.replace(/^[-•\d.]+\s*/, '').trim();
        if (!seen.has(point)) {
          summaryLines.push(point);
          seen.add(point);
        }
      } else if (/^question[:：]/i.test(line)) {
        currentQ = { q: line.replace(/^question[:：]/i, '').trim(), a: '' };
      } else if (/^answer[:：]/i.test(line)) {
        if (currentQ) {
          currentQ.a = line.replace(/^answer[:：]/i, '').trim();
          flashcards.push(currentQ);
          currentQ = null;
        }
      } else if (currentQ && !currentQ.a) {
        currentQ.a = line;
        flashcards.push(currentQ);
        currentQ = null;
      }
    }
    return { summaryLines, flashcards };
  })();

  const handleCopy = () => {
    const text = [
      'Summary:',
      ...summaryLines.map(line => `• ${line}`),
      '',
      'Flashcards:',
      ...flashcards.map((fc, i) => `Q${i + 1}: ${fc.q}\nA: ${fc.a}`)
    ].join('\n');
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard');
  };

  return (
  <FadeIn>
    <HeroSection>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.0 }}
      >
        <BotContainer $processing={status === 'processing'} style={{ color: isRecording ? 'red' : '#5C33FF' }}>
          <FaRobot />
        </BotContainer>
      </motion.div>

      <HeroContent>
        <Title>Hear it. Learn it. Snap it.</Title>
        <Subtext>
          Turn classroom audio into clear, AI-generated notes and smart flashcards — instantly.
        </Subtext>

        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <CTAButton onClick={handleMicClick} disabled={status === 'processing' || status === 'confirming'}>
            <Icon>{isRecording ? <FaStop /> : <FaMicrophone />}</Icon>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </CTAButton>

          <CTAButton
            variant="ghost"
            onClick={handleUploadClick}
            disabled={isRecording || status === 'processing' || status === 'confirming'}
          >
            <Icon><FaUpload /></Icon> Upload Audio File
          </CTAButton>

          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {isRecording && (
          <p style={{ color: '#5C33FF', fontWeight: 'bold', marginTop: '1rem' }}>
              Recording Time: {Math.floor(recordingTime / 60)}:{('0' + (recordingTime % 60)).slice(-2)}
           </p>
         )}

           {playbackURL && (
                  <audio controls style={{ marginTop: '1rem' }}>
                 <source src={playbackURL} type="audio/webm" />
                 Your browser does not support the audio element.
                </audio>
               )}

         <div style={{ marginTop: '1rem' }}>
           <label style={{ marginRight: '0.5rem' }}><FaSearch /> Language:</label>
         <select
             value={language}
             onChange={(e) => setLanguage(e.target.value)}
             style={{ padding: '0.5rem', borderRadius: '5px' }}
         >
             <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
           </select>
         </div>

        </div>
      </HeroContent>

      {isRecording && <WaveformContainer ref={waveformRef} />}

      {status === 'confirming' && file && (
        <div style={{ marginTop: '1.5rem' }}>
          <p>File selected: {file.name}</p>
          <CTAButton onClick={() => confirmUpload(file)}><FaCheckCircle /> Confirm Upload</CTAButton>
          <CTAButton variant="ghost" onClick={cancelUpload}><FaTimesCircle /> Cancel</CTAButton>
        </div>
      )}

      {status === 'processing' && (
        <div style={{ marginTop: '2rem' }}>
          <ProgressBar />
          <StatusBox>
            <FaRobot /> {statusMessages[statusMessageIndex]}
          </StatusBox>

          <CTAButton variant="ghost" onClick={stopProcess}><FaStop /> Stop</CTAButton>
        </div>
      )}

      {status === 'done' && (
        <>
          <StatusBox><FaCheckCircle /> Done!</StatusBox>
          <TabContainer>
            <TabButton
                $active={activeTab === 'summary'}
                onClick={() => !isBusy && setActiveTab('summary')}
                disabled={isBusy}>
              <FaClipboard /> Summary
            </TabButton>
            <TabButton
               $active={activeTab === 'raw'}
               onClick={() => !isBusy && setActiveTab('raw')}
               disabled={isBusy}
            >

              <FaFileAlt /> Raw Explanation
            </TabButton>
          </TabContainer>

          <NotesBox>
            <AnimatePresence mode="wait">
              {activeTab === 'summary' && (
                <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
                </motion.div>
              )}
              {activeTab === 'raw' && (
                <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </NotesBox>

          <div style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <CTAButton onClick={handleCopy}><FaClipboard /> Copy All Notes</CTAButton>
            <CTAButton onClick={() => { setResult(''); confirmUpload(file); }}><FaRedo /> Regenerate</CTAButton>
            <CTAButton variant="ghost" onClick={resetUploadState}><FaRedo /> Start New</CTAButton>
          </div>
        </>
      )}

      {snack && (
        <Snackbar><FaCheckCircle style={{ marginRight: '8px' }} /> {snack}</Snackbar>
      )}
    </HeroSection>
  </FadeIn>
);
}