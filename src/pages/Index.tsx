import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import MessageBubble from "@/components/MessageBubble";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceSupported,
  } = useVoiceRecognition();

  const { speak, isSpeaking, stop: stopSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  // Greeting on mount
  useEffect(() => {
    const greeting = "Hello. Jiro AI assistant online and ready to assist you. How may I help you today?";
    setMessages([{ role: "assistant", content: greeting }]);
    
    if (voiceEnabled && ttsSupported) {
      // Delay greeting to allow UI to render
      setTimeout(() => speak(greeting), 1000);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    resetTranscript();

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke("jiro-chat", {
        body: {
          message: text,
          conversationHistory,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak response if voice is enabled
      if (voiceEnabled && ttsSupported) {
        speak(data.response);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to get response from Jiro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
      // Send the transcript when stopping
      if (transcript.trim()) {
        sendMessage(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    if (voiceEnabled && isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/3 rounded-full blur-2xl animate-glow-pulse" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,199,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,199,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="w-full max-w-3xl h-[75vh] flex flex-col relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold text-foreground mb-2 tracking-wider relative">
            <span className="relative inline-block">
              JIRO
              <span className="absolute inset-0 blur-xl bg-primary/30 animate-pulse-glow" />
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">AI Assistant System</p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4 animate-shimmer bg-[length:200%_100%]" />
        </div>

        {/* Voice Visualizer */}
        <div className="mb-6">
          <VoiceVisualizer isActive={isListening} isSpeaking={isSpeaking} />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 mb-6 rounded-lg border border-primary/20 bg-card/30 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,199,255,0.05)] transition-all duration-300 hover:border-primary/30">
          <div className="py-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4 animate-slide-up">
                <div className="bg-card/50 border border-primary/30 rounded-2xl px-6 py-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,199,255,0.1)]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "outline"}
              onClick={toggleVoiceInput}
              disabled={!voiceSupported || isLoading}
              className={`border-primary/50 transition-all duration-300 hover:scale-110 ${
                isListening ? "animate-pulse-glow shadow-[0_0_20px_rgba(0,199,255,0.4)]" : "hover:border-primary"
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message or use voice input..."
              disabled={isLoading}
              className="bg-input/50 border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-all duration-300 focus:shadow-[0_0_15px_rgba(0,199,255,0.2)]"
            />

            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleVoiceOutput}
              disabled={!ttsSupported}
              className="border-primary/50 transition-all duration-300 hover:scale-110 hover:border-primary"
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_0_20px_rgba(0,199,255,0.3)] hover:shadow-[0_0_30px_rgba(0,199,255,0.5)] transition-all duration-300 hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {/* Status indicator */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          {isListening && "🎤 Listening..."}
          {isSpeaking && "🔊 Speaking..."}
          {!voiceSupported && "⚠️ Voice input not supported in this browser"}
          {!ttsSupported && "⚠️ Voice output not supported in this browser"}
        </div>
      </div>
    </div>
  );
};

export default Index;
