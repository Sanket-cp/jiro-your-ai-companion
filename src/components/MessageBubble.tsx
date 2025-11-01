import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-slide-up",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
          isAssistant
            ? "bg-card/50 border border-primary/30 shadow-[0_0_20px_rgba(0,199,255,0.15)] hover:shadow-[0_0_30px_rgba(0,199,255,0.25)]"
            : "bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,199,255,0.1)] hover:shadow-[0_0_25px_rgba(0,199,255,0.2)]"
        )}
      >
        {isAssistant && (
          <div className="text-primary text-sm font-semibold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Jiro
          </div>
        )}
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
