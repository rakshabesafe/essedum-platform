import { useContext } from 'react';
import { FlowContext } from './FlowContext';

export function useFlowStore() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlowStore must be used within FlowProvider');
  return ctx;
}
