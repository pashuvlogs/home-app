import { useEffect, useRef, useCallback, useState } from 'react';
import { savePart } from '../api/client';

export function useAutoSave(assessmentId, partNum, data, enabled = true) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);
  const dataRef = useRef(data);

  dataRef.current = data;

  const save = useCallback(async () => {
    if (!assessmentId || !partNum || !enabled) return;
    try {
      setSaving(true);
      await savePart(assessmentId, partNum, dataRef.current);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [assessmentId, partNum, enabled]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      save();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, enabled]);

  return { saving, lastSaved, save };
}
