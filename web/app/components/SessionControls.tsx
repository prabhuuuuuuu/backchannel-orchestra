interface SessionControlsProps {
  sessionDuration: number;
  isRecording: boolean;
  onEndSession: () => void;
  onResetSession: () => void;
  onExportData?: () => void;
}

export default function SessionControls({
  sessionDuration,
  isRecording,
  onEndSession,
  onResetSession,
  onExportData
}: SessionControlsProps) {
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="space-y-4">
        {/* Session Info */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Session Controls</h3>
            <p className="text-xs text-gray-500 mt-1">
              Duration: {formatTime(sessionDuration)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
            }`} />
            <span className="text-xs text-gray-600">
              {isRecording ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* End Session */}
          <button
            onClick={onEndSession}
            disabled={sessionDuration === 0}
            className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Session
          </button>

          {/* Reset Session */}
          <button
            onClick={onResetSession}
            disabled={sessionDuration === 0}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          {/* Export Data (Optional) */}
          {onExportData && (
            <button
              onClick={onExportData}
              disabled={sessionDuration === 0}
              className="w-full px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 leading-relaxed">
            💡 <span className="font-semibold">Tip:</span> Speak naturally and pause between sentences for better backchannel timing.
          </p>
        </div>
      </div>
    </div>
  );
}