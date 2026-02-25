import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  error?: string;
}

export const NewFileDialog: React.FC<Props> = ({ isOpen, onClose, onCreate, error }) => {
  const [name, setName] = useState("");

  useEffect(() => {
      if (!isOpen) setName("");
    }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10 bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-2">New File</h3>
        <input 
            autoFocus
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 mb-6 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate(name)}
        />
        {error && (
            <div className='bg-red-50 border border-red-100 text-red-600 text-xs font-bold py-2 px-4 rounded-xl text-center mb-4 animate-in fade-in zoom-in duration-200">'>
            {error}
            </div>
        )}
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
            <button onClick={() => onCreate(name)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm">Create</button>
        </div>
        </div>
    </div>
  );
};