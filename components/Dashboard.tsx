
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, RotateCw, Search, Trash2, Package, 
  FileText, Edit3, Loader2, ExternalLink, ChevronDown,
  LayoutGrid, List, ChevronRight, Calendar, Box, Truck,
  Download, ArrowUpDown, ChevronUp, X, FileCheck, AlignLeft,
  Link as LinkIcon, Globe
} from 'lucide-react';
import { AWBRecord, AWBStatus, FilterState, User, ViewType } from '../types';
import { storageService, getApiUrl, formatDate, SHEETS } from '../services/storageService';
import AWBModal from './AWBModal';
import StatusBadge from './StatusBadge';

// Helper universal para extrair todos os PDFs de todas as colunas possíveis
export const getAttachmentLinks = (r: AWBRecord): string[] => {
  const links: string[] = [];
  
  // 1. Verificar coluna principal 'Documentos'
  const mainDocs = r.Documentos || r.documentos;
  if (mainDocs) {
    String(mainDocs).split('|').forEach(l => {
      const t = l.trim();
      if (t.startsWith('http')) links.push(t);
    });
  }

  // 2. Verificar colunas dinâmicas PDF_1 até PDF_11
  for (let i = 1; i <= 11; i++) {
    const key = `PDF_${i}`;
    const val = r[key];
    if (val && String(val).trim().startsWith('http')) {
      links.push(String(val).trim());
    }
  }

  return Array.from(new Set(links)); // Remove duplicatas
};

interface DashboardProps {
  filters: FilterState;
}

const Dashboard: React.FC<DashboardProps> = ({ filters }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AWBRecord | undefined>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('dashboard_view_mode') as 'table' | 'grid') || 'table';
  });

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { setCurrentUser(null); }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords(SHEETS.AWB);
      setRecords(data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja EXCLUIR este registro permanentemente?')) return;
    setDeletingId(id);
    try {
      await storageService.deleteRecord(id, SHEETS.AWB);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, record: AWBRecord) => {
    e.stopPropagation();
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const hasPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    // Regra: Somente quem tem acesso às telas de Follow-up (AWB ou PRÉ) pode criar/editar
    const views = (currentUser.allowedViews || []) as ViewType[];
    return views.includes('follow-up') || views.includes('follow-up-pre');
  }, [currentUser]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const s = searchTerm.toLowerCase();
      const searchStr = `${r.Fornecedor} ${r.AWB} ${r["NF's"]} ${r.Marca} ${r.Material} ${r.Rastreio}`.toLowerCase();
      const matchesSearch = searchStr.includes(s);
      const currentStatus = (r.Status || r.status) as AWBStatus;
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(currentStatus);
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filters.statuses]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050a14]">
      
      <header className="px-10 py-8 flex items-center justify-between border-b border-slate-900 bg-[#0c1425]/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
              <Package size={28} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Painel de Monitoramento</h2>
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic">Data Matrix Integrated v3.2</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><List size={18} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
           </div>
           <button onClick={loadData} className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
              <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           {hasPermission && (
             <button onClick={() => { setEditingRecord(undefined); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl glow-blue flex items-center gap-3 transition-all active:scale-95">
               <Plus size={18} /> Novo Embarque
             </button>
           )}
        </div>
      </header>

      <div className="px-10 py-6 border-b border-slate-900 bg-[#0c1425]/30 flex items-center gap-6">
        <div className="relative flex-1 group">
           <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
           <input type="text" placeholder="PESQUISAR CARGA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0d1425] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-[11px] font-black text-white uppercase focus:border-blue-500 outline-none transition-all placeholder:text-slate-800" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-lg">{filteredRecords.length} Resultados</p>
      </div>

      <main className="flex-1 overflow-auto p-10 custom-scrollbar">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1600px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
                  <th className="px-4 py-2">Fornecedor</th>
                  <th className="px-4 py-2">Saída</th>
                  <th className="px-4 py-2">NF's</th>
                  <th className="px-4 py-2">AWB</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Rastreio</th>
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Observação</th>
                  <th className="px-4 py-2">Docs</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const pdfs = getAttachmentLinks(r);
                  const trackVal = r.Rastreio || r.rastreio;
                  return (
                    <tr key={r.id || r.ID} className="bg-[#0c1425]/40 hover:bg-[#0c1425]/60 transition-all border border-slate-900 shadow-xl">
                      <td className="px-4 py-6 rounded-l-[24px] text-xs font-black text-white uppercase">{r.Fornecedor || r.fornecedor}</td>
                      <td className="px-4 py-6 text-xs font-bold text-slate-300">{formatDate(r.Saída || r.saida)}</td>
                      <td className="px-4 py-6 text-[11px] font-bold text-slate-400">{r["NF's"] || r.nfs || '-'}</td>
                      <td className="px-4 py-6 text-xs font-black text-blue-500 font-mono tracking-tighter">{r.AWB || r.awbNumber}</td>
                      <td className="px-4 py-6"><StatusBadge status={r.Status || r.status || AWBStatus.EM_TRANSITO} /></td>
                      <td className="px-4 py-6">
                        {trackVal ? (
                          <a 
                            href={String(trackVal).startsWith('http') ? String(trackVal) : `https://www.google.com/search?q=${trackVal}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 text-emerald-400 hover:text-white transition-all group"
                          >
                             <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Globe size={12} />
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Rastrear</span>
                          </a>
                        ) : (
                          <span className="text-slate-800">-</span>
                        )}
                      </td>
                      <td className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase">{r.Material || r.material || '-'}</td>
                      <td className="px-4 py-6 text-[10px] font-bold text-slate-600 uppercase max-w-[200px] truncate" title={r.Observação || r.observacao}>{r.Observação || r.observacao || '-'}</td>
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
              const pdfs = getAttachmentLinks(r);
              const trackVal = r.Rastreio || r.rastreio;
              return (
                <div key={r.id || r.ID} className="bg-[#0c1425]/40 border border-slate-900 rounded-[32px] p-8 hover:bg-[#0c1425] transition-all flex flex-col gap-6 group relative shadow-2xl animate-in zoom-in-95">
                   <div className="flex justify-between items-start">
                      <StatusBadge status={r.Status || r.status || AWBStatus.EM_TRANSITO} />
                      <div className="flex items-center gap-1">
                        {trackVal && (
                          <a href={String(trackVal).startsWith('http') ? String(trackVal) : `https://www.google.com/search?q=${trackVal}`} target="_blank" rel="noreferrer" className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Rastrear Carga">
                            <Globe size={16} />
                          </a>
                        )}
                        {pdfs.length > 0 && (
                          <div className="relative">
                            <button onClick={() => setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))} className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                               <FileCheck size={16} />
                            </button>
                            {openDocsId === (r.id || r.ID) && <DocumentDropdown links={pdfs} onClose={() => setOpenDocsId(null)} isRight />}
                          </div>
                        )}
                        {hasPermission && (
                          <>
                            <button onClick={(e) => handleEdit(e, r)} className="p-2.5 text-slate-600 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={(e) => handleDelete(e, r.id || r.ID)} className="p-2.5 text-slate-800 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                   </div>
                   
                   <div>
                      <h4 className="text-xl font-black text-white font-mono italic tracking-tighter uppercase truncate">{r.AWB || r.awbNumber}</h4>
                      <div className="flex flex-col gap-2 mt-4">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <Truck size={12} className="text-blue-500" /> {r.Fornecedor || r.fornecedor}
                         </p>
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-5">
                           NF: {r["NF's"] || r.nfs || 'N/A'}
                         </p>
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                           <Box size={12} className="text-blue-500" /> {r.Material || r.material || '-'}
                         </p>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                        <AlignLeft size={12} /> Observação
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed line-clamp-2 italic" title={r.Observação || r.observacao}>
                        {r.Observação || r.observacao || 'SEM OBSERVAÇÃO'}
                      </p>
                   </div>

                   <div className="mt-auto pt-6 border-t border-slate-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-white" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{formatDate(r.Saída || r.saida)}</span>
                      </div>
                      <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">{r.Marca || r.marca || '-'}</span>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AWBModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(undefined); }} onSave={loadData} editingRecord={editingRecord} />
      {openDocsId && <div className="fixed inset-0 z-[60]" onClick={() => setOpenDocsId(null)} />}
    </div>
  );
};

const DocumentDropdown = ({ links, onClose, isRight = false }: { links: string[], onClose: () => void, isRight?: boolean }) => (
  <div className={`absolute ${isRight ? 'right-0' : 'left-0'} top-full mt-2 w-72 bg-[#0c1425] border border-slate-800 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 pointer-events-auto`}>
    <div className="p-4 bg-emerald-600/5 border-b border-slate-800 flex items-center justify-between rounded-t-2xl">
      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Documentação Digital</span>
      <button onClick={onClose} className="text-slate-600 hover:text-white"><X size={12}/></button>
    </div>
    <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar bg-[#0c1425] rounded-b-2xl">
      {links.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group">
          <div className="p-2 bg-slate-900 rounded-lg text-slate-600 group-hover:text-emerald-500 transition-colors"><Download size={14} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white uppercase truncate">Anexo PDF {i + 1}</p>
            <p className="text-[8px] text-slate-600 font-bold truncate">Visualizar Cloud Storage</p>
          </div>
          <ChevronRight size={14} className="text-slate-800 group-hover:text-emerald-500" />
        </a>
      ))}
    </div>
  </div>
);

export default Dashboard;
