import { useState, useCallback } from 'react';
import { request } from '../api/client';
import { useToast } from './useToast';

interface FileDto {
  id: number;
  name: string;
}

export const useFiles = () => {
  const { showLog } = useToast();
  const [files, setFiles] = useState<FileDto[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [editFileName, setEditFileName] = useState<string>("");
  const [latexInput, setLatexInput] = useState<string>("");

  const fetchFiles = useCallback(async () => {
    try {
      const response = await request('/api/latex');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (err) {
      showLog("Backend connection failed");
    }
  }, [showLog]);

  const loadFile = useCallback(async (id: number) => {
    try {
      console.log(`[useFiles] loadFile triggered for ID: ${id}`);
      const response = await request(`/api/latex/${id}`);
      if (response.ok) {
        const file = await response.json();
        const actualId = Number(file.id ?? file.Id);
        
        setActiveFileId(actualId);
        setEditFileName(file.name);
        
        // LOGGING: Confirming this is skipped
        console.log(`[useFiles] loadFile: Skipping setLatexInput for file: ${file.name}. Waiting for Yjs...`);
      }
    } catch (err) {
      showLog("Load failed");
    }
  }, [showLog]);

  const deleteFile = useCallback(async (id: number) => {
    try {
      const response = await request(`/api/latex/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
        setActiveFileId(prev => (prev === id ? null : prev));
        setEditFileName("");
        
        console.log(`[useFiles] deleteFile: Resetting latexInput to empty string`);
        setLatexInput(""); 
        
        showLog("Deleted");
      }
    } catch (err) {
      showLog("Delete failed");
    }
  }, [showLog]);

  const createFile = useCallback(async (name: string) => {
    try {
      const response = await request('/api/latex', {
        method: 'POST',
        body: JSON.stringify({ id: -1, name, text: "" })
      });

      if (response.ok) {
        const newFile = await response.json();
        const actualId = Number(newFile.id ?? newFile.Id);
        
        setActiveFileId(actualId);
        setEditFileName(newFile.name);
        
        console.log(`[useFiles] createFile: Initializing empty latexInput for new file: ${name}`);
        setLatexInput("");
        
        setFiles(prev => [...prev, { id: actualId, name: newFile.name }].sort((a, b) => a.name.localeCompare(b.name)));
        showLog("Created!");
        return { success: true };
      }
    } catch (err) {
      showLog("Create failed");
    }
    return { success: false };
  }, [showLog]);

  const stableSetLatexInput = useCallback((val: string) => {
    console.log(`[useFiles] setLatexInput called. Length: ${val.length} characters.`);
    setLatexInput(val);
  }, []);

  return {
    files,
    activeFileId,
    editFileName,
    latexInput,
    setLatexInput: stableSetLatexInput,
    fetchFiles,
    loadFile,
    deleteFile,
    createFile
  };
};