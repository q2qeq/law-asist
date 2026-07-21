// src/App.tsx
import { useState, useEffect } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { ExpirationAlerts } from './components/ExpirationAlerts';
import { RegistryParser } from './components/RegistryParser';
import { CorporateLedger } from './components/CorporateLedger';
import type { CorporateData, UpcomingAlert } from './types';

const API_BASE_URL = "https://law-asist.onrender.com";

function App() {
  const [activeTab, setActiveTab] = useState<'parse' | 'ledger'>('parse');
  const [alerts, setAlerts] = useState<UpcomingAlert[]>([]);
  const [ledgerData, setLedgerData] = useState<CorporateData[]>([]);

  // 전광판 알림 API 연동
  const refreshAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upcoming-expirations`);
      if (response.ok) setAlerts(await response.json());
    } catch (err) { console.error("알림 조회 에러", err); }
  };

  // 대장 조회 및 검색 API 연동
  const refreshLedger = async (searchKeyword = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/corporates?search=${searchKeyword}`);
      if (response.ok) setLedgerData(await response.json());
    } catch (err) { console.error("대장 조회 에러", err); }
  };

  // 💡 [추가] 기능 1: 알림창에서 임원 클릭 시 해당 법인 대장으로 자동 이동 및 검색
  const handleSelectAlert = (corporateName: string) => {
    setActiveTab('ledger');         // 탭을 '법인 대장'으로 변경
    refreshLedger(corporateName);   // 해당 법인명으로 즉시 검색 필터링
  };

  // 💡 [추가] 기능 2: "더 이상 보이지 않게 하기" 버튼 클릭 시 숨김 처리 API 호출
  const handleDismissAlert = async (execId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/executives/${execId}/handle`, {
        method: 'POST'
      });
      if (response.ok) {
        refreshAlerts(); // 전광판 알림 목록을 새로고침하여 즉시 화면에서 치움
      }
    } catch (err) { 
      console.error("알림 확인 완료 처리 중 에러", err); 
    }
  };

  // 앱 최초 구동시 로드
  useEffect(() => {
    refreshAlerts();
    refreshLedger();
  }, []);

  // 신규 저장이나 수정이 일어났을 때 상태를 일괄 갱신하는 브릿지 함수
  const handleDataChange = () => {
    refreshAlerts();
    refreshLedger();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. 구조화된 통합 헤더 */}
      <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 2. 최상단 실시간 경고 알림판 */}
        {/* 💡 [추가] ExpirationAlerts 컴포넌트에 새로 만든 두 기능을 넘겨줍니다 */}
        <ExpirationAlerts 
          alerts={alerts} 
          onSelectAlert={handleSelectAlert}
          onDismissAlert={handleDismissAlert}
        />

        {/* 3. 탭 분기에 따른 전용 컴포넌트 마운트 */}
        {activeTab === 'parse' ? (
          <RegistryParser onSaveSuccess={handleDataChange} />
        ) : (
          <CorporateLedger 
            ledgerData={ledgerData} 
            onSearch={refreshLedger} 
            onRefresh={handleDataChange} 
          />
        )}
      </main>
    </div>
  );
}

export default App;