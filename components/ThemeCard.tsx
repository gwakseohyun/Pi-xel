
import React from 'react';
import { Theme } from '../types';

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden min-h-[70px] md:min-h-[80px] ${
        isSelected 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02] md:scale-105 shadow-lg shadow-blue-500/20' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 active:bg-slate-700'
      }`}
    >
      <div className={`absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 ${theme.color} opacity-20 rounded-bl-3xl`}></div>
      <h3 className={`font-bold text-[11px] md:text-sm mb-1 ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
        {theme.name}
      </h3>
      <p className="text-[9px] md:text-xs text-slate-400 leading-tight line-clamp-2">
        {theme.description}
      </p>
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2">
          <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default ThemeCard;
