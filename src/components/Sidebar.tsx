import React from 'react';
import { 
  Brain, 
  LayoutDashboard, 
  Network, 
  Zap, 
  Dumbbell, 
  Box, 
  ListOrdered, 
  Smartphone, 
  Terminal, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Server,
  Activity
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onlineCount: number;
  totalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onlineCount,
  totalCount,
}) => {
  const navItems: { id: AppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Motor Único', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cluster', label: 'Cluster de Nós', icon: <Network className="w-5 h-5" />, badge: `${onlineCount}/${totalCount}` },
    { id: 'inference', label: 'Inferência Distribuída', icon: <Zap className="w-5 h-5" /> },
    { id: 'finetune', label: 'Fine-Tuning', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'models', label: 'Modelos & GGUF', icon: <Box className="w-5 h-5" /> },
    { id: 'tasks', label: 'Fila de Tarefas', icon: <ListOrdered className="w-5 h-5" /> },
    { id: 'servodash', label: 'Mini-Dash Servo (:5001)', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'scripts', label: 'Scripts & Auto-Setup', icon: <Terminal className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      id="app-sidebar"
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          id="sidebar-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                LLM Cluster
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  V3
                </span>
              </span>
              <span className="text-[11px] text-white/50 font-mono truncate">
                Anti-Burro Edition
              </span>
            </div>
          )}
        </div>

        <button
          id="toggle-sidebar-btn"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto" id="sidebar-nav">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-3 py-1 mb-1">
            Menu Principal
          </p>
        )}
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-white/10 backdrop-blur-md text-white border border-white/15 shadow-md shadow-black/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <div className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-white/60 group-hover:text-white'}`}>
                {item.icon}
              </div>

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-400 rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Cluster Health Footer */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        {!collapsed ? (
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 backdrop-blur-md">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-semibold truncate">Master Online</span>
                <span className="text-indigo-300 font-mono text-[11px] font-bold">:5000</span>
              </div>
              <div className="text-[11px] text-white/50 truncate">
                {onlineCount} nós conectados
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Master Online: 5000">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          </div>
        )}
      </div>
    </aside>
  );
};
