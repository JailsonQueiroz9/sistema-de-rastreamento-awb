
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, FileText, 
  Loader2, Mail, ChevronDown, Upload, Paperclip, Zap,
  Truck, Hash, Calendar, Box, Link as LinkIcon, Info, FileStack
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService, toInputDate, SHEETS } from '../services/storageService';
import EmailChipInput from './EmailChipInput';

interface AWBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRecord?: AWBRecord;
  isNFMode?: boolean; 
}

const AWBModal: React.FC<AWBModalProps> = ({ isOpen, onClose, onSave, editingRecord, isNFMode = false }) => {
  const [formData, setFormData] = useState<any>({
    Fornecedor: '', Saída: '', "NF's": '', AWB: '', Status: AWBStatus.EM_TRANSITO,
    Chegada: '', Marca: '', Material: '', Observação: '', Rastreio: '', Documentos: '',
    send_email: false, email_to: [], email_cc: [], email_bcc: [], email_body: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false); 
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRecord) {
      const dataSaida = isNFMode 
        ? (editingRecord["Previsão Agend."] || editingRecord.Saída || editingRecord.saida)
        : (editingRecord.Saída || editingRecord.saida);
      
      const linkRef = isNFMode 
        ? (editingRecord["Link Agendamento"] || editingRecord.Rastreio || editingRecord.rastreio)
        : (editingRecord.Rastreio || editingRecord.rastreio);

      setFormData({
        ...editingRecord,
        ID: editingRecord.id || editingRecord.ID,
        Fornecedor: editingRecord.Fornecedor || editingRecord.fornecedor || '',
        Saída: toInputDate(dataSaida),
        "NF's": editingRecord["NF's"] || editingRecord.nfs || '',
        AWB: editingRecord.AWB || editingRecord.awbNumber || '',
        Status: editingRecord.Status || editingRecord.status || AWBStatus.EM_TRANSITO,
        Chegada: toInputDate(editingRecord.Chegada || editingRecord.chegada),
        Marca: editingRecord.Marca || editingRecord.marca || '',
        Material: editingRecord.Material || editingRecord.material || '',
        Observação: editingRecord.Observação || editingRecord.observacao || '',
        Rastreio: linkRef || '',
        Documentos: editingRecord.Documentos || editingRecord.documentos || '',
        send_email: editingRecord.send_email || false,
        email_to: editingRecord.email_to ? String(editingRecord.email_to).split(',').filter(e => e.trim()) : [],
        email_cc: editingRecord.email_cc ? String(editingRecord.email_cc).split(',').filter(e => e.trim()) : [],
        email_bcc: editingRecord.email_bcc ? String(editingRecord.email_bcc).split(',').filter(e => e.trim()) : [],
        email_body: editingRecord.email_body || ''
      });
      setPendingFiles([]);
    } else {
      setFormData({
        Fornecedor: '', Saída: '', "NF's": '', AWB: isNFMode ? '-' : '', Status: AWBStatus.EM_TRANSITO,
        Chegada: '', Marca: '', Material: '', Observação: '', Rastreio: '', Documentos: '',
        send_email: false, email_to: [], email_cc: [], email_bcc: [], email_body: ''
      });
      setPendingFiles([]);
    }
    setShowEmailSection(false);
  }, [editingRecord, isOpen, isNFMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalDocs = formData.Documentos || '';
      if (pendingFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of pendingFiles) {
          const url = await storageService.uploadFile(file);
          uploadedUrls.push(url);
        }
        const existingDocs = String(finalDocs).split('|').filter(l => l.trim().startsWith('http'));
        finalDocs = [...existingDocs, ...uploadedUrls].join('|');
      }

      const payload: any = {
        ID: formData.ID || Math.random().toString(36).substring(2, 11),
        Fornecedor: formData.Fornecedor,
        "NF's": formData["NF's"],
        Status: formData.Status,
        Chegada: formData.Chegada,
        Marca: formData.Marca,
        Material: formData.Material,
        Observação: formData.Observação,
        Documentos: finalDocs,
        send_email: formData.send_email,
        email_to: formData.email_to.join(','),
        email_cc: formData.email_cc.join(','),
        email_bcc: formData.email_bcc.join(','),
        email_body: formData.email_body
      };

      if (isNFMode) {
        payload["Previsão Agend."] = formData.Saída;
        payload["Link Agendamento"] = formData.Rastreio;
        payload["AWB"] = "-";
      } else {
        payload["Saída"] = formData.Saída;
        payload["AWB"] = formData.AWB;
        payload["Rastreio"] = formData.Rastreio;
      }

      await storageService.saveRecord(payload, isNFMode ? SHEETS.PRE : SHEETS.AWB);
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050a14]/95 backdrop-blur-md overflow-hidden">
      <div className="bg-[#0b1221] w-full max-w-4xl rounded-[24px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-10 py-8 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase italic">
              {editingRecord ? (isNFMode ? 'ATUALIZAR PRÉ-EMBARQUE' : 'ATUALIZAR EMBARQUE') : (isNFMode ? 'NOVO PRÉ-EMBARQUE' : 'LANÇAMENTO AWB')}
            </h2>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.5em]">ENTERPRISE DATABASE CLOUD</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10 space-y-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Truck size={12} className="text-white" /> Fornecedor
              </label>
              <input required value={formData.Fornecedor} onChange={(e) => setFormData({...formData, Fornecedor: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white uppercase outline-none focus:border-blue-600/50 transition-all placeholder:text-slate-700" placeholder="NOME DO PARCEIRO" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hash size={12} className="text-white" /> NF's
              </label>
              <input required value={formData["NF's"]} onChange={(e) => setFormData({...formData, "NF's": e.target.value})} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white outline-none focus:border-blue-600/50 transition-all placeholder:text-slate-700" placeholder="1084759" />
            </div>

            {/* Campo de Data Estilizado Conforme Imagem */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} className="text-blue-500" /> {isNFMode ? 'PREVISÃO AGEND.' : 'PREVISÃO SAÍDA'}
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={formData.Saída} 
                  onChange={(e) => setFormData({...formData, Saída: e.target.value})} 
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white outline-none focus:border-blue-600/50 transition-all appearance-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Box size={12} className="text-white" /> Marca
              </label>
              <input value={formData.Marca} onChange={(e) => setFormData({...formData, Marca: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white uppercase outline-none focus:border-blue-600/50 transition-all placeholder:text-slate-700" placeholder="MARCA" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} className="text-white" /> Status
              </label>
              <div className="relative">
                <select value={formData.Status} onChange={(e) => setFormData({...formData, Status: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white outline-none focus:border-blue-600/50 transition-all uppercase appearance-none cursor-pointer pr-10">
                  {Object.values(AWBStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} className="text-blue-500" /> {isNFMode ? 'CHEGADA REAL' : 'PREVISÃO CHEGADA'}
              </label>
              <input type="date" value={formData.Chegada} onChange={(e) => setFormData({...formData, Chegada: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white outline-none focus:border-blue-600/50 transition-all appearance-none" />
            </div>
          </div>

          <div className="md:col-span-full space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações Operacionais</label>
            <textarea value={formData.Observação} onChange={(e) => setFormData({...formData, Observação: e.target.value})} className="w-full bg-[#080d1a] border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-white outline-none focus:border-blue-600/50 transition-all placeholder:text-slate-800 resize-none min-h-[100px] uppercase" placeholder="INFORMAÇÕES ADICIONAIS..." />
          </div>

          <div className="pt-12 flex flex-col md:flex-row items-center gap-8 border-t border-white/5 shrink-0">
             <button type="button" onClick={onClose} className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">Cancelar</button>
             <button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[320px] bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-6 text-[13px] font-black uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50">
               {loading ? <Loader2 size={24} className="animate-spin" /> : <FileStack size={22} />}
               {loading ? 'PROCESSANDO...' : 'EFETIVAR LANÇAMENTO'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AWBModal;
