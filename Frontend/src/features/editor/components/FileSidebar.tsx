import React from 'react';
import { FileText, Plus, X } from 'lucide-react';

interface FileDto {
  id: number;
  name: string;
}

interface SidebarProps {
  files: FileDto[];
  activeFileId: number | null;
  onLoadFile: (id: number) => void;
  onDeleteFile: (id: number) => void;
  onOpenNewFileDialog: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  activeFileId, 
  onLoadFile, 
  onDeleteFile, 
  onOpenNewFileDialog 
}) => {
  return (
    <aside className="w-72 flex-none bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
        <h2 className="font-bold flex items-center gap-2 text-slate-700 text-sm">
          <FileText size={16} className="text-indigo-500" /> Documents
        </h2>
        <button 
          onClick={onOpenNewFileDialog} 
          className="bg-indigo-600 text-white p-1 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {files.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs italic">No files found</div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex group items-center">
              <button 
                onClick={() => onLoadFile(file.id)}
                className={`flex-grow text-left px-3 py-2 text-sm rounded-xl transition-all ${
                  activeFileId === file.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {file.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 px-2 text-slate-300 hover:text-red-500 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};