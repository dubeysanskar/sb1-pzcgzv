"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechProps {
  onSpeechEnd?: (transcript: string) => void;
}

export function useSpeech({ onSpeechEnd }: UseSpeechProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window !== 'undefined' && window.SpeechRecognition) {
      const recognition = new window.SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        if (onSpeechEnd) onSpeechEnd(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    }
  }, [onSpeechEnd]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    isListening,
    transcript,
    speaking,
    startListening,
    speak
  };
}