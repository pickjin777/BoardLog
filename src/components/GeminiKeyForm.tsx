import type React from 'react';
import { useState } from 'react';
import { UserGeminiError, verifyUserGeminiKey } from '../utils/geminiDirect';
import { saveUserGeminiKey } from '../services/geminiKeyStore';

interface GeminiKeyFormProps {
  idPrefix?: string;
  onSaved: () => void;
  onManualEntry?: () => void;
}

/**
 * Asks for a key, checks it with a model-list call, then stores it on the device.
 * The key is cleared from this component after a successful save and is not returned to the parent.
 */
export const GeminiKeyForm: React.FC<GeminiKeyFormProps> = ({ idPrefix = 'gemini-key', onSaved, onManualEntry }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyUserGeminiKey(value);
      await saveUserGeminiKey(value);
      setValue('');
      onSaved();
    } catch (err) {
      setError(
        err instanceof UserGeminiError ? err.message : '키를 확인하지 못했습니다. 직접 입력으로 등록할 수 있습니다.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id={`${idPrefix}-panel`} className="space-y-3 rounded-2xl border border-[#C6A36A] bg-[#0E1628] p-4">
      <h3 className="text-sm font-medium text-[#F6EBD4]">내 제미나이 연결</h3>
      <p className="text-xs leading-relaxed text-[#E4D3B4]">
        서버 인식을 쓸 수 없습니다. Google AI Studio에서 무료 키를 받아 이 기기에만 저장합니다. 키는 보드로그 서버로
        보내지 않고, 백업 파일에도 넣지 않습니다. 연결되면 사진 1장을 이 기기에서 Google Gemini로 직접 보냅니다.
      </p>
      <p className="text-xs leading-relaxed text-[#E4D3B4]">
        무료 키는 Google이 보낸 내용을 서비스 개선에 쓸 수 있습니다. Gemini API는 만 18세 이상 이용 조건이 있습니다.
      </p>
      <a
        id={`${idPrefix}-help`}
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-quiet flex min-h-12 items-center justify-center px-3 text-xs"
      >
        AI Studio에서 무료 키 받기
      </a>
      <label className="block text-xs text-[#F6EBD4]" htmlFor={`${idPrefix}-input`}>
        키 붙여넣기
        <input
          id={`${idPrefix}-input`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[#C6B48A] bg-[#FFF8EC] px-3 text-xs text-[#1C160E]"
        />
      </label>
      {error && (
        <p id={`${idPrefix}-error`} role="alert" className="text-xs leading-relaxed text-[#FFC2BC]">
          {error}
        </p>
      )}
      <button
        id={`${idPrefix}-verify`}
        type="button"
        disabled={busy || value.trim().length === 0}
        onClick={() => void verify()}
        className="btn-gold min-h-12 w-full text-xs disabled:opacity-50"
      >
        {busy ? '확인 중…' : '연결 확인'}
      </button>
      {onManualEntry && (
        <button
          id="scan-manual-entry-btn"
          type="button"
          onClick={onManualEntry}
          className="btn-quiet min-h-12 w-full text-xs"
        >
          직접 입력으로 등록
        </button>
      )}
    </div>
  );
};
