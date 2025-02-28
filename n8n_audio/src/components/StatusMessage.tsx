import React, { useEffect, useState } from 'react';
import { cn } from '../utils';
import type { VoiceState } from '../types';

const processingMessages = [
  "Ragiono su quanto mi hai detto...",
  "Ci sono quasi...",
  "Ti sto per rispondere..."
];

interface StatusMessageProps {
  state: VoiceState;
  error: string | null;
}

export function StatusMessage({ state, error }: StatusMessageProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (state === 'processing') {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % processingMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
    setMessageIndex(0);
  }, [state]);

  if (error) {
    return (
      <p className="text-red-500 font-medium mt-6 text-center">
        {error}
      </p>
    );
  }

  return (
    <p
      className={cn(
        'text-gray-700 font-medium mt-6 text-center',
        'transition-opacity duration-500'
      )}
    >
      {state === 'idle' && "Premi una volta per parlarmi, e premi di nuovo quando hai finito di parlare."}
      {state === 'recording' && "Premi quando hai finito di parlare..."}
      {state === 'processing' && processingMessages[messageIndex]}
      {state === 'playing' && "Ti sto parlando..."}
    </p>
  );
}