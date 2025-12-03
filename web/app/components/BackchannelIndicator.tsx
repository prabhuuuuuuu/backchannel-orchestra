import { useEffect, useState } from 'react';

interface BackchannelIndicatorProps {
  lastBackchannel?: {
    type: string;
    timestamp: number;
  };
}

const backchannelEmojis: Record<string, string> = {
  'mm-hmm': '👍',
  'yeah': '✨',
  'right': '💯',
  'okay': '👌',
  'uh-huh': '😊',
  'i-see': '👀',
  'interesting': '🤔',
  'default': '💬'
};

export default function BackchannelIndicator({ lastBackchannel }: BackchannelIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (lastBackchannel) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastBackchannel?.timestamp]);

  const emoji = lastBackchannel 
    ? backchannelEmojis[lastBackchannel.type] || backchannelEmojis.default
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Latest Feedback</h3>
      
      <div className="flex items-center justify-center h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden relative">
        {lastBackchannel ? (
          <div className={`
            text-center space-y-2 z-10
            ${isAnimating ? 'animate-bounce' : ''}
          `}>
            <div className="text-4xl">{emoji}</div>
            <p className="text-lg font-semibold text-indigo-600">
              {lastBackchannel.type}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(lastBackchannel.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-4xl opacity-20">🎤</div>
            <p className="text-gray-400 text-sm">Waiting for feedback...</p>
          </div>
        )}

        {/* Ripple effect on new backchannel */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-indigo-400 rounded-full opacity-30 animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
}