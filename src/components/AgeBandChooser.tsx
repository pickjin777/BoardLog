import { useState } from 'react';
import { initAnalytics } from '../services/analytics';
import { storage } from '../services/storage';
import { AGE_BAND_EVENT } from '../utils/ageGate';

type ChosenBand = 'under_14' | '14_or_over';
type Step = 'choose' | 'child' | 'confirm-change';

/** Persists the band, then starts or stops statistics to match it. The band itself is not sent. */
export function commitAgeBand(band: ChosenBand): void {
  storage.setAgeBand(band);
  initAnalytics();
  window.dispatchEvent(new Event(AGE_BAND_EVENT));
}

/**
 * Neither age is pre-selected. Under 14 shows a short notice. Switching away from under 14
 * asks again, and staying under 14 is the confirmation's first action.
 */
export function AgeBandChooser({ onDone }: { onDone: (band: ChosenBand) => void }) {
  const [step, setStep] = useState<Step>('choose');

  if (step === 'child') {
    return (
      <div id="age-guardian-notice" className="space-y-3">
        <h3 id="age-band-title" className="text-base font-semibold text-[#1C160E]">
          만 14세 미만이에요
        </h3>
        <p className="text-base leading-relaxed text-[#1C160E]">
          게임 기록은 이 기기 안에만 남아요. 사진과 이름은 다른 곳으로 보내지 않아요.
        </p>
        <p className="text-base leading-relaxed text-[#1C160E]">
          사진 인식과 방문 숫자는 켜지지 않아요. 아래 버튼을 눌러도 사진을 보내게 되지 않아요.
        </p>
        <button
          id="age-guardian-back"
          type="button"
          onClick={() => setStep('choose')}
          className="btn-cream min-h-12 w-full px-3 text-sm"
        >
          다시 고르기
        </button>
        <button
          id="age-guardian-ack"
          type="button"
          onClick={() => {
            commitAgeBand('under_14');
            onDone('under_14');
          }}
          className="btn-cream min-h-12 w-full px-3 text-sm"
        >
          보호자와 안내를 읽었어요
        </button>
      </div>
    );
  }

  if (step === 'confirm-change') {
    return (
      <div id="age-upgrade-confirm" className="space-y-3">
        <h3 id="age-band-title" className="text-base font-semibold text-[#1C160E]">
          나이를 바꿀까요?
        </h3>
        <p className="text-base leading-relaxed text-[#1C160E]">
          만 14세 이상으로 바꾸면, 안내를 확인한 뒤에 사진을 보낼 수 있어요. 이용 통계도 켜질 수 있어요.
        </p>
        <button
          id="age-upgrade-stay"
          type="button"
          onClick={() => onDone('under_14')}
          className="btn-gold min-h-12 w-full px-3 text-sm"
        >
          만 14세 미만으로 두기
        </button>
        <button
          id="age-upgrade-confirm-btn"
          type="button"
          onClick={() => {
            commitAgeBand('14_or_over');
            onDone('14_or_over');
          }}
          className="btn-cream min-h-12 w-full px-3 text-sm"
        >
          만 14세 이상으로 바꾸기
        </button>
      </div>
    );
  }

  return (
    <div id="age-band-chooser" className="space-y-3">
      <h3 id="age-band-title" className="text-base font-semibold text-[#1C160E]">
        나이를 골라 주세요
      </h3>
      <p className="text-base leading-relaxed text-[#1C160E]">
        어느 쪽도 미리 선택되어 있지 않아요. 고르기 전에는 사진을 다른 곳으로 보내지 않아요.
      </p>
      <button
        id="age-band-14-or-over"
        type="button"
        onClick={() => {
          if (storage.getAgeBand() === 'under_14') {
            setStep('confirm-change');
            return;
          }
          commitAgeBand('14_or_over');
          onDone('14_or_over');
        }}
        className="btn-cream min-h-12 w-full px-3 text-sm"
      >
        만 14세 이상
      </button>
      <button
        id="age-band-under-14"
        type="button"
        onClick={() => setStep('child')}
        className="btn-cream min-h-12 w-full px-3 text-sm"
      >
        만 14세 미만
      </button>
    </div>
  );
}
