import React, { useState } from 'react';
import { Search, Building2, Edit3, Save, UserCheck, Briefcase, Trash2, Phone, UserCircle } from 'lucide-react';
import type { CorporateData, Executive } from '../types';

interface LedgerProps {
  ledgerData: CorporateData[];
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
}

export const CorporateLedger: React.FC<LedgerProps> = ({ ledgerData, onSearch, onRefresh }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingCorpId, setEditingCorpId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchKeyword);
  };

  const startEditing = (corp: CorporateData) => {
    setEditingCorpId(corp.id);
    setEditForm({
      ...corp,
      manager_name: (corp as any).manager_name || "",
      manager_phone: (corp as any).manager_phone || ""
    });
  };

  const handleEditFormChange = (field: string, value: any) => {
    if (editForm) setEditForm({ ...editForm, [field]: value });
  };

  const handleExecutiveFormChange = (index: number, field: keyof Executive | 'phone', value: string) => {
    if (editForm) {
      const updatedExecutives = [...editForm.executives];
      updatedExecutives[index] = { ...updatedExecutives[index], [field]: value };
      setEditForm({ ...editForm, executives: updatedExecutives });
    }
  };

  // 삭제 요청 API 호출
  const handleDeleteData = async (id: number) => {
    if (!window.confirm("이 법인 대장 기록을 정말로 영구 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/corporates/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert("법인 대장이 삭제되었습니다.");
        onRefresh();
      } else {
        alert(`삭제 실패 (오류 코드: ${response.status})`);
      }
    } catch (err) {
      alert("삭제 통신 중 오류가 발생했습니다.");
    }
  };

  const saveUpdatedData = async () => {
    if (!editForm) return;
    try {
      const response = await fetch(`http://localhost:8000/api/corporates/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        alert("데이터베이스 수정 사항이 영구 저장되었습니다.");
        setEditingCorpId(null);
        onRefresh();
      }
    } catch (err) { alert("수정 오류 발생"); }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <form onSubmit={handleSubmitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="상호명 또는 법인등록번호 실시간 대장 검색..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 text-xs rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button type="submit" className="bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-lg">검색</button>
      </form>

      <div className="space-y-4">
        {ledgerData.length > 0 ? (
          ledgerData.map((corp) => (
            <div key={corp.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              {/* 상단 타이틀 바 */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  {editingCorpId === corp.id ? (
                    <input type="text" value={editForm?.corporate_name} onChange={(e) => handleEditFormChange('corporate_name', e.target.value)} className="font-bold text-base border border-slate-300 rounded px-2 py-0.5 text-indigo-600" />
                  ) : (
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2"><Building2 size={18} className="text-indigo-600" /> {corp.corporate_name}</h3>
                  )}
                  <p className="text-xs text-slate-400 mt-1">법인등록번호: {corp.registration_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingCorpId === corp.id ? (
                    <button onClick={saveUpdatedData} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"><Save size={14} /> 저장</button>
                  ) : (
                    <>
                      <button onClick={() => startEditing(corp)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 border"><Edit3 size={14} /> 수정</button>
                      <button onClick={() => handleDeleteData(corp.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center border border-rose-200 shadow-sm"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>

              {/* 법인 상세 등기 정보 대시보드 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50/50 p-4 rounded-lg border">
                <div className="md:col-span-3">
                  <span className="text-slate-400 block mb-1">본점 주소</span>
                  {editingCorpId === corp.id ? (
                    <input type="text" value={editForm?.head_office_address} onChange={(e) => handleEditFormChange('head_office_address', e.target.value)} className="w-full bg-white border p-1 rounded" />
                  ) : ( <span className="font-medium text-slate-800">{corp.head_office_address}</span> )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">자본금 총액</span>
                  {editingCorpId === corp.id ? (
                    <input type="text" value={editForm?.capital_amount} onChange={(e) => handleEditFormChange('capital_amount', e.target.value)} className="w-full bg-white border p-1 rounded" />
                  ) : ( <span className="font-medium text-slate-800">{corp.capital_amount}</span> )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">발행 주식 총수</span>
                  {editingCorpId === corp.id ? (
                    <input type="text" value={editForm?.total_shares_to_issue} onChange={(e) => handleEditFormChange('total_shares_to_issue', e.target.value)} className="w-full bg-white border p-1 rounded" />
                  ) : ( <span className="font-medium text-slate-800">{corp.total_shares_to_issue} 주</span> )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">발행한 주식 총수</span>
                  {editingCorpId === corp.id ? (
                    <input type="text" value={editForm?.total_shares_issued} onChange={(e) => handleEditFormChange('total_shares_issued', e.target.value)} className="w-full bg-white border p-1 rounded" />
                  ) : ( <span className="font-medium text-slate-800">{corp.total_shares_issued} 주</span> )}
                </div>

                {/* [추가] 담당 고객 연락처 정보 로우 */}
                <div className="md:col-span-3 border-t border-slate-200/60 pt-3 mt-1">
                  <span className="text-indigo-600 font-bold block mb-2 flex items-center gap-1"><UserCircle size={14}/> 관리 담당자(고객) 정보</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">담당자 이름</span>
                      {editingCorpId === corp.id ? (
                        <input type="text" value={editForm?.manager_name} onChange={(e) => handleEditFormChange('manager_name', e.target.value)} className="w-full bg-white border p-1 rounded" placeholder="이름 입력" />
                      ) : ( <span className="font-semibold text-slate-800">{(corp as any).manager_name || "미지정"}</span> )}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">담당자 연락처</span>
                      {editingCorpId === corp.id ? (
                        <input type="text" value={editForm?.manager_phone} onChange={(e) => handleEditFormChange('manager_phone', e.target.value)} className="w-full bg-white border p-1 rounded" placeholder="연락처 입력" />
                      ) : ( <span className="font-semibold text-slate-800">{(corp as any).manager_phone || "-"}</span> )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 임원 리스트 테이블 (+ 연락처 컬럼 확장) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1"><UserCheck size={14} className="text-slate-400" /> 임원 임기 명부</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-400 font-medium">
                        <th className="p-2">이름</th>
                        <th className="p-2">직책</th>
                        <th className="p-2">취임일</th>
                        <th className="p-2 text-rose-600">만료일</th>
                        <th className="p-2 text-indigo-600">임원 연락처</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editingCorpId === corp.id ? editForm?.executives : corp.executives)?.map((exec: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-slate-50/50">
                          <td className="p-2">{editingCorpId === corp.id ? <input type="text" value={exec.name} onChange={(e) => handleExecutiveFormChange(idx, 'name', e.target.value)} className="border p-1 w-20 font-bold rounded" /> : <span className="font-semibold">{exec.name}</span>}</td>
                          <td className="p-2">{editingCorpId === corp.id ? <input type="text" value={exec.position} onChange={(e) => handleExecutiveFormChange(idx, 'position', e.target.value)} className="border p-1 w-20 rounded" /> : <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{exec.position}</span>}</td>
                          <td className="p-2">{editingCorpId === corp.id ? <input type="date" value={exec.appointed_at} onChange={(e) => handleExecutiveFormChange(idx, 'appointed_at', e.target.value)} className="border p-1 font-mono rounded" /> : <span className="font-mono text-slate-500">{exec.appointed_at}</span>}</td>
                          <td className="p-2">{editingCorpId === corp.id ? <input type="date" value={exec.expired_at} onChange={(e) => handleExecutiveFormChange(idx, 'expired_at', e.target.value)} className="border p-1 font-mono text-rose-600 font-bold rounded" /> : <span className="font-mono text-rose-600 font-bold">{exec.expired_at}</span>}</td>
                          {/* 임원 개인 연락처 입력란 추가 */}
                          <td className="p-2">
                            {editingCorpId === corp.id ? (
                              <input type="text" value={exec.phone || ""} onChange={(e) => handleExecutiveFormChange(idx, 'phone', e.target.value)} className="border p-1 w-28 placeholder-slate-300 rounded" placeholder="010-0000-0000" />
                            ) : (
                              <span className="font-mono text-slate-600 flex items-center gap-1">{exec.phone ? <><Phone size={10} className="text-slate-400"/> {exec.phone}</> : "-"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 정관 목적 사업 항목 목록 */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1"><Briefcase size={14} className="text-slate-400" /> 등기 정관 목적 사업 항목 ({corp.purposes?.length || 0}건)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {corp.purposes?.map((p, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-[11px] font-medium">✓ {p}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
            적재된 법인 대장이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};