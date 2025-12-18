
import React, { useState, useRef } from 'react';
import { Theme, GenerationState } from './types';
import { THEMES } from './constants';
import { GeminiService } from './services/geminiService';
import { processPixelArt, downloadImage } from './utils/imageUtils';
import ThemeCard from './components/ThemeCard';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [resolution, setResolution] = useState<number>(64);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [history, setHistory] = useState<{url: string, keyword: string}[]>([]);
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultImageUrl: null,
    originalResult: null
  });

  const geminiService = useRef(new GeminiService());

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    const resValue = Math.max(8, Math.min(256, resolution));
    setResolution(resValue);

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const rawImage = await geminiService.current.generatePixelArt(
        keyword,
        selectedTheme.promptSuffix
      );

      if (rawImage) {
        const processedImage = await processPixelArt(rawImage, resValue);
        
        setState(prev => ({
          ...prev,
          isGenerating: false,
          resultImageUrl: processedImage,
          originalResult: rawImage
        }));

        setHistory(prev => {
          const newHistory = [{url: processedImage, keyword: keyword}, ...prev];
          return newHistory.slice(0, 8);
        });

        // Scroll to result on mobile after generation
        if (window.innerWidth < 768) {
          setTimeout(() => {
            document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } else {
        throw new Error("No image data returned from AI.");
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Failed to generate pixel art. Please try again."
      }));
    }
  };

  const handleDownload = (url: string, name: string) => {
    downloadImage(url, `${name.replace(/\s+/g, '_')}_pixel_art.png`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-[400px] md:h-screen md:sticky md:top-0 bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 p-6 sm:p-8 overflow-y-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="pixel-font text-2xl md:text-3xl text-blue-400 mb-2 tracking-tighter">Pi-XEL</h1>
          <p className="text-slate-400 text-xs md:text-sm">Convert words into pixels</p>
        </div>

        <div className="space-y-8 md:space-y-10">
          {/* Input Section */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              KEYWORD
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Space Cat, Sword, Potion"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-600 text-sm md:text-base"
            />
          </div>

          {/* Resolution Selection */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              RESOLUTION (8 - 256)
            </label>
            <div className="flex items-center gap-3">
               <input
                type="number"
                min="8"
                max="256"
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-slate-500 font-bold px-2 whitespace-nowrap text-sm">px</span>
            </div>
          </div>

          {/* Themes Selection */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Select Theme
            </label>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme.id === theme.id}
                  onClick={() => setSelectedTheme(theme)}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 pb-4 md:pb-0">
            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !keyword}
              className={`w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-3 transition-all ${
                state.isGenerating || !keyword
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-[0.98]'
              }`}
            >
              {state.isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                'Generate Art'
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col bg-slate-900 p-6 sm:p-10 md:p-12 min-h-[500px]">
        <div id="result-area" className="flex-1 flex items-center justify-center relative py-12">
          {state.error && (
            <div className="absolute top-0 left-0 right-0 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-4 duration-300">
              {state.error}
            </div>
          )}

          {!state.resultImageUrl && !state.isGenerating && (
            <div className="text-center px-4">
              <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-dashed border-slate-800 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-slate-600 font-bold text-lg md:text-xl">Your pixels await...</h2>
              <p className="text-slate-700 text-xs md:text-sm mt-2">Enter a keyword and hit generate</p>
            </div>
          )}

          {state.isGenerating && (
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center border-2 border-slate-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                <div className="text-slate-600 text-[10px] md:text-xs pixel-font animate-bounce">PIXELATING...</div>
              </div>
            </div>
          )}

          {state.resultImageUrl && !state.isGenerating && (
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-md">
              <div className="relative group p-3 md:p-4 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full aspect-square flex items-center justify-center">
                <div className="absolute inset-3 md:inset-4 rounded-xl overflow-hidden pointer-events-none opacity-20">
                  <div className="w-full h-full bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:8px_8px]"></div>
                </div>

                <img
                  src={state.resultImageUrl}
                  alt="Pixel Art Result"
                  className="w-full h-full object-contain pixelated relative z-10 transition-transform group-hover:scale-[1.02]"
                />

                <div className="absolute -bottom-16 md:-bottom-12 flex flex-col sm:flex-row gap-3 w-full justify-center px-4">
                  <button
                    onClick={() => handleDownload(state.resultImageUrl!, keyword)}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base order-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PNG
                  </button>
                  <button
                    onClick={() => {
                      if (state.originalResult) {
                         const win = window.open();
                         win?.document.write(`<img src="${state.originalResult}" style="max-width: 100%; height: auto;"/>`);
                      }
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-full text-sm font-semibold transition-all order-2"
                  >
                    View Original
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent History / Gallery */}
        <div className="mt-12 md:mt-auto pt-8 border-t border-slate-800">
          <h3 className="text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">Recent Creations</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {history.length === 0 ? (
              <p className="text-slate-700 text-xs italic">No history yet</p>
            ) : (
              history.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-slate-800 rounded-xl p-2 border border-slate-700 hover:border-blue-500/50 transition-colors snap-start"
                >
                  <img 
                    src={item.url} 
                    className="w-full h-full object-contain pixelated cursor-pointer" 
                    alt={`History ${idx}`} 
                    onClick={() => {
                      setState(prev => ({ ...prev, resultImageUrl: item.url, error: null, originalResult: null }));
                      document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                  {/* Hover Download Button - larger touch area for mobile */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.url, item.keyword);
                    }}
                    className="absolute top-0 right-0 w-8 h-8 bg-black/60 hover:bg-black/90 text-white rounded-tr-xl rounded-bl-xl flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity z-20"
                    title="Download this image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {/* Visible download button for mobile as hover doesn't exist */}
                  <div className="md:hidden absolute -bottom-1 -right-1">
                    <div className="bg-blue-500 w-4 h-4 rounded-full border-2 border-slate-800"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
