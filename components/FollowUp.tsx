
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCw, Search, List, 
  Edit3, Loader2, FileText,
  Truck, Clock, Plus, LayoutGrid, FileCheck, Calendar, X,
  ChevronRight, Trash2, Info, AlignLeft, Hash, Box,
  Download
} from 'lucide-react';
import { AWBRecord, AWBStatus, FilterState, User, ViewType } from '../types';
import { storageService, formatDate, SHEETS } from '../services/storageService';
import AWBModal from './AWBModal';
import StatusBadge from './StatusBadge';
import { getAttachmentLinks } from './Dashboard';

interface FollowUpProps {
  filters: FilterState;
  isPreMode?: boolean;
}

const FollowUp: React.FC<FollowUpProps> = ({ filters, isPreMode = false }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AWBRecord | undefined>();
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { setCurrentUser(null); }
    }
    loadData();
  }, [isPreMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const sheet = isPreMode ? SHEETS.PRE : SHEETS.AWB;
      const data = await storageService.getRecords(sheet);
      setRecords(data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    // Regra centralizada: acesso a qualquer tela de Follow-Up permite gerenciar registros
    const views = (currentUser.allowedViews || []) as ViewType[];
    return views.includes('follow-up') || views.includes('follow-up-pre');
  }, [currentUser]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente EXCLUIR este registro?')) return;
    setDeletingId(id);
    try {
      const sheet = isPreMode ? SHEETS.PRE : SHEETS.AWB;
      await storageService.deleteRecord(id, sheet);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, r: AWBRecord) => {
    e.stopPropagation();
    setEditingRecord(r);
    setIsModalOpen(true);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const s = searchTerm.toLowerCase();
      const fornecedor = String(r.Fornecedor || r.fornecedor || '').toLowerCase();
      const nfs = String(r["NF's"] || r.nfs || '').toLowerCase();
      const awb = String(r.AWB || r.awbNumber || '').toLowerCase();
      const matchesSearch = fornecedor.includes(s) || nfs.includes(s) || awb.includes(s);
      const currentStatus = (r.Status || r.status) as AWBStatus;
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(currentStatus);
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filters.statuses]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050a14]">
      <header className="px-10 py-8 flex items-center justify-between bg-[#0c1425]/50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl">
             <Clock size={24} />
           </div>
           <div>
             <h1 className="text-xl font-black text-white tracking-widest uppercase italic leading-none">
               FOLLOW-UP {isPreMode ? 'PRÉ-EMBARQUE' : 'EMBARQUE'}
             </h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1.5 italic">
               Gestão Crítica de Fluxo e Agendamento
             </p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 mr-2">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><List size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
          </div>
          
          {hasPermission && (
            <button onClick={() => { setEditingRecord(undefined); setIsModalOpen(true); }} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl glow-blue">
              <Plus size={18} /> NOVO REGISTRO
            </button>
          )}

          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
            <input type="text" placeholder="PESQUISAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0c1425] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[10px] font-black text-white focus:border-blue-500 outline-none uppercase placeholder:text-slate-800" />
          </div>
          <button onClick={loadData} className="p-3 bg-[#0c1425] border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all">
            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-10 custom-scrollbar">
        {loading && records.length === 0 ? (
          <div className="h-full flex items-center justify-center">
             <Loader2 size={40} className="text-blue-500 animate-spin" />
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1000px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
                  <th className="px-4 py-2">Identificador</th>
                  <th className="px-4 py-2">Fornecedor</th>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Docs</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const title = isPreMode ? (r["NF's"] || r.nfs || 'N/A') : (r.AWB || r.awbNumber || 'N/A');
                  const dateVal = isPreMode ? (r["Previsão Agend."] || r.Saída || r.saida) : (r.Saída || r.saida);
                  const pdfs = getAttachmentLinks(r);
                  return (
                    <tr key={r.id || r.ID} className="bg-[#0c1425]/40 hover:bg-[#0c1425]/60 transition-all border border-slate-900 shadow-xl">
                      <td className="px-4 py-6 rounded-l-[24px] text-xs font-black text-blue-500 font-mono tracking-tight">{title}</td>
                      <td className="px-4 py-6 text-xs font-black text-white uppercase">{r.Fornecedor || r.fornecedor}</td>
                      <td className="px-4 py-6 text-xs font-bold text-slate-300">{formatDate(dateVal)}</td>
                      <td className="px-4 py-6"><StatusBadge status={r.Status || r.status || AWBStatus.EM_TRANSITO} /></td>
                      <td className="px-4 py-6 relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); pdfs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID)); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${pdfs.length > 0 ? 'bg-slate-900 border-slate-800 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-slate-950/50 border-slate-900 text-slate-800 cursor-not-allowed opacity-30'}`}
                        >
                           <FileText size={18} />
                           {pdfs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#050a14]">{pdfs.length}</span>}
                        </button>
                        {openDocsId === (r.id || r.ID) && <DocumentDropdown links={pdfs} onClose={() => setOpenDocsId(null)} />}
                      </td>
                      <td className="px-4 py-6 rounded-r-[24px] text-right">
                        {hasPermission && (
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={(e) => handleEdit(e, r)} className="p-3 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Edit3 size={18} /></button>
                             <button onClick={(e) => handleDelete(e, r.id || r.ID)} className="p-3 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRecords.map((r) => {
              const cardTitle = r.Status || r.status || AWBStatus.EM_TRANSITO;
              const dataAgend = isPreMode ? (r["Previsão Agend."] || r.Saída || r.saida) : (r.Saída || r.saida);
              const pdfs = getAttachmentLinks(r);

              return (
                <div key={r.id || r.ID} className="bg-[#0c1425]/40 border border-white/5 rounded-[40px] p-8 hover:bg-[#0c1425] transition-all flex flex-col gap-8 shadow-2xl relative group animate-in zoom-in-95">
                  <div className="absolute top-8 right-8 flex items-center gap-2">
                    {pdfs.length > 0 && (
                      <div className="relative">
                        <button onClick={() => setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))} className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all"><FileCheck size={16} /></button>
                        {openDocsId === (r.id || r.ID) && <DocumentDropdown links={pdfs} onClose={() => setOpenDocsId(null)} isRight />}
                      </div>
                    )}
                    {hasPermission && (
                      <>
                        <button onClick={(e) => handleEdit(e, r)} className="p-2.5 rounded-xl border border-white/5 bg-slate-900 text-slate-500 hover:text-blue-500"><Edit3 size={16} /></button>
                        <button onClick={(e) => handleDelete(e, r.id || r.ID)} className="p-2.5 rounded-xl border border-white/5 bg-slate-900 text-slate-500 hover:text-rose-500"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-[70%]">{cardTitle}</h3>
                    <div className="flex items-center gap-2 mt-4">
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-500/20">
                         {isPreMode ? (r["NF's"] || r.nfs || 'N/A') : (r.AWB || r.awbNumber || 'N/A')}
                       </p>
                    </div>
                  </div>

                  <div className="bg-[#050a14] rounded-[24px] p-6 space-y-4 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Truck size={12} /> FORNECEDOR</span>
                      <span className="text-[10px] font-black text-white uppercase truncate ml-4 text-right">{r.Fornecedor || r.fornecedor || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-white" /> DATA</span>
                      <span className="text-[10px] font-black text-white uppercase">{formatDate(dataAgend)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Hash size={12} /> NF's</span>
                      <span className="text-[10px] font-black text-white uppercase truncate ml-4 text-right">{r["NF's"] || r.nfs || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Box size={12} /> MATERIAL</span>
                      <span className="text-[10px] font-black text-white uppercase truncate ml-4 text-right">{r.Material || r.material || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><AlignLeft size={12} /> OBSERVAÇÃO</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed line-clamp-2">{r.Observação || r.observacao || 'SEM OBSERVAÇÕES'}</p>
                    </div>
                  </div>

                  <button onClick={(e) => hasPermission && handleEdit(e, r)} className={`w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:glow-blue ${hasPermission ? 'text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500' : 'text-slate-800 cursor-not-allowed opacity-50'}`}>
                    {hasPermission ? 'GERENCIAR FLUXO' : 'APENAS LEITURA'} <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AWBModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(undefined); }} onSave={loadData} editingRecord={editingRecord} isNFMode={isPreMode} />
      {openDocsId && <div className="fixed inset-0 z-[60]" onClick={() => setOpenDocsId(null)} />}
    </div>
  );
};

const DocumentDropdown = ({ links, onClose, isRight = false }: { links: string[], onClose: () => void, isRight?: boolean }) => (
  <div className={`absolute ${isRight ? 'right-0' : 'left-0'} top-full mt-2 w-72 bg-[#0c1425] border border-slate-800 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 pointer-events-auto`}>
    <div className="p-4 bg-emerald-600/5 border-b border-slate-800 flex items-center justify-between rounded-t-2xl">
      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Anexos Vinculados ({links.length})</span>
      <button onClick={onClose} className="text-slate-600 hover:text-white"><X size={12}/></button>
    </div>
    <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar bg-[#0c1425] rounded-b-2xl">
      {links.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group">
          <div className="p-2 bg-slate-900 rounded-lg text-slate-600 group-hover:text-emerald-500 transition-colors"><Download size={14} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white uppercase truncate">Documento PDF {i + 1}</p>
            <p className="text-[8px] text-slate-600 font-bold truncate">Download Cloud</p>
          </div>
        </a>
      ))}
    </div>
  </div>
);

export default FollowUp;
