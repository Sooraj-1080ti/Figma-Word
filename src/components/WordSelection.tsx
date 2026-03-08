import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Lock, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface WordSelectionProps {
  onWordSelect: (word: string) => void;
  completedWords: Set<string>;
  onResetProgress: () => void;
}

const WORDS = [
  'APPLE', 'DUCK', 'WATER', 'FOOD', 'CAT',
  'DOG', 'BIRD', 'SUN', 'MOON', 'CAR',
  'HOUSE', 'TREE', 'BOOK', 'FISH', 'FLOWER'
];

const WORD_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-indigo-400',
  'bg-purple-400', 'bg-pink-400', 'bg-rose-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400',
  'bg-sky-400', 'bg-violet-400', 'bg-fuchsia-400', 'bg-lime-400', 'bg-amber-400', 'bg-orange-500',
  'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500',
  'bg-yellow-500', 'bg-red-600'
];

export function WordSelection({ onWordSelect, completedWords, onResetProgress }: WordSelectionProps) {
  const getWordStatus = (word: string): 'completed' | 'available' | 'locked' => {
    if (completedWords.has(word)) return 'completed';
    return 'available';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          🌟 Word Adventure 🌟
        </h1>
        <p className="text-xl text-white/90 drop-shadow">
          Click on a word to start tracing!
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {WORDS.map((word, index) => {
          const status = getWordStatus(word);
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';
          const colorClass = WORD_COLORS[index];

          return (
            <Card
              key={word}
              className={`
                relative aspect-square cursor-pointer transition-all duration-300 hover:scale-105 
                border-4 border-white/50 shadow-lg hover:shadow-xl
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-white'}
                ${colorClass}
              `}
              onClick={() => !isLocked && onWordSelect(word)}
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                {isLocked ? (
                  <Lock className="w-8 h-8 text-white/70" />
                ) : (
                  <>
                    <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg text-center w-full px-2">
                      {word}
                    </span>
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-400 text-yellow-900 border-2 border-yellow-200 px-2 py-1">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          ✓
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center flex flex-col items-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
          <p className="text-white text-lg">
            Progress: {completedWords.size}/{WORDS.length} words completed! 🎉
          </p>
          <div className="w-64 bg-white/30 rounded-full h-4 mt-2">
            <div
              className="bg-yellow-400 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(completedWords.size / WORDS.length) * 100}%` }}
            />
          </div>
        </div>

        <Button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset your progress?')) {
              onResetProgress();
            }
          }}
          disabled={completedWords.size === 0}
          variant="outline"
          className="bg-white/90 hover:bg-white text-purple-700 font-bold border-2 border-purple-300 shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset Progress
        </Button>
      </div>
    </div>
  );
}