import React, { useState, useEffect, useRef } from 'react';
import { FileText, LogIn, Menu, User } from 'lucide-react';
// @ts-ignore
import { BlockMath } from 'react-katex';
import { useNavigate } from "react-router-dom";
import 'katex/dist/katex.min.css';

import { request, handleLogout } from '../api/client'
import CollabEditor from './CollabEditor';
import { Sidebar } from '../features/editor/components/FileSidebar';
import { Toast } from '../features/editor/components/Toast';

import { NewFileDialog } from '../features/editor/components/dialogs/NewFileDialog';
import { FileShareDialog } from '../features/editor/components/dialogs/FileShareDialog';
import { ProfileDialog } from '../features/editor/components/dialogs/ProfileDialog';

interface FileDto {
  id: number;
  name: string;
}

const LatexEditor: React.FC = () => {
  const [files, setFiles] = useState<FileDto[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [editFileName, setEditFileName] = useState<string>("");
  const [latexInput, setLatexInput] = useState<string>("");
  
  const [isSidebarOpen, setSideBar] = useState<boolean>(true);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileError, setNewFileError] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [autoMessage, setAutoMessage] = useState<string>("");

  //Toast
  const [log, setLog] = useState<string>("");

  // File Sharing
  const [isFileShare, setIsFileShare] = useState<boolean>(false);
  const [sharedInvite, setSharedInvite] = useState<string>("");

  // User Profile State
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");

  const isFirstRender = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchFiles();
      fetchUserProfile();
    } else {
      navigate("/login");
    }
  }, []);

  // Legacy from single user, rendering + debounced autosave
  // useEffect(() => {
  //   if (isFirstRender.current) {
  //     isFirstRender.current = false;
  //     return;
  //   }
    
  //   if (!editFileName) return;

  //   const delayDebouncerFn = setTimeout(() => {
  //     autoSaveFile(editFileName, latexInput);
  //   }, 1000);

  //   return () => clearTimeout(delayDebouncerFn);
  // }, [latexInput]);
  
  const fetchUserProfile = async () => {
    try {
        const response = await request('/api/auth/profile'); 
        if (response.ok) {
            const data = await response.json();
            setDisplayName(data.displayName || data.email); 
        }
    } catch (err) {
        showLog("Profile load failed");
    }
  };  

  const updateProfile = async () => {
    try {
      const response = await request('/api/auth/update', {
        method: 'POST',
        body: JSON.stringify({ displayName })
      });
      if (response.ok) {
        showLog("Profile updated!");
        setIsProfileOpen(false);
      }
    } catch (err) {
      showLog("Update failed");
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await request('/api/latex');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (err) {
      showLog("Backend connection failed");
    }
  };

  const loadFile = async (id: number) => {
    try {
      const response = await request(`/api/latex/${id}`);
      if (response.ok) {
        const file = await response.json();
        setActiveFileId(file.id ?? file.Id);
        setEditFileName(file.name);
        setLatexInput(file.text);
      }
    } catch (err) {
      showLog("Load failed");
    }
  };

  // legacy from single user autosave + debounce
  // const autoSaveFile = async (name: string, text: string) => {
  //   setAutoMessage("Saving...");
  //   try {
  //     const response = await request('/api/latex', {
  //       method: 'POST',
  //       body: JSON.stringify({ id: activeFileId ?? -1, name, text })
  //     });

  //     if (response.ok) {
  //       const saved = await response.json(); 
  //       const actualId = saved.id ?? saved.Id;
  //       setActiveFileId(actualId);
  //       setFiles(prev => prev.map(f => 
  //         (f.name === name && f.id <= 0) ? { ...f, id: actualId } : f
  //       ));
  //       setAutoMessage("");
  //     }
  //   } catch (err) {
  //     setAutoMessage("Save failed");
  //   }
  // };

  const deleteFile = async (id: number) => {
    try {
      const response = await request(`/api/latex/${id}`, { 
        method: 'DELETE'
      });
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
        if (activeFileId === id) {
          setActiveFileId(null);
          setEditFileName("");
          setLatexInput("");
        }
        showLog(`Deleted`);
      }
    } catch (err) {
      showLog("Delete failed");
    }
  };

  const handleAddNewFile = async () => {
    if (!newFileName.trim()) return;

    try {
      const response = await request('/api/latex', {
        method: 'POST',
        body: JSON.stringify({ id: -1, name: newFileName, text: "" })
      });

      if (response.ok) {
        const newFile = await response.json();
        const actualId = newFile.id ?? newFile.Id;
        setActiveFileId(actualId);
        setEditFileName(newFile.name);
        setLatexInput(""); 
        setFiles(prev => [...prev, { id: actualId, name: newFile.name }].sort((a,b) => a.name.localeCompare(b.name)));
        setIsDialogOpen(false);
        setNewFileName("");
        setNewFileError("");
        showLog("Created!");
      } else {
        setNewFileError("Error creating file");
      }
    } catch (err) {
      showLog("Create failed");
    }
  };

  const handleNewFileCancel = async () => { 
    setIsDialogOpen(false);
    setNewFileName("");
    setNewFileError("");
  };

  const handleShareFile = async () => {
    if (!activeFileId || activeFileId <= 0) {
      showLog("Select a file first");
      return;
    }
    if (!sharedInvite.trim()) {
      showLog("Enter an email");
      return;
    }
    
    try {
      const response = await request('/api/access/share', {
        method: 'POST',
        body: JSON.stringify({ 
          FileId: activeFileId, 
          Email: sharedInvite, 
          Permission: 1 
        })
      });

      if (response.ok) {
        setIsFileShare(false);
        showLog(`Shared with ${sharedInvite}`);
        setSharedInvite(""); 
      } else if (response.status === 403) {
        showLog("Only the owner can share this file");
      } else {
        showLog("Sharing failed");
      }
    } catch (err) {
      showLog("Connection error");
    }
  };

  const showLog = (message: string) => {
    setLog(message);
    setTimeout(() => setLog(""), 3000);
  };

  const renderContent = () => {
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
  };

  if (!localStorage.getItem("token")) return null; 

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
                
                <span>Share</span>
              </button>
            </div>
            {autoMessage && <div className="ml-4 text-[10px] font-bold uppercase tracking-widest text-indigo-400 animate-pulse">{autoMessage}</div>}
          </div>
          
          <div className="flex gap-2">
            {/* Profile Button */}
            <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
              <User size={18} className="text-indigo-600" /> {displayName || "Profile"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
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
                      onUpdate={(content) => setLatexInput(content)} 
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
                  {renderContent()}
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