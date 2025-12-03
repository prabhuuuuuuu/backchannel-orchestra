import Link from 'next/link';
import { Button } from './components/Button';
import { FeatureCard } from './components/FeatureCard';
import { WaveformClient } from './components/WaveformClient';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Navbar */}
      <nav className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-xl">B</span>
            </div>
            <span className="text-xl font-bold">Backchannel</span>
          </div>
          <Button variant="secondary">Sign In</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-7xl font-black leading-tight">
            Practice Speaking
            <br />
            <span className="text-yellow-400">With AI Feedback</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get real-time backchannel responses as you speak. 
            Improve your communication skills with instant AI-powered feedback.
          </p>

          <div className="py-8">
            <WaveformClient />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/session">
              <Button variant="primary">
                <span>Start Practice Session</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Button variant="secondary">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Watch Demo</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            number="01"
            title="Speak Naturally"
            description="Just start talking. Our AI listens and provides real-time backchannel responses that feel natural and human."
          />
          <FeatureCard
            number="02"
            title="Get Feedback"
            description="Receive instant audio responses and cues. Practice your pacing, tone, and delivery in a safe environment."
          />
          <FeatureCard
            number="03"
            title="Track Progress"
            description="Review your session analytics and see how you improve over time. Build confidence with every practice."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="bg-zinc-900 rounded-3xl p-12 border border-zinc-800">
          <h2 className="text-4xl font-black mb-4">
            Ready to improve your speaking?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Start your first practice session now. No credit card required.
          </p>
          <Link href="/session">
            <Button variant="primary">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Backchannel Orchestra
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}