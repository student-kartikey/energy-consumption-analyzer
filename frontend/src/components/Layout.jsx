import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, History, Cpu, Leaf, Settings } from 'lucide-react';

export default function Layout({ isConnected }) {
  const navItems = [
    { path: '/', label: 'Live Monitor', icon: Activity },
    { path: '/history', label: 'Historical Trends', icon: History },
    { path: '/processes', label: 'Process Inspector', icon: Cpu },
    { path: '/sustainability', label: 'Carbon & Cost', icon: Leaf },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Energy Consumption Analyzer</h1>
            <p className="text-xs text-slate-400">System Performance & Power Metrics</p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-medium">
            {isConnected ? 'Backend Active' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-slate-900/50 border-b border-slate-800/80 px-6 py-2 flex space-x-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}