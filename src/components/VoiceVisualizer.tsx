import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
  isSpeaking?: boolean;
}

const VoiceVisualizer = ({ isActive, isSpeaking = false }: VoiceVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 80;

    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw outer glow rings
      for (let ring = 0; ring < 2; ring++) {
        ctx.beginPath();
        const ringRadius = baseRadius + 40 + (ring * 20);
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(188, 100%, 50%, ${isActive || isSpeaking ? 0.1 - ring * 0.03 : 0.03})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "hsl(188, 100%, 50%)";
        ctx.stroke();
      }

      // Draw multiple rotating arcs with enhanced effects
      for (let i = 0; i < 5; i++) {
        const offset = (i * Math.PI * 2) / 5;
        const pulseEffect = Math.sin(rotation * 2 + offset) * (isActive || isSpeaking ? 15 : 5);
        const radius = baseRadius + pulseEffect;
        
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          offset + rotation,
          offset + rotation + Math.PI * 1.3
        );
        ctx.strokeStyle = `hsla(188, 100%, ${50 + i * 5}%, ${isActive || isSpeaking ? 0.9 : 0.4})`;
        ctx.lineWidth = isActive || isSpeaking ? 4 : 2;
        ctx.shadowBlur = isActive || isSpeaking ? 30 : 12;
        ctx.shadowColor = "hsl(188, 100%, 60%)";
        ctx.stroke();
      }

      // Draw pulsing particles
      if (isActive || isSpeaking) {
        for (let p = 0; p < 8; p++) {
          const particleAngle = (p * Math.PI * 2) / 8 + rotation * 1.5;
          const particleRadius = baseRadius + Math.sin(rotation * 3 + p) * 30;
          const px = centerX + Math.cos(particleAngle) * particleRadius;
          const py = centerY + Math.sin(particleAngle) * particleRadius;
          
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(188, 100%, 60%, ${0.6 + Math.sin(rotation * 4 + p) * 0.3})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "hsl(188, 100%, 70%)";
          ctx.fill();
        }
      }

      // Draw central circle with enhanced glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 45);
      gradient.addColorStop(0, `hsla(188, 100%, 60%, ${isActive || isSpeaking ? 0.5 : 0.2})`);
      gradient.addColorStop(1, `hsla(188, 100%, 50%, ${isActive || isSpeaking ? 0.1 : 0.05})`);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = `hsla(188, 100%, 50%, ${isActive || isSpeaking ? 0.9 : 0.5})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = isActive || isSpeaking ? 25 : 10;
      ctx.shadowColor = "hsl(188, 100%, 50%)";
      ctx.stroke();

      rotation += isActive || isSpeaking ? 0.03 : 0.008;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isSpeaking]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="opacity-80"
      />
    </div>
  );
};

export default VoiceVisualizer;
