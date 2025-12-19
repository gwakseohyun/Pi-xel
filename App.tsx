
import React, { useState, useRef, useEffect } from 'react';
import { Theme, GenerationState } from './types';
import { THEMES } from './constants';
import { GeminiService } from './services/geminiService';
import { processPixelArt, downloadImage } from './utils/imageUtils';
import ThemeCard from './components/ThemeCard';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [resolution] = useState<number>(64);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [history, setHistory] = useState<{url: string, keyword: string}[]>([]);
  const [hasKey, setHasKey] = useState<boolean>(true);
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultImageUrl: null,
    originalResult: null
  });

  const geminiService = useRef(new GeminiService());

  // API 키 선택 상태 체크
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected || !!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const handleDownload = (url: string, kw: string) => {
    downloadImage(url, `pixel-art-${kw.replace(/\s+/g, '-').toLowerCase()}.png`);
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    // 키가 없는 경우 선택창 유도
    if (!hasKey && window.aistudio) {
      await handleConnectKey();
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const rawImage = await geminiService.current.generatePixelArt(
        keyword,
        selectedTheme.promptSuffix
      );

      if (rawImage) {
        const processedImage = await processPixelArt(rawImage, resolution);
        setState(prev => ({
          ...prev,
          isGenerating: false,
          resultImageUrl: processedImage,
          originalResult: rawImage
        }));
        setHistory(prev => [{url: processedImage, keyword}, ...prev].slice(0, 8));
      }
    } catch (err: any) {
      let errorMessage = "Generation failed.";
      const msg = err.message || "";
      
      if (msg.includes("API Key must be set") || msg.includes("not found") || msg.includes("401")) {
        errorMessage = "API 키가 설정되지 않았거나 유효하지 않습니다. 아래 버튼을 눌러 키를 연결해주세요.";
        setHasKey(false);
      } else if (msg.includes("BILLING_REQUIRED") || msg.includes("quota")) {
        errorMessage = "API 할당량이 부족하거나 결제가 필요합니다. (Paid GCP Project 필요)";
      } else {
        errorMessage = msg || "알 수 없는 오류가 발생했습니다.";
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-[400px] bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto">
        <div className="mb-10">
          <h1 className="pixel-font text-2xl text-blue-400">Pi-XEL</h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest">AI Pixel Art Generator</p>
        </div>

        {!hasKey && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-[11px] mb-3 leading-relaxed font-semibold">
              브라우저 환경에서 API 실행을 위해 키 연결이 필요합니다.
            </p>
            <button 
              onClick={handleConnectKey}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Google API 키 연결하기
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-center mt-2 text-[9px] text-slate-500 underline"
            >
              Billing Documentation 안내
            </a>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">KEYWORD</label>
            <input 
              type="text" 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              placeholder="e.g. Vintage Camera" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 transition-all shadow-inner" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Style Themes</label>
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
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
            }`}
          >
            {state.isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : "Generate Pixels"}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center relative min-h-[500px]">
        {state.error && (
          <div className="absolute top-10 inset-x-10 max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-center backdrop-blur-md z-30">
            <p className="text-red-400 text-sm font-bold">{state.error}</p>
          </div>
        )}

        <div className="w-full max-w-lg aspect-square bg-slate-900/30 rounded-[3rem] border border-slate-800/50 flex items-center justify-center relative overflow-hidden shadow-2xl group">
          {state.isGenerating ? (
             <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-blue-500 pixel-font text-[10px] animate-pulse tracking-widest">PIXELATING</span>
             </div>
          ) : state.resultImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
              <img 
                src={state.resultImageUrl} 
                className="w-full h-full object-contain pixelated drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]" 
                alt="Generated Pixel Art"
              />
              <div className="absolute bottom-10 flex gap-4 z-20">
                <button 
                  onClick={() => handleDownload(state.resultImageUrl!, keyword)} 
                  className="bg-white text-black px-10 py-4 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Save PNG
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-700">
              <div className="w-24 h-24 mb-6 border-4 border-dashed border-slate-800 rounded-3xl flex items-center justify-center">
                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-bold uppercase tracking-[0.3em] text-xs">Waiting for Input</p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-16 w-full max-w-4xl">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-6 text-center">History</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
              {history.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-20 h-20 flex-shrink-0 bg-slate-900 rounded-2xl p-2 border border-slate-800 hover:border-blue-500/50 transition-all"
                  onClick={() => setState(prev => ({ ...prev, resultImageUrl: item.url }))}
                >
                  <img src={item.url} className="w-full h-full object-contain pixelated" alt="History" />
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
