import { useState, useCallback } from 'react';

export const useToast = () => {
  const [log, setLog] = useState<string>("");

  const showLog = useCallback((message: string, duration = 3000) => {
    setLog(message);
    setTimeout(() => {
      setLog((current) => (current === message ? "" : current));
    }, duration);
  }, []);

  return { log, showLog };
};