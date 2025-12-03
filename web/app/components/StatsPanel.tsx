interface StatsPanelProps {
  totalBackchannels: number;
  speakingTime: number;
  averageResponseTime?: number;
  backchannelsByType?: Record<string, number>;
}

export default function StatsPanel({ 
  totalBackchannels, 
  speakingTime,
  averageResponseTime = 0,
  backchannelsByType = {}
}: StatsPanelProps) {
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const topBackchannels = Object.entries(backchannelsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Session Stats</h3>
      
      <div className="space-y-4">
        {/* Total Backchannels */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <span className="text-sm text-gray-600">Total Backchannels</span>
          </div>
          <span className="text-2xl font-bold text-indigo-600">
            {totalBackchannels}
          </span>
        </div>

        {/* Speaking Time */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <span className="text-sm text-gray-600">Speaking Time</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {formatTime(speakingTime)}
          </span>
        </div>

        {/* Average Response Time */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-sm text-gray-600">Avg Response</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {averageResponseTime.toFixed(1)}s
          </span>
        </div>

        {/* Top Backchannel Types */}
        {topBackchannels.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Top Responses
            </p>
            <div className="space-y-2">
              {topBackchannels.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(count / totalBackchannels) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}