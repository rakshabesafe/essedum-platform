import { useEffect } from 'react';
import { useFlowStore } from '../../store/flowStore';

export function KeyboardShortcuts() {
  const { saveFlow, newFlow, runFlow, stopExecution, execution } = useFlowStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); saveFlow(); }
      if (ctrl && e.key === 'n') { e.preventDefault(); newFlow(); }
      if (ctrl && e.key === 'Enter') { e.preventDefault(); if (execution.status === 'running') stopExecution(); else runFlow(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveFlow, newFlow, runFlow, stopExecution, execution.status]);

  return null;
}
