import PodcastSummarizer from '@/components/PodcastSummarizer';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Podcast Summary
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get AI-powered summaries of any Apple Podcast episode
          </p>
        </header>

        <PodcastSummarizer />

        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Google Gemini AI</p>
        </footer>
      </div>
    </main>
  );
}
