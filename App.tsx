
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
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultImageUrl: null,
    originalResult: null
  });

  const geminiService = useRef(new GeminiService());

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          // Also check if process.env.API_KEY actually has a value
          setHasKey(selected && !!process.env.API_KEY);
        } catch (e) {
          setHasKey(false);
        }
      } else {
        setHasKey(!!process.env.API_KEY);
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // After triggering the dialog, we assume a key will be available
        setHasKey(true);
        setState(prev => ({ ...prev, error: null }));
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    // Verify key existence just before call
    if (!process.env.API_KEY && window.aistudio) {
      setState(prev => ({ ...prev, error: "API Key not found in environment. Please select a key." }));
      await handleConnectKey();
      return; 
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
      const msg = err.message || String(err);
      
      if (msg.includes("API Key must be set") || msg.includes("401") || msg.includes("404") || msg.includes("Requested entity was not found")) {
        errorMessage = "API key missing or invalid. Please select a key from a paid project.";
        setHasKey(false);
      } else if (msg.includes("BILLING_REQUIRED")) {
        errorMessage = "Billing not enabled. Please use a project with an active billing account.";
      } else if (msg.includes("SAFETY")) {
        errorMessage = "Request blocked by safety filters.";
      } else {
        errorMessage = `API Error: ${msg}`;
      }

      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-[400px] bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto shadow-2xl z-20">
        <div className="mb-10">
          <h1 className="pixel-font text-2xl text-blue-400 tracking-tighter">Pi-XEL</h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-[0.3em]">AI Pixel Art Lab</p>
        </div>

        {(!hasKey || !process.env.API_KEY) && (
          <div className="mb-8 p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Action Required
            </h4>
            <p className="text-slate-400 text-[11px] mb-4 leading-relaxed">
              Image generation requires an API key from a <strong>paid GCP project</strong>.
            </p>
            <button 
              onClick={handleConnectKey}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Connect API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-center mt-3 text-[9px] text-slate-500 underline uppercase tracking-widest hover:text-slate-300"
            >
              Billing Documentation
            </a>
          </div>
        )}

        <div className="space-y-8">
          <div className="group">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest group-focus-within:text-blue-400 transition-colors">Prompt Keyword</label>
            <input 
              type="text" 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              placeholder="e.g. Neon Sword" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 transition-all shadow-inner placeholder:text-slate-700" 
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
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
            }`}
          >
            {state.isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : "Generate Pixel Art"}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center relative min-h-[600px]">
        {state.error && (
          <div className="absolute top-10 inset-x-10 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center backdrop-blur-md z-30 animate-in fade-in zoom-in-95">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{state.error}</p>
          </div>
        )}

        <div className="w-full max-w-lg aspect-square bg-slate-900/30 rounded-[3rem] border border-slate-800/50 flex items-center justify-center relative overflow-hidden shadow-2xl">
          {state.isGenerating ? (
             <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-500/10 rounded-full scale-150 animate-pulse"></div>
                  <div className="absolute top-0 w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <span className="text-blue-500 pixel-font text-[10px] block mb-2 tracking-[0.2em]">PIXELATING...</span>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">Rendering Dot Matrix</p>
                </div>
             </div>
          ) : state.resultImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 animate-in zoom-in-95 duration-500">
              <img 
                src={state.resultImageUrl} 
                className="w-full h-full object-contain pixelated drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]" 
                alt="Generated Pixel Art"
              />
              <div className="absolute bottom-12 flex gap-4">
                <button 
                  onClick={() => downloadImage(state.resultImageUrl!, keyword)} 
                  className="bg-white text-black px-12 py-4 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                >
                  Download Image
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

        {history.length > 0 && (
          <div className="mt-20 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] mb-8 text-center">Recent Creations</h3>
            <div className="flex gap-6 overflow-x-auto pb-6 px-4 justify-center no-scrollbar">
              {history.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-2xl p-3 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all group relative"
                  onClick={() => setState(prev => ({ ...prev, resultImageUrl: item.url }))}
                >
                  <img src={item.url} className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform" alt="History" />
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
