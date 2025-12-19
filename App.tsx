
import React, { useState, useRef, useEffect } from 'react';
import { Theme, GenerationState } from './types';
import { THEMES } from './constants';
import { GeminiService } from './services/geminiService';
import { processPixelArt, downloadImage } from './utils/imageUtils';
import ThemeCard from './components/ThemeCard';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [resolution, setResolution] = useState<number>(64);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [history, setHistory] = useState<{url: string, keyword: string}[]>([]);
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultImageUrl: null,
    originalResult: null
  });

  const geminiService = useRef(new GeminiService());

  // 앱 시작 시 API 키가 있는지 확인하고 없으면 안내합니다.
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        console.log("No API key detected. User needs to select one.");
      }
    };
    checkKey();
  }, []);

  const promptKeySelection = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // 키 선택 후 바로 실행할 수 있도록 상태 초기화
      setState(prev => ({ ...prev, error: null }));
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    let currentApiKey: string | undefined;
    try {
      currentApiKey = process.env.API_KEY;
    } catch (e) {
      currentApiKey = undefined;
    }

    // 키가 아예 없는 경우 (Vercel 환경변수가 클라이언트에 노출되지 않았을 때)
    if (!currentApiKey) {
      const bridgeOpened = await promptKeySelection();
      if (!bridgeOpened) {
        setState(prev => ({ ...prev, error: "API Key is missing. Please provide it via the key icon." }));
        return;
      }
      // bridge가 열렸다면 사용자가 키를 선택할 것으로 기대하고 진행 시도 (Race condition 방지 위해 잠시 대기하지 않고 흐름 유지)
    }

    const resValue = Math.max(8, Math.min(256, resolution));
    setResolution(resValue);

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const rawImage = await geminiService.current.generatePixelArt(
        keyword,
        selectedTheme.promptSuffix,
        isHighQuality
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

        if (window.innerWidth < 768) {
          setTimeout(() => {
            document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    } catch (err: any) {
      let errorMessage = err.message;
      
      if (errorMessage === "API_KEY_MISSING" || errorMessage === "API_KEY_INVALID") {
        errorMessage = "API key issue! Please click the key icon to select a valid key.";
        await promptKeySelection();
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage || "Something went wrong. Please try again."
      }));
    }
  };

  const handleDownload = (url: string, name: string) => {
    downloadImage(url, `${name.replace(/\s+/g, '_')}_pixel_art.png`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-[400px] md:h-screen md:sticky md:top-0 bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 p-6 sm:p-8 overflow-y-auto">
        <div className="mb-8 md:mb-12 flex justify-between items-start">
          <div>
            <h1 className="pixel-font text-2xl md:text-3xl text-blue-400 mb-2 tracking-tighter">Pi-XEL</h1>
            <p className="text-slate-400 text-xs md:text-sm">English words to pixel art</p>
          </div>
          <button 
            onClick={promptKeySelection}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg transition-all group"
            title="Setup API Key"
          >
            <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">KEYWORD</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Red Dragon, Magic Orb"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quality Mode</span>
              <span className="text-[9px] text-slate-500">Enable Gemini 3 Pro</span>
            </div>
            <button 
              onClick={() => setIsHighQuality(!isHighQuality)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isHighQuality ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHighQuality ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">RESOLUTION</label>
            <div className="flex items-center gap-3">
               <input
                type="number"
                min="8"
                max="256"
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200"
              />
              <span className="text-slate-500 font-bold px-2 text-sm">px</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Style Themes</label>
            <div className="grid grid-cols-2 gap-3">
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

          <button
            onClick={handleGenerate}
            disabled={state.isGenerating || !keyword}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              state.isGenerating || !keyword
                ? 'bg-slate-700 text-slate-500'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-[0.98]'
            }`}
          >
            {state.isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Processing...</> : 'Generate Pixels'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-950 p-6 md:p-12 min-h-[500px]">
        <div id="result-area" className="flex-1 flex items-center justify-center relative py-12">
          {state.error && (
            <div className="absolute top-0 left-0 right-0 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-2">
              <p className="font-medium">{state.error}</p>
              <button onClick={promptKeySelection} className="mt-2 text-blue-400 hover:text-blue-300 underline font-bold decoration-2 underline-offset-4">
                [ Click here to setup API Key ]
              </button>
            </div>
          )}

          {!state.resultImageUrl && !state.isGenerating && (
            <div className="text-center group">
              <div className="w-32 h-32 border-4 border-dashed border-slate-800 rounded-3xl mx-auto mb-8 flex items-center justify-center group-hover:border-slate-700 transition-colors">
                <svg className="w-12 h-12 text-slate-800 group-hover:text-slate-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="text-slate-600 font-bold tracking-widest text-sm uppercase">Enter a keyword to begin</h2>
            </div>
          )}

          {state.isGenerating && (
            <div className="flex flex-col items-center">
              <div className="w-56 h-56 md:w-72 md:h-72 bg-slate-900 rounded-3xl animate-pulse flex items-center justify-center border-2 border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                <div className="text-blue-500/50 text-[10px] pixel-font animate-bounce uppercase">Rendering...</div>
              </div>
            </div>
          )}

          {state.resultImageUrl && !state.isGenerating && (
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-md animate-in zoom-in-95 duration-500">
              <div className="relative p-4 md:p-6 bg-slate-900 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 w-full aspect-square flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src={state.resultImageUrl} alt="Result" className="w-full h-full object-contain pixelated relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                
                <div className="absolute -bottom-16 md:-bottom-14 flex flex-col sm:flex-row gap-3 w-full justify-center px-4">
                  <button onClick={() => handleDownload(state.resultImageUrl!, keyword)} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3.5 rounded-full font-bold shadow-xl transition-all active:scale-95 text-sm ring-4 ring-blue-600/20">
                    Download PNG
                  </button>
                  <button onClick={() => { if (state.originalResult) { const win = window.open(); win?.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;height:100vh"><img src="${state.originalResult}" style="max-height:90%; image-rendering: pixelated;"/></body>`); } }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-6 py-3.5 rounded-full text-xs font-bold transition-all">
                    Show AI RAW
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 md:mt-auto pt-10 border-t border-slate-900/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Recent Collection</h3>
            <span className="text-[10px] text-slate-700">{history.length}/8 Slots</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
            {history.map((item, idx) => (
              <div key={idx} className="group relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-slate-900 rounded-2xl p-3 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer hover:-translate-y-1" onClick={() => setState(prev => ({ ...prev, resultImageUrl: item.url, error: null, originalResult: null }))}>
                <img src={item.url} className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform" alt="Collection" />
                <div className="absolute inset-x-0 -bottom-2 h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
