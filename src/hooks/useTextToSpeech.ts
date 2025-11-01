import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  isSpeaking: boolean;
  stop: () => void;
  isSupported: boolean;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!isSupported) {
      toast.error("Text-to-speech is not supported in your browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings for more natural speech
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Detect language and select appropriate voice
    const voices = window.speechSynthesis.getVoices();
    
    // Language detection based on text content
    const isBengali = /[\u0980-\u09FF]/.test(text);
    const isHindi = /[\u0900-\u097F]/.test(text);
    
    let selectedVoice;
    
    if (isBengali) {
      // Prefer Bengali voices
      selectedVoice = voices.find(voice => 
        voice.lang.includes('bn') || voice.name.includes('Bengali')
      ) || voices.find(voice => 
        voice.lang.includes('hi') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      );
    } else if (isHindi) {
      // Prefer Hindi voices
      selectedVoice = voices.find(voice => 
        voice.lang.includes('hi') || voice.name.includes('Hindi')
      ) || voices.find(voice => 
        voice.name.includes('Google') || voice.name.includes('Microsoft')
      );
    } else {
      // English - prefer natural sounding voices
      selectedVoice = voices.find(voice => 
        (voice.lang.includes('en') && voice.name.includes('Google')) ||
        (voice.lang.includes('en') && voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      toast.error("Failed to speak text");
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return {
    speak,
    isSpeaking,
    stop,
    isSupported,
  };
};
