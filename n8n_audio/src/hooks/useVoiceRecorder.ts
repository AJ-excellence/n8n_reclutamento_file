import { useState, useCallback, useRef } from 'react';
import type { AudioRecorderState, VoiceState } from '../types';

const AUDIO_CONSTRAINTS = {
  audio: {
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
    volume: 1.0
  }
};

const RECORDER_OPTIONS = {
  mimeType: 'audio/webm',  // Simplified MIME type without codec specification
  audioBitsPerSecond: 128000
};

const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg'
];

function getSupportedMimeType(): string {
  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  throw new Error('No supported audio MIME type found');
}

export function useVoiceRecorder(onAudioReady: (blob: Blob) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderState = useRef<AudioRecorderState>({
    mediaRecorder: null,
    audioChunks: [],
    stream: null
  });

  const stopRecording = useCallback(() => {
    if (recorderState.current.mediaRecorder?.state === 'recording') {
      recorderState.current.mediaRecorder.stop();
    }
    if (recorderState.current.stream) {
      recorderState.current.stream.getTracks().forEach(track => track.stop());
    }
    setVoiceState('processing');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      
      const mediaRecorder = new MediaRecorder(stream, {
        ...RECORDER_OPTIONS,
        mimeType
      });
      
      recorderState.current.stream = stream;
      recorderState.current.mediaRecorder = mediaRecorder;
      recorderState.current.audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recorderState.current.audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          if (recorderState.current.audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }

          const audioBlob = new Blob(recorderState.current.audioChunks, { 
            type: mimeType 
          });

          if (audioBlob.size === 0) {
            throw new Error('Audio recording is empty');
          }

          onAudioReady(audioBlob);
        } catch (err) {
          setError('Failed to process audio recording. Please try again.');
          setVoiceState('idle');
          console.error('Error processing recorded audio:', err);
        }
      };

      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred. Please try again.');
        setVoiceState('idle');
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.start();
      setVoiceState('recording');
      setError(null);
    } catch (err) {
      let errorMessage = 'Failed to start recording. ';
      
      if (err instanceof Error) {
        if (err.message === 'No supported audio MIME type found') {
          errorMessage += 'Your browser does not support any compatible audio formats.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage += 'Microphone access denied. Please enable microphone permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else {
          errorMessage += 'Please check your microphone and try again.';
        }
      }

      setError(errorMessage);
      setVoiceState('idle');
      console.error('Error accessing microphone:', err);
    }
  }, [onAudioReady]);

  const toggleRecording = useCallback(async () => {
    if (voiceState === 'idle') {
      await startRecording();
    } else if (voiceState === 'recording') {
      stopRecording();
    }
  }, [voiceState, startRecording, stopRecording]);

  return {
    voiceState,
    error,
    toggleRecording,
    setVoiceState,
    setError
  };
}