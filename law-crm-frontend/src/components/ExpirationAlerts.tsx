import React from 'react';
import { Bell, Eye, CheckCircle } from 'lucide-react';
import type { UpcomingAlert } from '../types';

interface AlertsProps {
  alerts: UpcomingAlert[];
  onSelectAlert: (corpName: string) => void; // 💡 대장 이동 브릿지
  onDismissAlert: (execId: number) => void;  // 💡 알림 숨김 브릿지
}

export const ExpirationAlerts: React.FC<AlertsProps> = ({ alerts, onSelectAlert, onDismissAlert }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
        <Bell size={18} className="animate-bounce" />
        <span>임기 만료 임박 안내 (90일 이내 {alerts.length}건)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white border border-rose-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
            <div 
              onClick={() => onSelectAlert(alert.corporate_name)}
              className="cursor-pointer hover:bg-slate-50 p-1 rounded transition flex-1"
              title="클릭 시 해당 법인 대장으로 이동합니다"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">{alert.corporate_name}</span>
                <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">D-{alert.d_day}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {alert.position} <span className="font-bold text-indigo-600">{alert.name}</span>
                {alert.phone && <span className="text-slate-400 ml-2">({alert.phone})</span>}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">만료일: {alert.expired_at}</p>
            </div>

            <div className="flex gap-1 ml-2">
              <button 
                onClick={() => onSelectAlert(alert.corporate_name)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md border hover:bg-slate-50"
                title="대장 보기"
              >
                <Eye size={14} />
              </button>
              <button 
                onClick={() => onDismissAlert(alert.id)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md border hover:bg-slate-50"
                title="확인 완료 (더이상 안보기)"
              >
                <CheckCircle size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};