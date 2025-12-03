interface MicToggleButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicToggleButton({ 
  isRecording, 
  onToggle, 
  disabled = false 
}: MicToggleButtonProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          w-32 h-32 rounded-full flex items-center justify-center 
          transition-all transform hover:scale-105 
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          // Stop icon
          <svg 
            className="w-12 h-12 text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Microphone icon
          <svg 
            className="w-12 h-12 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        )}
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          {isRecording ? 'Recording...' : 'Click to start speaking'}
        </p>
        {disabled && (
          <p className="text-xs text-red-500 mt-1">
            Microphone access required
          </p>
        )}
      </div>
    </div>
  );
}