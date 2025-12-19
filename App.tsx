
import React, { useState } from 'react';
import { Theme, GenerationState } from './types';
import { THEMES } from './constants';
import { generatePixelArtImage } from './services/geminiService';
import { processPixelArt, downloadImage } from './utils/imageUtils';
import ThemeCard from './components/ThemeCard';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [resolution] = useState<number>(64);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [history, setHistory] = useState<{url: string, keyword: string}[]>([]);
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultImageUrl: null,
    originalResult: null
  });

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // 1. Gemini API를 통한 원본 이미지 생성
      const rawImage = await generatePixelArtImage(
        keyword,
        selectedTheme.promptSuffix
      );

      // 2. 후처리 유틸리티를 통한 픽셀화 및 투명화 처리
      const processedImage = await processPixelArt(rawImage, resolution);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        resultImageUrl: processedImage,
        originalResult: rawImage
      }));
      
      setHistory(prev => [{url: processedImage, keyword}, ...prev].slice(0, 8));
    } catch (err: any) {
      console.error("Generation flow error:", err);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || "생성에 실패했습니다." 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar UI - 원래의 세련된 디자인 유지 */}
      <aside className="w-full md:w-[400px] bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto z-20 shadow-xl">
        <div className="mb-10">
          <h1 className="pixel-font text-2xl text-blue-400 tracking-tighter">Pi-XEL</h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-[0.3em]">AI Pixel Art Generator</p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">What to create?</label>
            <input 
              type="text" 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              placeholder="e.g. Cyberpunk Katana" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 transition-all placeholder:text-slate-700" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Select Style</label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(t => (
                <ThemeCard 
                  key={t.id} 
                  theme={t} 
                  isSelected={selectedTheme.id === t.id} 
                  onClick={() => setSelectedTheme(t)} 
                />
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={state.isGenerating || !keyword} 
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              state.isGenerating || !keyword 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {state.isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : "Generate Pixel Art"}
          </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center relative min-h-[600px]">
        {state.error && (
          <div className="absolute top-10 inset-x-10 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center backdrop-blur-md z-30 animate-in fade-in">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">{state.error}</p>
          </div>
        )}

        <div className="w-full max-w-lg aspect-square bg-slate-900/30 rounded-[3rem] border border-slate-800/50 flex items-center justify-center relative overflow-hidden shadow-2xl group">
          {state.isGenerating ? (
             <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <span className="text-blue-500 pixel-font text-[10px] block mb-2 tracking-[0.2em]">PIXELATING...</span>
                  <p className="text-slate-500 text-[10px] uppercase">Rendering your imagination</p>
                </div>
             </div>
          ) : state.resultImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 animate-in zoom-in-95 duration-500">
              <img 
                src={state.resultImageUrl} 
                className="w-full h-full object-contain pixelated drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]" 
                alt="Result"
              />
              <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => downloadImage(state.resultImageUrl!, keyword)} 
                  className="bg-white text-black px-12 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  Download PNG
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-800">
              <div className="w-32 h-32 mb-8 border-4 border-dashed border-slate-800/50 rounded-[2.5rem] flex items-center justify-center">
                <svg className="w-12 h-12 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-bold uppercase tracking-[0.4em] text-[10px] text-slate-800">Ready to Create</p>
            </div>
          )}
        </div>

        {/* History Gallery */}
        {history.length > 0 && (
          <div className="mt-20 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] mb-8 text-center">History</h3>
            <div className="flex gap-6 overflow-x-auto pb-6 px-4 justify-center no-scrollbar">
              {history.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-2xl p-3 border border-slate-800 hover:border-blue-500/50 transition-all group"
                  onClick={() => setState(prev => ({ ...prev, resultImageUrl: item.url }))}
                >
                  <img src={item.url} className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform" alt="History Item" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
