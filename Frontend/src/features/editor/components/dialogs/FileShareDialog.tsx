import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string) => void;
}

export const FileShareDialog: React.FC<Props> = ({ isOpen, onClose, onShare }) => {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!isOpen) setEmail("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 group">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      <div className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-sm border border-slate-50 transform transition-all scale-100">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Share access</h3>
        <p className="text-slate-500 text-sm mt-2 mb-8 font-medium">Add an email to give them full access to this project.</p>
        
        <div className="space-y-2 mb-8">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-500 ml-1">
            User Email
          </label>
          <input 
            autoFocus
            placeholder="e.g. alex@company.com"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
            value={email}
            onChange={(x) => setEmail(x.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onShare(email)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onShare(email)} 
            disabled={!email.includes('@')}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.97] transition-all text-sm disabled:opacity-50"
          >
            Send Invite
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}