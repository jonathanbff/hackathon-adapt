import { useEffect, useState } from "react";
interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

export function Confetti({
  isActive,
  onComplete,
  duration = 2000,
  particleCount = 50,
}: ConfettiProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; delay: number; color: string }>
  >([]);

  const colors = [
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
  ];

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, duration, particleCount]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 opacity-90 animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: "10%",
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
    </div>
  );
}
