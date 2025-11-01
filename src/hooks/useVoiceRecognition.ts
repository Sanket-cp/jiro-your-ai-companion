import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseVoiceRecognitionReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Support for multiple languages
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0];
        if (result && result.transcript) {
          setTranscript(result.transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please enable microphone permissions.");
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.");
        } else if (event.error !== "aborted") {
          toast.error("Voice recognition error. Please try again.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
      console.warn("Speech recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up recognition:", e);
        }
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast.error("Voice recognition is not supported in your browser");
      return;
    }

    try {
      // Stop any existing recognition first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }

      // Small delay to ensure cleanup
      setTimeout(() => {
        setTranscript("");
        setIsListening(true);
        recognitionRef.current?.start();
        toast.success("Listening... Speak now");
      }, 100);
    } catch (error: any) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
      toast.error("Failed to start voice recognition");
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping recognition:", error);
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript("");
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
};
