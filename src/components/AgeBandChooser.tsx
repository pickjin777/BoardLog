import { useState } from 'react';
import { AGE_BAND_EVENT } from '../utils/ageGate';
import { initAnalytics } from '../services/analytics';
import { storage } from '../services/storage';

type ChosenBand = 'under_14' | '14_or_over';

/** Persists the band, then starts or stops statistics to match it. The band itself is not sent. */
export function commitAgeBand(band: ChosenBand): void {
  storage.setAgeBand(band);
  initAnalytics();
  window.dispatchEvent(new Event(AGE_BAND_EVENT));
}

/**
 * Age step before anything leaves the device. Under 14 shows a guardian notice and still
 * keeps photo recognition and statistics off. The ack button is not consent to collect.
 */
export function AgeBandChooser({ onDone }: { onDone: (band: ChosenBand) => void }) {
  const [step, setStep] = useState<'choose' | 'guardian'>('choose');

  if (step === 'guardian') {
    return (
      <div id="age-guardian-notice" className="space-y-3">
        <h3 id="age-band-title" className="text-base font-semibold text-[#1C160E]">
          만 14세 미만 안내
        </h3>
        <p className="text-base leading-relaxed text-[#1C160E]">
          기록은 이 기기에만 남습니다. 개발자에게 보내지 않습니다. 사진 인식과 이용 통계는 켜지지 않습니다.
        </p>
        <p className="text-sm leading-relaxed text-[#5C4632]">
          보호자는 이 안내를 확인해 주세요. 이 확인은 개인정보를 수집하는 동의가 아닙니다. 수집을 시작하지 않습니다.
        </p>
        <button
          id="age-guardian-back"
          type="button"
          onClick={() => setStep('choose')}
          className="btn-cream min-h-12 w-full px-3 text-sm"
        >
          다시 선택
        </button>
        <button
          id="age-guardian-ack"
          type="button"
          onClick={() => {
            commitAgeBand('under_14');
            onDone('under_14');
          }}
          className="btn-gold min-h-12 w-full px-3 text-sm"
        >
          보호자가 확인했습니다
        </button>
      </div>
    );
  }

  return (
    <div id="age-band-chooser" className="space-y-3">
      <h3 id="age-band-title" className="text-base font-semibold text-[#1C160E]">
        나이를 선택해 주세요
      </h3>
      <p className="text-base leading-relaxed text-[#1C160E]">
        만 14세 미만도 이 기기에 기록을 남길 수 있습니다. 사진을 서버로 보내거나 이용 통계를 켜는 기능은 만 14세 이상만
        씁니다.
      </p>
      <button
        id="age-band-14-or-over"
        type="button"
        onClick={() => {
          commitAgeBand('14_or_over');
          onDone('14_or_over');
        }}
        className="btn-gold min-h-12 w-full px-3 text-sm"
      >
        만 14세 이상
      </button>
      <button
        id="age-band-under-14"
        type="button"
        onClick={() => setStep('guardian')}
        className="btn-cream min-h-12 w-full px-3 text-sm"
      >
        만 14세 미만
      </button>
    </div>
  );
}
