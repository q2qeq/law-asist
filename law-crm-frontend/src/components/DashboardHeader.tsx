import React from 'react';
import { Building2, Upload, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'parse' | 'ledger';
  setActiveTab: (tab: 'parse' | 'ledger') => void;
}

export const DashboardHeader: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-10 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white"><Building2 size={22} /></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">로마스터 법인 CRM 인프라</h1>
          <p className="text-xs text-slate-400">AI 파싱 & 수동 수정 융합형 임기 대장 시스템</p>
        </div>
      </div>
      
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button 
          onClick={() => setActiveTab('parse')}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'parse' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Upload size={14} /> 등기부 신규 파싱
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Layers size={14} /> 법인 마스터 대장 관리
        </button>
      </div>
    </header>
  );
};