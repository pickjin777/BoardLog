import type React from 'react';
import { useEffect, useState } from 'react';
import { saveUserGeminiKey } from '../services/geminiKeyStore';
import { UserGeminiError, verifyUserGeminiKey } from '../utils/geminiDirect';
import { copiedKeyOffer, geminiKeyIssueMessage, geminiVerifyHelp, tidyGeminiKey } from '../utils/geminiKeyText';
import { isNativeShell } from '../utils/nativeShell';

const KEY_PAGE = 'https://aistudio.google.com/apikey';

interface GeminiKeyFormProps {
  idPrefix?: string;
  doneLabel?: string;
  onSaved: () => void;
  onManualEntry?: () => void;
}

export const GeminiKeyFaq: React.FC<{ id: string }> = ({ id }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => setOpen((current) => !current)}
        className="btn-quiet min-h-12 w-full text-sm"
      >
        자주 묻는 질문
      </button>
      {open && (
        <div
          id={`${id}-body`}
          className="space-y-3 rounded-2xl bg-[#172033] p-3 text-sm leading-relaxed text-[#F6EBD4]"
        >
          <p>
            <strong className="font-medium">돈이 드나요?</strong> 보드로그는 돈을 받지 않아요. 글자를 만드는 곳은
            Google이고, 쓰는 양에 따라 요금이 생길 수 있어요. 금액은 그 화면의 안내를 봐 주세요.
          </p>
          <p>
            <strong className="font-medium">안전한가요?</strong> 그 글자는 이 폰(또는 이 브라우저)에만 있어요. 보드로그
            서버와 백업 파일에는 안 넣어요. 무료로 받은 글자는 Google이 서비스 개선에 쓸 수 있어요.
          </p>
          <p>
            <strong className="font-medium">글자를 잊어버렸어요.</strong> 보드로그는 그 글자를 보관하지 않아요. 받으러
            간 화면에 다시 들어가 보거나, 새로 만들면 돼요.
          </p>
          <p>
            <strong className="font-medium">지우고 싶어요.</strong> 마이 → 사진 인식에서 「키 지우기」를 누르면 이
            기기에서 사라져요.
          </p>
        </div>
      )}
    </div>
  );
};

function StepArt({ kind }: { kind: 1 | 2 | 3 | 4 }) {
  if (kind === 1) {
    return (
      <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
        <rect x="4" y="8" width="36" height="32" rx="4" fill="#172033" stroke="#E2B657" strokeWidth="2" />
        <path d="M46 24h16M54 16l8 8-8 8" fill="none" stroke="#E2B657" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === 2) {
    return (
      <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
        <circle cx="22" cy="18" r="8" fill="none" stroke="#F6EBD4" strokeWidth="2" />
        <path d="M10 40c2-8 8-12 12-12s10 4 12 12" fill="none" stroke="#F6EBD4" strokeWidth="2" />
        <path d="M44 28l6 6 12-14" fill="none" stroke="#E2B657" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === 3) {
    return (
      <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
        <rect x="6" y="14" width="28" height="16" rx="4" fill="#E2B657" />
        <rect x="40" y="8" width="22" height="28" rx="3" fill="none" stroke="#F6EBD4" strokeWidth="2" />
        <path d="M46 18h10M46 24h10M46 30h7" stroke="#E2B657" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
      <rect x="8" y="10" width="40" height="28" rx="4" fill="none" stroke="#F6EBD4" strokeWidth="2" />
      <path d="M16 24h20" stroke="#E2B657" strokeWidth="2" />
      <path d="M54 16v16M46 24h16" stroke="#E2B657" strokeWidth="2" />
    </svg>
  );
}

const STEPS: { n: 1 | 2 | 3 | 4; title: string; body: string }[] = [
  { n: 1, title: '키 받으러 가기', body: '아래 큰 버튼을 누르면 새 창이 열려요.' },
  { n: 2, title: '구글 계정으로 들어가기', body: '로그인하고, 나오는 동의에 확인을 눌러요.' },
  {
    n: 3,
    title: '글자 만들기',
    body: '「Create API key」(키 만들기)를 눌러요. 나온 긴 글자를 복사해요. 그 글자는 연결 비밀번호 같은 거예요.'
  },
  { n: 4, title: '여기로 돌아와 붙이기', body: '붙여넣기를 한 번 누르고, 연결하기를 눌러요.' }
];

/**
 * Four short steps for someone who does not set up developer tools.
 * The key leaves this component only through the device store, after a successful check.
 */
export const GeminiKeyForm: React.FC<GeminiKeyFormProps> = ({
  idPrefix = 'gemini-key',
  doneLabel = '사진 고르기',
  onSaved,
  onManualEntry
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (connected) return;
    const look = () => {
      const read = navigator.clipboard?.readText;
      if (!read) return;
      void read
        .call(navigator.clipboard)
        .then((text) => {
          const next = copiedKeyOffer(text, value);
          if (next) setOffer(next);
        })
        .catch(() => undefined);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') look();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', look);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', look);
    };
  }, [connected, value]);

  const applyText = (raw: string) => {
    const tidy = tidyGeminiKey(raw);
    setOffer(null);
    if (!tidy.ok) {
      setValue(raw.replace(/[\s\u00a0]+/g, '').replace(/^['"]+|['"]+$/g, ''));
      setError(geminiKeyIssueMessage(tidy.issue));
      return;
    }
    setValue(tidy.key);
    setError(null);
  };

  const paste = async () => {
    setPasteHint(null);
    try {
      const read = navigator.clipboard?.readText;
      if (!read) throw new Error('no clipboard');
      applyText(await read.call(navigator.clipboard));
    } catch {
      setPasteHint('붙여넣기가 막혀 있으면, 아래 칸을 길게 눌러 직접 붙여 주세요.');
      document.getElementById(`${idPrefix}-input`)?.focus();
    }
  };

  const verify = async () => {
    const tidy = tidyGeminiKey(value);
    if (!tidy.ok) {
      setError(geminiKeyIssueMessage(tidy.issue));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyUserGeminiKey(tidy.key);
      await saveUserGeminiKey(tidy.key);
      setValue('');
      setOffer(null);
      setConnected(true);
    } catch (err) {
      const kind = err instanceof UserGeminiError ? err.kind : 'failed';
      setError(geminiVerifyHelp(kind));
    } finally {
      setBusy(false);
    }
  };

  const openKeyPage = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isNativeShell()) return;
    event.preventDefault();
    window.open(KEY_PAGE, '_blank', 'noopener');
  };

  if (connected) {
    return (
      <div id={`${idPrefix}-panel`} className="space-y-3 rounded-2xl border border-[#C6A36A] bg-[#0E1628] p-4">
        <div id={`${idPrefix}-success`} role="status" className="space-y-2">
          <h3 className="text-lg font-medium text-[#F6EBD4]">연결됐어요!</h3>
          <p className="text-base leading-relaxed text-[#E4D3B4]">이제 사진을 고르면 돼요.</p>
        </div>
        <button
          id={`${idPrefix}-success-next`}
          type="button"
          onClick={onSaved}
          className="btn-gold min-h-12 w-full text-base"
        >
          {doneLabel}
        </button>
      </div>
    );
  }

  return (
    <div id={`${idPrefix}-panel`} className="space-y-4 rounded-2xl border border-[#C6A36A] bg-[#0E1628] p-4">
      <div>
        <h3 className="text-lg font-medium text-[#F6EBD4]">내 제미나이 연결</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#E4D3B4]">
          네 단계만 따라 하면 돼요. 연결 비밀번호 같은 긴 글자를 이 기기에만 저장해요.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-3 rounded-2xl bg-[#172033] p-3">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E2B657] text-base font-medium text-[#0E1628]">
                {step.n}
              </span>
              <StepArt kind={step.n} />
            </div>
            <div>
              <p className="text-base font-medium text-[#F6EBD4]">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#E4D3B4]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <a
        id={`${idPrefix}-help`}
        href={KEY_PAGE}
        target="_blank"
        rel="noopener noreferrer"
        onClick={openKeyPage}
        className="btn-gold flex min-h-12 items-center justify-center px-3 text-base"
      >
        1. 키 받으러 가기
      </a>

      <p className="text-sm leading-relaxed text-[#E4D3B4]">
        무료로 받은 글자는 Google이 서비스 개선에 쓸 수 있어요. 이 연결은 만 18세 이상 이용 조건이 있어요.
      </p>

      {offer && (
        <div id={`${idPrefix}-offer`} className="space-y-2 rounded-2xl bg-[#172033] p-3">
          <p className="text-base text-[#F6EBD4]">복사한 키를 넣을까요?</p>
          <div className="flex gap-2">
            <button
              id={`${idPrefix}-offer-yes`}
              type="button"
              onClick={() => applyText(offer)}
              className="btn-gold min-h-12 flex-1 text-sm"
            >
              넣기
            </button>
            <button
              id={`${idPrefix}-offer-no`}
              type="button"
              onClick={() => setOffer(null)}
              className="btn-quiet min-h-12 flex-1 text-sm"
            >
              나중에
            </button>
          </div>
        </div>
      )}

      <button
        id={`${idPrefix}-paste`}
        type="button"
        onClick={() => void paste()}
        className="btn-quiet min-h-12 w-full text-base"
      >
        붙여넣기
      </button>
      {pasteHint && <p className="text-sm leading-relaxed text-[#E4D3B4]">{pasteHint}</p>}

      <label className="block text-sm text-[#F6EBD4]" htmlFor={`${idPrefix}-input`}>
        직접 붙여넣기
        <input
          id={`${idPrefix}-input`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          className="mt-1 w-full rounded-xl border border-[#C6B48A] bg-[#FFF8EC] px-3 text-base text-[#1C160E]"
        />
      </label>

      {error && (
        <p id={`${idPrefix}-error`} role="alert" className="text-sm leading-relaxed text-[#FFC2BC]">
          {error}
        </p>
      )}

      <button
        id={`${idPrefix}-verify`}
        type="button"
        disabled={busy || value.trim().length === 0}
        onClick={() => void verify()}
        className="btn-gold min-h-12 w-full text-base disabled:opacity-50"
      >
        {busy ? '확인 중…' : '연결하기'}
      </button>

      <GeminiKeyFaq id={`${idPrefix}-faq`} />

      {onManualEntry && (
        <button
          id="scan-manual-entry-btn"
          type="button"
          onClick={onManualEntry}
          className="btn-quiet min-h-12 w-full text-sm"
        >
          직접 입력으로 등록
        </button>
      )}
    </div>
  );
};
