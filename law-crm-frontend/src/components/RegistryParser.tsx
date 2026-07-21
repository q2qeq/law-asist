import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, Save, ArrowLeft, Building2, UserCheck, Briefcase } from 'lucide-react';

// Render 배포 백엔드 서버 주소
const API_BASE_URL = 'https://law-asist.onrender.com';

interface ParserProps {
  onSaveSuccess?: () => void; // App.tsx에서 넘겨주는 프롭명 (TS 빌드 에러 해결)
  onRefresh?: () => void;     // 하위 호환성을 위해 유지
}

export const RegistryParser: React.FC<ParserProps> = ({ onSaveSuccess, onRefresh }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 1. PDF 파싱 API 호출 (Render 백엔드 주소로 변경)
  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/parse-registry`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setParsedData(data);
      } else {
        const errorData = await response.json();
        alert(`파싱 실패: ${errorData.detail || '오류가 발생했습니다.'}`);
      }
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. DB 저장 API 호출 및 화면 초기화 로직 (Render 백엔드 주소로 변경)
  const handleSave = async () => {
    if (!parsedData) return;
    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/save-corporate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      const result = await response.json();

      if (response.ok) {
        // ① 아버님이 인지하실 수 있도록 성공 얼럿 메시지 표시
        alert(result.message || "법인 대장 정보가 데이터베이스에 성공적으로 영구 저장되었습니다.");
        
        // ② 다시 새로운 파일을 업로드할 수 있는 초기 상태화면으로 복귀
        setParsedData(null);
        setFile(null);
        
        // ③ 실시간으로 대장 탭 목록을 갱신하도록 부모 컴포넌트 알림
        if (onSaveSuccess) {
          onSaveSuccess();
        } else if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(`저장 실패: ${result.detail || '서버 오류가 발생했습니다.'}`);
      }
    } catch (err) {
      alert('서버 저장 중 통신 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto animate-fadeIn">
      {/* 1단계: 파일 업로드 화면 (parsedData가 없을 때) */}
      {!parsedData ? (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> 신규 등기부등본 데이터 적재
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">PDF 등기사항전부증명서를 업로드하면 AI가 실시간으로 분석하여 대장을 생성합니다.</p>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="text-xs font-semibold text-slate-700">
              {file ? file.name : '컴퓨터에서 등기부등본 PDF 파일 선택'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">확장자 .pdf 파일만 등록 가능합니다.</p>
          </div>

          {file && (
            <button
              onClick={handleParse}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm disabled:bg-slate-300"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> AI 등기부등본 정밀 분석 중 (약 10~15초 소요)...
                </>
              ) : (
                <>AI 실시간 분석 시작</>
              )}
            </button>
          )}
        </div>
      ) : (
        /* 2단계: AI 분석 결과 확인 및 저장 화면 (parsedData가 있을 때) */
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 text-emerald-600">
                <CheckCircle size={18} /> AI 분석 완료 (저장 대기)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">저장 버튼을 누르시면 법인 등기 임기 관리 대장에 영구 등록됩니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setParsedData(null)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 border"
              >
                <ArrowLeft size={14} /> 취소 후 다시 업로드
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm disabled:bg-slate-300"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                대장에 최종 저장하기
              </button>
            </div>
          </div>

          {/* 파싱 결과 대시보드 뷰 */}
          <div className="space-y-4 text-xs">
            {/* 기본 법인 개요 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2"><Building2 size={16} className="text-indigo-600"/> 법인 마스터 개요</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><span className="text-slate-400 block mb-0.5">상호명 (법인명)</span><span className="font-bold text-slate-800 text-sm">{parsedData.corporate_name}</span></div>
                <div><span className="text-slate-400 block mb-0.5">법인등록번호</span><span className="font-mono font-medium text-slate-800">{parsedData.registration_number}</span></div>
                <div className="md:col-span-2"><span className="text-slate-400 block mb-0.5">본점 주소</span><span className="font-medium text-slate-800">{parsedData.head_office_address}</span></div>
                <div><span className="text-slate-400 block mb-0.5">자본금 총액</span><span className="font-medium text-slate-800">{parsedData.capital_amount}</span></div>
                <div><span className="text-slate-400 block mb-0.5">발행 주식 총수 / 발행한 주식 총수</span><span className="font-medium text-slate-800">{parsedData.total_shares_to_issue}주 / {parsedData.total_shares_issued}주</span></div>
              </div>
            </div>

            {/* 등기 임원 명단 */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5"><UserCheck size={16} className="text-slate-400"/> 파싱된 임원 명부 ({parsedData.executives?.length || 0}명)</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="p-2.5">이름</th>
                      <th className="p-2.5">직책</th>
                      <th className="p-2.5">취임일</th>
                      <th className="p-2.5 text-rose-600">임기 만료일 (추정)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.executives?.map((exec: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-800">{exec.name}</td>
                        <td className="p-2.5"><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{exec.position}</span></td>
                        <td className="p-2.5 font-mono text-slate-500">{exec.appointed_at}</td>
                        <td className="p-2.5 font-mono text-rose-600 font-bold">{exec.expired_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 목적 사업 */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5"><Briefcase size={16} className="text-slate-400"/> 정관 목적 사업 항목 ({parsedData.purposes?.length || 0}건)</h3>
              <div className="flex flex-wrap gap-1.5 bg-slate-50/50 p-3 border rounded-xl">
                {parsedData.purposes?.map((purpose: string, idx: number) => (
                  <span key={idx} className="bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded text-[11px] font-medium shadow-sm">
                    ✓ {purpose}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};