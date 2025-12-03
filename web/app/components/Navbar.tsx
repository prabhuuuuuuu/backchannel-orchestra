import Link from 'next/link';

interface NavbarProps {
  showBackButton?: boolean;
  sessionActive?: boolean;
}

export default function Navbar({ showBackButton = false, sessionActive = false }: NavbarProps) {
  return (
    <nav className="w-full px-6 py-4 bg-white border-b flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {showBackButton ? (
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Backchannel Orchestra
            </span>
          </Link>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {sessionActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-700 font-medium">Session Active</span>
          </div>
        )}
        
        <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium">
          About
        </button>
      </div>
    </nav>
  );
}