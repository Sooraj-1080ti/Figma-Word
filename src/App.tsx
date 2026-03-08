import React, { useState } from 'react';
import { WordSelection } from './components/WordSelection';
import { WordTracing } from './components/WordTracing';
import { Button } from './components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'levels' | 'tracing'>('levels');
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    setCurrentScreen('tracing');
  };

  const handleWordComplete = (word: string) => {
    setCompletedWords(prev => new Set([...prev, word]));
    setTimeout(() => {
      setCurrentScreen('levels');
    }, 2000); // Show celebration for 2 seconds
  };

  const handleBackToLevels = () => {
    setCurrentScreen('levels');
  };

  const handleResetProgress = () => {
    setCompletedWords(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 p-4">
      {currentScreen === 'levels' ? (
        <WordSelection
          onWordSelect={handleWordSelect}
          completedWords={completedWords}
          onResetProgress={handleResetProgress}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Button
              onClick={handleBackToLevels}
              variant="outline"
              className="bg-white/90 hover:bg-white border-2 border-purple-300 text-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Words
            </Button>
          </div>
          <WordTracing
            word={selectedWord}
            onComplete={handleWordComplete}
            isCompleted={completedWords.has(selectedWord)}
          />
        </div>
      )}
    </div>
  );
}