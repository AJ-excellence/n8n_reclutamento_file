import React, { useCallback, useState, useEffect } from 'react';
import { VoiceSphere } from './components/VoiceSphere';
import { StatusMessage } from './components/StatusMessage';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { X, RefreshCw } from 'lucide-react';

const WEBHOOK_TIMEOUT = 180000; // 180 seconds (3 min)
const WEBHOOK_URL = 'https://michelangelo.app.n8n.cloud/webhook-test/a52b9ba3-f292-4aa3-89a6-42e813a2bcd6';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function generateSessionId(): string {
  return Math.random().toString().slice(2, 14);
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3'
  };
  return extensions[mimeType] || 'webm';
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries: number = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries > 0 && !options.signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

function App() {
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
  
  const { voiceState, error, toggleRecording, setVoiceState, setError } = useVoiceRecorder(
    useCallback(async (audioBlob: Blob) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

        // Generate filename with timestamp and proper extension
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = getFileExtension(audioBlob.type);
        const filename = `voice-recording-${timestamp}.${extension}`;

        // Create FormData to properly send the file with filename and session ID
        const formData = new FormData();
        formData.append('audio', audioBlob, filename);
        formData.append('sessionId', sessionId);

        // Log the audio format being sent
        console.log('Sending audio file:', filename);
        console.log('Audio type:', audioBlob.type);
        console.log('Audio size:', audioBlob.size, 'bytes');
        console.log('Session ID:', sessionId);

        const response = await fetchWithRetry(
          WEBHOOK_URL,
          {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const audioResponse = await response.blob();
        const audio = new Audio(URL.createObjectURL(audioResponse));
        
        // Set playing state when audio starts
        setVoiceState('playing');
        
        // Listen for audio end
        audio.addEventListener('ended', () => {
          setVoiceState('idle');
        });
        
        await audio.play();
      } catch (err) {
        let errorMessage = 'Failed to process audio. ';
        
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage += 'Request timed out. Please try again.';
          } else if (err.message.includes('Server error')) {
            errorMessage += 'The server is not responding correctly. Please try again later.';
          } else {
            errorMessage += 'Please check your internet connection and try again.';
          }
        }

        console.error('Error processing audio:', err instanceof Error ? err.message : err);
        setError(errorMessage);
        setVoiceState('idle');
      }
    }, [sessionId])
  );

  const handleReset = useCallback(() => {
    setVoiceState('idle');
    setError(null);
  }, [setVoiceState, setError]);

  const handleResetSession = useCallback(() => {
    setSessionId(generateSessionId());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm -mt-16">
        <div className="flex flex-col items-center space-y-8">
          <VoiceSphere 
            state={voiceState} 
            onClick={toggleRecording} 
          />
          <StatusMessage 
            state={voiceState} 
            error={error} 
          />
        </div>
      </div>
      
      {voiceState === 'processing' && (
        <button
          onClick={handleReset}
          className="fixed bottom-6 right-6 p-3 bg-white/80 hover:bg-white rounded-full shadow-lg 
                   transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 
                   focus:ring-blue-400 focus:ring-offset-2"
          aria-label="Reset"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      )}

      <button
        onClick={handleResetSession}
        className="fixed bottom-6 p-2 bg-white/80 hover:bg-white rounded-lg shadow-lg 
                 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 
                 focus:ring-blue-400 focus:ring-offset-2 flex items-center gap-2 text-sm text-gray-600"
        aria-label="Reset Session"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reset session</span>
      </button>
    </div>
  );
}

export default App;
