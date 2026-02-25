import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdateDisplayName: (name: string) => void;
  currentName: string;
}

export const ProfileDialog: React.FC<Props> = ({ isOpen, onClose, onUpdateDisplayName, currentName }) => {
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    setDisplayName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="absolute inset-0" onClick={onClose} />
          <div className="relative z-10 bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Edit Profile</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Display Name</p>
            <input 
              autoFocus
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 mb-6 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={() => onUpdateDisplayName(displayName)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm">Save Changes</button>
            </div>
          </div>
        </div>
  );
}