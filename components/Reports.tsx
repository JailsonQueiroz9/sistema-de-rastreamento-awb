
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, BarChart, Bar
} from 'recharts';
import { 
  ArrowLeft, Loader2, BarChart3, RefreshCw, Package, Clock, 
  Truck, Box, TrendingUp, AlertTriangle
} from 'lucide-react';
import { AWBRecord } from '../types';
import { storageService } from '../services/storageService';

interface ChartCardProps {
  title: string;
  subtitle: string;
  trend?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, trend, icon, children }) => (
  <div className="bg-[#0c1425]/40 border border-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
       <div className="flex items-center gap-4">
         {icon && <div className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>}
         <div>
           <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1 italic">{subtitle}</p>
         </div>
       </div>
       {trend && (
         <div className="text-right">
            <p className="text-[7px] font-black text-slate-700 uppercase">Indicador</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase">{trend}</p>
         </div>
       )}
    </div>
    {children}
  </div>
);

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const tooltipStyles = {
  contentStyle: { 
    backgroundColor: '#0c1425', 
    border: '1px solid #1e293b', 
    borderRadius: '12px', 
    fontSize: '11px', 
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
  itemStyle: { color: '#FFFFFF' },
  labelStyle: { color: '#64748b', marginBottom: '4px' }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

// Fix: Adicionada propriedade 'theme' para alinhar com a chamada no App.tsx
const Reports: React.FC<{ theme?: 'dark' | 'light'; onBack: () => void }> = ({ onBack, theme }) => {
  const [awbRecords, setAwbRecords] = useState<AWBRecord[]>([]);
  const [preRecords, setPreRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [awbData, preData] = await Promise.all([
        storageService.getRecords("AWB"),
        storageService.getRecords("PRÉ")
      ]);
      setAwbRecords(awbData);
      setPreRecords(preData);
    } catch (error) {
      console.error("Erro no BI:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (records: AWBRecord[]) => {
    const weeklyMap: Record<string, any> = {};
    const supplierMap: Record<string, number> = {};
    const materialMap: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    records.forEach(r => {
      // Data/Semana
      const rawDate = r.saida || r.Saída || r.chegada || r.Chegada;
      const date = rawDate ? new Date(rawDate) : null;
      if (date && !isNaN(date.getTime())) {
        const weekLabel = `S${getWeekNumber(date)}`;
        if (!weeklyMap[weekLabel]) weeklyMap[weekLabel] = { week: weekLabel, total: 0, ok: 0, delay: 0 };
        weeklyMap[weekLabel].total++;
        const s = String(r.status || r.Status || '').toUpperCase();
        if (s.includes('OK') || s.includes('ENTREGUE')) weeklyMap[weekLabel].ok++;
        if (s.includes('ATRASADO')) weeklyMap[weekLabel].delay++;
      }

      // Fornecedor
      const supplier = (r.fornecedor || r.Fornecedor || 'DESCONHECIDO').toUpperCase().trim();
      supplierMap[supplier] = (supplierMap[supplier] || 0) + 1;

      // Material
      const material = (r.material || r.Material || 'NÃO INF.').toUpperCase().trim();
      materialMap[material] = (materialMap[material] || 0) + 1;

      // Marca
      const brand = (r.marca || r.Marca || 'OUTROS').toUpperCase().trim();
      brandMap[brand] = (brandMap[brand] || 0) + 1;

      // Status
      const status = (r.status || r.Status || 'PENDENTE').toUpperCase().trim();
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const supplierChart = Object.entries(supplierMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const materialChart = Object.entries(materialMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const brandChart = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      weekly: Object.values(weeklyMap),
      suppliers: supplierChart,
      materials: materialChart,
      brands: brandChart,
      status: Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    };
  };

  const awbBI = useMemo(() => processData(awbRecords), [awbRecords]);
  const preBI = useMemo(() => processData(preRecords), [preRecords]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050a14]">
        <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Minerando Dados Logísticos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#050a14] p-6 custom-scrollbar pb-32">
      
      <div className="flex flex-wrap items-center gap-4 mb-10 bg-[#0c1425] p-4 rounded-3xl border border-slate-900 shadow-xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500">
           <BarChart3 size={14} />
           <span className="text-[9px] font-black uppercase tracking-widest italic">Analytics Engine 3.2</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
           <button onClick={fetchData} className="p-2 text-slate-500 hover:text-white transition-all"><RefreshCw size={18} /></button>
           <button onClick={onBack} className="p-2 text-slate-500 hover:text-white transition-all"><ArrowLeft size={18} /></button>
        </div>
      </div>

      {/* SEÇÃO AWB */}
      <section className="mb-20">
        <div className="flex items-center gap-4 mb-8 px-4">
           <div className="h-[1px] flex-1 bg-slate-900" />
           <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">BI: Fluxo em Trânsito (AWB)</h2>
           <div className="h-[1px] flex-1 bg-slate-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard title="Evolução Semanal" subtitle="Fluxo de Embarques" icon={<TrendingUp size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={awbBI.weekly}>
                    <XAxis dataKey="week" stroke="#475569" fontSize={9} hide />
                    <Tooltip {...tooltipStyles} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f633" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Top Fornecedores" subtitle="Volume por Parceiro" icon={<Truck size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={awbBI.suppliers} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} width={70} />
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Mix de Materiais" subtitle="Natureza da Carga" icon={<Box size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={awbBI.materials} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {awbBI.materials.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Status Críticos" subtitle="Alertas de Atraso" icon={<AlertTriangle size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={awbBI.weekly}>
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="delay" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>
        </div>
      </section>

      {/* SEÇÃO PRÉ */}
      <section>
        <div className="flex items-center gap-4 mb-8 px-4">
           <div className="h-[1px] flex-1 bg-slate-900" />
           <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">BI: Operação Pré-Embarque (NF'S)</h2>
           <div className="h-[1px] flex-1 bg-slate-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard title="Agendamentos" subtitle="Frequência Semanal" icon={<Clock size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={preBI.weekly}>
                    <XAxis dataKey="week" hide />
                    <Tooltip {...tooltipStyles} />
                    <Area type="monotone" dataKey="total" stroke="#10b981" fill="#10b98133" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Fornecedores PRÉ" subtitle="Volume Agendado" icon={<Truck size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={preBI.suppliers} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} width={70} />
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Tipos de Material" subtitle="Consolidado NF's" icon={<Box size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={preBI.materials} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {preBI.materials.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Share de Marcas" subtitle="Distribuição Operacional" icon={<Package size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={preBI.brands} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {preBI.brands.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>
        </div>
      </section>

    </div>
  );
};

export default Reports;
