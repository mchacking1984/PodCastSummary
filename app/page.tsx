'use client';

import { useState, useCallback, useEffect } from 'react';
import PodcastSummarizer from '@/components/PodcastSummarizer';

const SITE_PASSWORD = 'lighthouse';
const AUTH_KEY = 'podsummarize_auth';

function HeadphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

export default function Home() {
  const [resetKey, setResetKey] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResetKey(prev => prev + 1);
    setHasResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleResultChange = useCallback((showingResult: boolean) => {
    setHasResult(showingResult);
  }, []);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[--accent]"></div>
      </div>
    );
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HeadphoneIcon className="w-10 h-10 text-[--accent]" />
            <span className="text-2xl font-bold tracking-tight">PODSUMMARIZE</span>
          </div>
          <p className="text-center text-[--foreground-muted] mb-6">
            Enter password to access
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field w-full mb-4"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm mb-4">{passwordError}</p>
            )}
            <button type="submit" className="btn-primary w-full">
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-[--border] sticky top-0 bg-[--background]/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="#"
              onClick={handleHomeClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <HeadphoneIcon className="w-8 h-8 text-[--accent]" />
              <span className="text-xl font-bold tracking-tight">PODSUMMARIZE</span>
            </a>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-8">
              <a
                href="#"
                onClick={handleHomeClick}
                className="nav-link text-white font-medium"
              >
                Home
              </a>
              <a href="#about" className="nav-link">About</a>
            </div>

            {/* Mobile menu button */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="waveform-bg" />
        <div className="gradient-orb -right-48 top-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className={`grid gap-12 items-start ${hasResult ? '' : 'lg:grid-cols-2'}`}>
            {/* Left Column - Text & Form (or full width when showing results) */}
            <div className={hasResult ? 'w-full' : 'space-y-6'}>
              {/* Hero text - only show when no result */}
              {!hasResult && (
                <>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                    Unlock Podcast
                    <br />
                    Knowledge,{' '}
                    <span className="bg-gradient-to-r from-[--accent] to-purple-400 bg-clip-text text-transparent">
                      Summarized.
                    </span>
                  </h1>

                  <p className="text-lg text-[--foreground-muted] max-w-lg">
                    Transform any Apple Podcast episode into actionable insights. Choose from 5 powerful summary formats.
                  </p>
                </>
              )}

              {/* Main Form Component - SINGLE instance, always rendered */}
              <PodcastSummarizer key={resetKey} onResultChange={handleResultChange} />
            </div>

            {/* Right Column - Headphone Image (only show when no result) */}
            {!hasResult && (
              <div className="hidden lg:flex justify-center items-center relative">
                <div className="relative w-96 h-96">
                  {/* Glow effect behind headphones */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[--accent]/20 via-purple-500/10 to-cyan-500/20 rounded-full blur-3xl" />

                  {/* Headphone illustration using CSS */}
                  <div className="relative flex items-center justify-center h-full">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-80 h-80"
                      fill="none"
                    >
                      {/* Headband */}
                      <path
                        d="M40 100 Q40 40 100 40 Q160 40 160 100"
                        stroke="url(#headphoneGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                      />

                      {/* Left ear cup */}
                      <ellipse cx="40" cy="120" rx="25" ry="35" fill="url(#cupGradient)" />
                      <ellipse cx="40" cy="120" rx="18" ry="28" fill="#1a1a2e" />
                      <ellipse cx="40" cy="120" rx="12" ry="20" fill="url(#innerGradient)" opacity="0.5" />

                      {/* Right ear cup */}
                      <ellipse cx="160" cy="120" rx="25" ry="35" fill="url(#cupGradient)" />
                      <ellipse cx="160" cy="120" rx="18" ry="28" fill="#1a1a2e" />
                      <ellipse cx="160" cy="120" rx="12" ry="20" fill="url(#innerGradient)" opacity="0.5" />

                      {/* Cushion details */}
                      <ellipse cx="40" cy="120" rx="20" ry="30" stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.3" />
                      <ellipse cx="160" cy="120" rx="20" ry="30" stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.3" />

                      <defs>
                        <linearGradient id="headphoneGradient" x1="40" y1="40" x2="160" y2="40">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="cupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#374151" />
                          <stop offset="50%" stopColor="#1f2937" />
                          <stop offset="100%" stopColor="#111827" />
                        </linearGradient>
                        <radialGradient id="innerGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="border-t border-[--border] bg-[--background-secondary]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About PodSummarize</h2>
            <p className="text-[--foreground-muted] text-lg">
              PodSummarize transforms podcast episodes into actionable knowledge. Whether you&apos;re short on time
              or want to revisit key insights, our AI-powered summaries help you get the most from every episode.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-[--accent]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-[--foreground-muted] text-sm">
                Get comprehensive summaries in minutes, not hours. Our AI processes audio directly.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-[--accent]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">5 Summary Formats</h3>
              <p className="text-[--foreground-muted] text-sm">
                From executive briefs to detailed roadmaps. Choose the format that matches your needs.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-[--accent]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Cost Effective</h3>
              <p className="text-[--foreground-muted] text-sm">
                Powered by Gemini AI. Process podcasts for less than a penny per episode.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[--foreground-muted]">
              <HeadphoneIcon className="w-5 h-5" />
              <span className="text-sm">PodSummarize</span>
            </div>
            <p className="text-sm text-[--foreground-muted]">
              Powered by Google Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
