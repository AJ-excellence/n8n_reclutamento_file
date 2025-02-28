import React from 'react';
import { cn } from '../utils';
import type { VoiceState } from '../types';

interface VoiceSphereProps {
  state: VoiceState;
  onClick: () => void;
}

export function VoiceSphere({ state, onClick }: VoiceSphereProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-64 h-64 rounded-full transition-all duration-500',
        'transform hover:scale-105 focus:outline-none',
        'flex items-center justify-center',
        state === 'idle' && 'bg-gradient-to-r from-blue-600 to-blue-400',
        state === 'recording' && 'bg-gradient-to-r from-blue-700 to-blue-400',
        state === 'processing' && 'bg-gradient-to-r from-orange-500 to-yellow-400',
        state === 'playing' && 'bg-gradient-to-r from-emerald-700 to-emerald-400'
      )}
    >
      {/* Animated waves */}
      <div
        className={cn(
          'absolute w-full h-full rounded-full',
          'animate-ping-slow bg-blue-300 opacity-30',
          state === 'playing' && 'bg-emerald-300'
        )}
      />
      <div
        className={cn(
          'absolute w-[90%] h-[90%] rounded-full',
          'animate-ping-slower bg-blue-400 opacity-40',
          state === 'playing' && 'bg-emerald-400'
        )}
      />
      
      {/* Core sphere with breathing animation */}
      <div
        className={cn(
          'absolute w-[80%] h-[80%] rounded-full',
          'animate-breath bg-white/10'
        )}
      />
    </button>
  );
}