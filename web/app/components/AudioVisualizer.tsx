import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  analyserNode?: AnalyserNode;
  barCount?: number;
}

export default function AudioVisualizer({
  isActive,
  analyserNode,
  barCount = 48
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Get live waveform data
      analyserNode.getByteTimeDomainData(dataArray);
      

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const sample = dataArray[i * step];

        // Convert 0–255 → -1..+1
        const normalized = (sample - 128) / 128;

        // Absolute waveform height
        const barHeight = Math.abs(normalized) * canvas.height;
        const x = i * barWidth;
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, "#818cf8");
        gradient.addColorStop(1, "#6366f1");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current!);
    };
  }, [analyserNode, isActive, barCount]);

  // Fallback UI (not active yet — waiting for mic permission)
  if (!analyserNode) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Audio Level</h3>
        <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          Microphone inactive
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Audio Level</h3>
      <div className="h-24 bg-gray-100 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={96}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
