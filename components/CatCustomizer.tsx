
import React, { useState, useRef } from 'react';
import { generateCustomCat } from '../services/geminiService';
import { Outfit } from '../types';

interface CatCustomizerProps {
  onSave: (name: string, url: string | null, outfits: Outfit[]) => void;
  onCancel: () => void;
  currentUrl: string | null;
  currentName: string;
  savedOutfits: Outfit[];
}

const CatCustomizer: React.FC<CatCustomizerProps> = ({ onSave, onCancel, currentUrl, currentName, savedOutfits }) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState(currentName);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [statusMsg, setStatusMsg] = useState('Tell me how your beach kitty should look!');
  const [outfits, setOutfits] = useState<Outfit[]>(savedOutfits);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsGenerating(true);
    setStatusMsg('Polishing the claws and prepping the fur...');
    
    const url = await generateCustomCat(description);
    
    if (url) {
      setPreviewUrl(url);
      setStatusMsg('Wow! You look paws-itively stunning!');
    } else {
      setStatusMsg('Oops! The litter box got messy. Try again?');
    }
    setIsGenerating(false);
  };

  const saveOutfit = () => {
    if (!previewUrl) return;
    const cleanName = name.trim() || "Unnamed Outfit";
    const newOutfit: Outfit = {
      id: Date.now().toString(),
      name: cleanName,
      url: previewUrl
    };
    setOutfits(prev => [...prev, newOutfit]);
    setStatusMsg("Outfit saved to your collection!");
  };

  const selectOutfit = (outfit: Outfit) => {
    setPreviewUrl(outfit.url);
    setName(outfit.name);
    setStatusMsg(`Selected ${outfit.name}!`);
  };

  const deleteOutfit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOutfits(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="z-50 bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-amber-300 w-full max-w-4xl flex flex-col gap-8 animate-[bounceIn_0.5s_ease-out] max-h-[90vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-amber-900 italic tracking-tighter uppercase mb-2">Kitty Closet</h2>
        <p className="text-slate-500 font-bold">{statusMsg}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT SECTION: Main Customizer */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Preview Box */}
            <div className="w-48 h-48 flex-shrink-0 bg-amber-50 rounded-[2rem] border-4 border-amber-200 shadow-inner flex items-center justify-center overflow-hidden relative group">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain" 
                  style={{ mixBlendMode: 'multiply' }}
                />
              ) : (
                <div className="text-4xl">🐾</div>
              )}
              {isGenerating && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-grow flex flex-col gap-4 w-full">
               <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter Kitty Name..."
                  className="w-full p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 outline-none font-bold text-slate-900 shadow-sm transition-all placeholder:text-slate-400"
                />
                <div className="absolute -top-3 -left-2 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-10">
                  Kitty Name
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. wearing pink sunglasses and a floral hawaiian shirt"
                  className="w-full p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none h-24 font-medium text-slate-900 resize-none shadow-sm transition-all placeholder:text-slate-400"
                  disabled={isGenerating}
                />
                <div className="absolute -top-3 -left-2 bg-indigo-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-10">
                  New Look Description
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                {isGenerating ? 'Generating...' : 'Customize Look'}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={saveOutfit}
              disabled={!previewUrl}
              className="flex-grow bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Save Look to Closet
            </button>
          </div>
        </div>

        {/* RIGHT SECTION: Saved Outfits */}
        <div className="flex flex-col gap-4">
           <h3 className="text-xl font-black text-amber-900 uppercase italic tracking-tighter">My Collection</h3>
           <div className="bg-amber-50/50 rounded-[2rem] border-2 border-amber-100 p-6 flex-grow min-h-[300px] max-h-[400px] overflow-y-auto">
              {outfits.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                   {outfits.map(outfit => (
                     <div 
                      key={outfit.id} 
                      onClick={() => selectOutfit(outfit)}
                      className="group relative aspect-square bg-white rounded-2xl border-2 border-white hover:border-amber-400 transition-all cursor-pointer shadow-sm overflow-hidden"
                     >
                       <img 
                         src={outfit.url} 
                         alt={outfit.name} 
                         className="w-full h-full object-contain p-2" 
                         style={{ mixBlendMode: 'multiply' }}
                       />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-white font-black uppercase truncate w-full">{outfit.name}</span>
                       </div>
                       <button 
                        onClick={(e) => deleteOutfit(outfit.id, e)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                       >
                         ×
                       </button>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                   <div className="text-4xl">🧥</div>
                   <p className="font-bold text-center">Your collection is empty!<br/>Save a look to see it here.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="flex gap-4 border-t-2 border-amber-50 pt-6">
        <button
          onClick={onCancel}
          className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
        >
          Discard Changes
        </button>
        <button
          onClick={() => onSave(name.trim(), previewUrl, outfits)}
          className="flex-grow bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-green-200"
        >
          Equip & Exit
        </button>
      </div>
    </div>
  );
};

export default CatCustomizer;
