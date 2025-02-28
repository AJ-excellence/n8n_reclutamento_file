export type VoiceState = 'idle' | 'recording' | 'processing' | 'playing';

export interface AudioRecorderState {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
}