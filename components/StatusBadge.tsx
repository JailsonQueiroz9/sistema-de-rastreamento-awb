
import React from 'react';
import { AWBStatus } from '../types';

interface StatusBadgeProps {
  status: string | AWBStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = String(status || '').toUpperCase();
  
  const getColors = () => {
    if (s.includes('TRANSITO')) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    if (s.includes('DISPONIVEL') || s.includes('OK')) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (s.includes('ATRASADO')) return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
    if (s.includes('ENTREGUE')) return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    return 'text-slate-400 border-slate-700 bg-slate-800/10';
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-widest min-w-[110px] ${getColors()}`}>
      <span className="truncate">{s}</span>
    </div>
  );
};

export default StatusBadge;
