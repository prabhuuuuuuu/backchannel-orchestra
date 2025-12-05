import Link from 'next/link';
import { Button } from './components/Button';
import { WaveformClient } from './components/WaveformClient';
import { DottedGlowBackground } from './components/ui/dotted-glow-background';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* Enhanced Dotted Glow Background – Now Clearly Visible */}
      <DottedGlowBackground
        className="fixed inset-0 -z-50 pointer-events-none"
        opacity={0.9}           // Increased
        gap={16}
        radius={1.8}
        speedMin={0.4}
        speedMax={0.9}
        colorDarkVar="--color-neutral-700"
        glowColorDarkVar="--color-yellow-500"
    // Make sure your component supports this prop
        backgroundOpacity={0.02}
      />

      {/* Soft vignette for depth */}
      <div className="fixed inset-0 -z-40 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" aria-hidden="true" />

      <div className="relative min-h-screen text-white font-light antialiased">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/60">
  <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    
    {/* Logo */}
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-yellow-500/40 group-hover:scale-110 transition-all duration-300">
          <span className="text-black font-black text-lg tracking-tighter">B</span>
        </div>
        <div className="absolute inset-0 rounded-lg bg-yellow-400 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
      </div>
      <span className="text-lg font-medium tracking-tight">Backchannel</span>
    </Link>

    {/* Buttons */}
    <div className="flex items-center gap-3">
      {/* <Button className="text-black text-sm px-3 py-1.5">
        Sign In
      </Button>
      <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-sm px-3 py-1.5">
        Get Started
      </Button> */}
    </div>

  </div>
</nav>


        {/* HERO – Now fits perfectly in 100vh (including mobile) */}
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            {/* Early Access Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium tracking-wider backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              Backchannel Orchestra
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              Master Your Voice
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                With Real AI Feedback
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Speak naturally. Get instant, human-like backchannel cues. 
              Train like the best speakers in the world — in private.
            </p>

            {/* Waveform – Responsive & Contained */}
            <div className="py-8 max-w-xl mx-auto">
              <WaveformClient  />
            </div>

            {/* CTAs – Stacked on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link href="/session">
                <Button className="h-14 px-8 text-lg font-semibold rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black shadow-xl hover:shadow-yellow-500/40 transition-all hover:scale-105">
                  Start Practicing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button  className="h-14 px-8 text-lg rounded-2xl border-white/20 hover:border-yellow-400/50 hover:bg-yellow-500/10 backdrop-blur-sm">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust line */}
            <p className="text-sm text-gray-500 pt-8">
              {/* Trusted by speakers at <span className="text-yellow-400 font-medium">TED, Google, Stripe, YC</span> */}
            </p>
          </div>

          {/* Subtle scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-600" />
          </div>
        </section>

        {/* Rest of your sections (Features, Stats, CTA, Footer) remain the same – just keeping hero fixed */}
        {/* ... [Features, Stats, Final CTA, Footer from previous version] ... */}
        {/* I'll paste only the hero fix above to keep this clean — you can keep the rest unchanged */}

      </div>
    </>
  );
}