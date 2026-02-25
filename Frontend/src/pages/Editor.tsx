import React, { useState, useEffect, useCallback } from 'react';
import { FileText, LogIn, Menu, User } from 'lucide-react';
// @ts-ignore
import { BlockMath } from 'react-katex';
import { useNavigate } from "react-router-dom";
import 'katex/dist/katex.min.css';

import { useAuth } from '../context/useAuth';
import { useFiles } from '../hooks/useFiles';
import { useToast } from '../hooks/useToast';

import { request } from '../api/client'
import CollabEditor from './CollabEditor';
import { Sidebar } from '../features/editor/components/FileSidebar';
import { Toast } from '../features/editor/components/Toast';

import { NewFileDialog } from '../features/editor/components/dialogs/NewFileDialog';
import { FileShareDialog } from '../features/editor/components/dialogs/FileShareDialog';
import { ProfileDialog } from '../features/editor/components/dialogs/ProfileDialog';

const LatexEditor: React.FC = () => {
  const { displayName, fetchUserProfile, updateProfile, logout } = useAuth(); // auth context
  const { log, showLog } = useToast(); // toast hook

  const { 
    files, activeFileId, editFileName, latexInput, setLatexInput, 
    fetchFiles, loadFile, deleteFile, createFile 
  } = useFiles(); // Files (CRUD) hook
  
  const [isSidebarOpen, setSideBar] = useState<boolean>(true);
  const [newFileError, setNewFileError] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // File Sharing
  const [isFileShare, setIsFileShare] = useState<boolean>(false);
  // const [sharedInvite, setSharedInvite] = useState<string>("");

  // User Profile State
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchFiles();
      fetchUserProfile();
    } else {
      navigate("/login");
    }
  }, []);

  const handleAddNewFile = async (newFileName: string) => {
    const result = await createFile(newFileName);
    if (result.success) {
      setIsDialogOpen(false);
      showLog("New file created");
    } else {
      setIsDialogOpen(false);
      showLog("Failed to create file");
    }
  };

  const handleNewFileCancel = async () => { 
    setIsDialogOpen(false);
    setNewFileError("");
  };

  const handleShareFile = async (emailFromDialog: string) => {
    if (!activeFileId || activeFileId <= 0) {
      showLog("Select a file first");
      return;
    }
    console.log(emailFromDialog)
    if (!emailFromDialog.trim()) {
      showLog("Enter an email " + emailFromDialog);
      return;
    }
    
    try {
      const response = await request('/api/access/share', {
        method: 'POST',
        body: JSON.stringify({ 
          FileId: activeFileId, 
          Email: emailFromDialog, 
          Permission: 1 
        })
      });

      if (response.ok) {
        setIsFileShare(false);
        showLog(`Shared with ${emailFromDialog}`);
        // setSharedInvite(""); 
      } else if (response.status === 403) {
        showLog("Only the owner can share this file");
      } else {
        showLog("Sharing failed");
      }
    } catch (err) {
      showLog("Connection error");
    }
  };

  const renderedLatex = React.useMemo(() => {
    return latexInput.split(/(\$\$.*?\$\$)/gs).map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return (
          <div key={index} className="my-2 py-2 text-center">
            <BlockMath math={part.slice(2, -2) || " "} />
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap leading-relaxed">{part}</span>;
    });
  }, [latexInput]);

  const handleUpdate = useCallback((content: string) => {
    console.log("updating file");
    setLatexInput(content); 
  }, [setLatexInput]);  

  if (!localStorage.getItem("token")) return null; 

  console.log("DEBUG: Current activeFileId:", activeFileId, "Type:", typeof activeFileId);

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {isSidebarOpen && (
        <Sidebar 
          files={files}
          activeFileId={activeFileId}
          onLoadFile={loadFile}
          onDeleteFile={deleteFile}
          onOpenNewFileDialog={() => setIsDialogOpen(true)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex-none flex justify-between items-center px-6 bg-slate-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSideBar(!isSidebarOpen)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Real-Time LaTeX Editor</p>
              <h2 className="text-sm font-mono text-indigo-600 font-bold leading-none">{editFileName || "No File Selected"}</h2>
            </div>
            <div>
              <button 
                onClick={() => setIsFileShare(true)} 
                className="flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm text-slate-700"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-indigo-600 transition-colors">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor" 
                    className="w-4.5 h-4.5"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" 
                    />
                  </svg>
                </div>
                
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Profile Button */}
            <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
              <User size={18} className="text-indigo-600" /> {displayName || "Profile"}
            </button>
            <button onClick={logout} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
              <LogIn size={18} className="text-red-600" /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-hidden">
          {editFileName ? (
            <section className="h-full flex gap-4 min-w-0">
              <div className="flex-1 flex flex-col min-w-0">
                  <div className="h-6 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Source Editor</span>
                  </div>
                  {activeFileId ? (
                    <CollabEditor 
                      key={activeFileId} 
                      fileId={activeFileId} 
                      displayName={displayName || "Anonymous"} 
                      onUpdate={handleUpdate} 
                    />
                  ) : (
                    <div className="flex-1 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-500 italic">
                      Select a file to start editing...
                    </div>
                  )}
                </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="h-6 mb-1"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Live Preview</span></div>
                <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-inner p-8 overflow-auto text-slate-800 font-serif">
                  {renderedLatex}
                </div>
              </div>
            </section>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
              <div className="text-center">
                <FileText size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Select a document or create a new one to begin</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <NewFileDialog 
        isOpen={isDialogOpen} 
        onClose={handleNewFileCancel} 
        onCreate={handleAddNewFile} 
        error={newFileError}
      />

      <FileShareDialog 
        isOpen={isFileShare} 
        onClose={() => setIsFileShare(false)} 
        onShare={handleShareFile}
      />

      <ProfileDialog 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpdateDisplayName={updateProfile} 
        currentName={displayName} 
      />

      {log && <Toast message={log} />}
    </div>
  );
};

export default LatexEditor;