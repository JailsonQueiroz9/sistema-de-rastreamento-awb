
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  LogOut,
  ChevronLeft,
  User as UserIcon,
  Menu,
  X,
  Zap,
  History as HistoryIcon,
  Clock,
  Users
} from 'lucide-react';
import { User, ViewType, FilterState, AWBStatus } from '../types';
import ProfileModal from './ProfileModal';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, onLogout, currentView, onNavigate, filters, onFilterChange, theme, onUserUpdate
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems: { icon: any; label: string; view: ViewType }[] = [
    { icon: LayoutDashboard, label: 'Painel Geral', view: 'dashboard' },
    { icon: FileText, label: 'Relatórios', view: 'reports' },
    { icon: MessageSquare, label: 'Chat Equipe', view: 'chat' },
    { icon: HistoryIcon, label: 'Histórico', view: 'history' },
    { icon: Clock, label: 'Follow-UP PRÉ', view: 'follow-up-pre' },
    { icon: Zap, label: 'Follow-UP AWB', view: 'follow-up' },
    { icon: Users, label: 'Cadastro Usuários', view: 'users' },
    { icon: Settings, label: 'Configurações', view: 'settings' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user.role === 'admin') return true;
    return user.allowedViews?.includes(item.view);
  });

  const toggleStatus = (status: AWBStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const userInitial = (user.name || user.USUÁRIO || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[70]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-white">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-[65] lg:relative lg:flex flex-col h-screen transition-all duration-300 ease-in-out
        bg-[#0c1425] border-r border-slate-900/50
        ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${collapsed && !mobileOpen ? 'lg:w-20' : 'lg:w-72'}
      `}>
        
        <div className="p-8 pb-6 flex items-center justify-between">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-600/20"><Zap size={16} /></div>
              <div className="leading-none">
                <span className="text-white font-black text-lg tracking-tighter uppercase italic">Follow-UP</span>
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Air Logistics v3.2</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto"><Zap size={24} className="text-blue-500" /></div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 text-slate-600 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-4 overflow-y-auto no-scrollbar flex-1">
          {filteredMenuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => { onNavigate(item.view); setMobileOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                currentView === item.view 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/10' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              } ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
            >
              <item.icon size={18} className={`${currentView === item.view ? 'text-white' : 'group-hover:text-blue-400'}`} />
              {(!collapsed || mobileOpen) && (
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-6 border-t border-slate-900/50 bg-[#0c1425]/80 space-y-6">
          {(!collapsed || mobileOpen) && (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 rounded-2xl transition-all text-left"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-600/20 shrink-0">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-black text-xs uppercase truncate">
                  {user.name || user.USUÁRIO}
                </span>
                <span className="text-[9px] text-slate-600 font-bold truncate">
                  {user.cargo || 'Operador Logístico'}
                </span>
              </div>
            </button>
          )}

          <div className={`${collapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
            <button 
              onClick={onLogout} 
              className={`
                flex items-center gap-3 transition-all group
                ${collapsed && !mobileOpen 
                  ? 'w-12 h-12 justify-center bg-slate-900/50 border border-blue-500/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30' 
                  : 'w-full px-5 py-3.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl'
                }
              `}
            >
              <LogOut 
                size={20} 
                className={`${collapsed && !mobileOpen ? 'text-white' : 'text-slate-500'} group-hover:text-rose-500 transition-colors`} 
              />
              {(!collapsed || mobileOpen) && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">
                  Encerrar Sessão
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[64] lg:hidden" />}

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        onNavigate={onNavigate}
        onUserUpdate={onUserUpdate}
      />
    </>
  );
};

export default Sidebar;
