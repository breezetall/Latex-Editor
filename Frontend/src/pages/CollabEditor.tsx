import { COLLAB_URL } from '../api/config';
import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
//@ts-ignore
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { ViewUpdate } from '@codemirror/view';
import { yCollab } from 'y-codemirror.next';
//@ts-ignore
import { stex } from '@codemirror/legacy-modes/mode/stex';

// LaTeX Support Imports
import { StreamLanguage } from '@codemirror/language';

interface CollabEditorProps {
  fileId: number;
  displayName: string;
  onUpdate: (content: string) => void;
}

const CollabEditor: React.FC<CollabEditorProps> = ({ fileId, displayName, onUpdate }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  
  const nameRef = useRef(displayName);
  nameRef.current = displayName;

  useEffect(() => {
    if (!fileId || !editorRef.current) return;

    const ydoc = new Y.Doc();
    
    const token = localStorage.getItem("token");
    const provider = new WebsocketProvider(
      'ws://' + COLLAB_URL,
      `file-${fileId}`, 
      ydoc,
      { params: { auth: token || '' } }
    );

    const ytext = ydoc.getText('codemirror');

    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    provider.awareness.setLocalStateField('user', {
      name: displayName,
      color: randomColor,
    });

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        console.log("[Yjs] Successfully synced with server. Content length:", ytext.toString().length);
        onUpdateRef.current(ytext.toString());
      }
    }); 

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        StreamLanguage.define(stex), 
        yCollab(ytext, provider.awareness),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            onUpdate(ytext.toString());
          }
        }),
        // Theme
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "transparent" },
          ".cm-content": { 
            fontFamily: "'Fira Code', 'Courier New', monospace", 
            color: "#f8fafc",
            padding: "20px 0" 
          },
          "&.cm-focused": { outline: "none" },
          ".cm-gutters": { 
            backgroundColor: "#0f172a", 
            border: "none", 
            color: "#475569",
            minWidth: "40px"
          },
          ".cm-activeLine": { backgroundColor: "#1e293b55" },
          ".cm-cursor": { borderLeftColor: "#818cf8" }
        }, { dark: true })
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      if (provider) {
        console.log(`Cleaning up connection for file: ${fileId}`);
        provider.destroy(); 
        ydoc.destroy();
        view.destroy();
      } 
    };
  }, [fileId]);

  return (
    <div 
      ref={editorRef} 
      className="flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border-none"
    />
  );
};

export default CollabEditor;