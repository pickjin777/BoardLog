# 에셋 출처

작성일: 2026-11-14. 저장소에 있는 그림, 아이콘, 일러스트, 글꼴만 적는다. 라이선스 문장을 저장소나 패키지에서 확인하지 못한 항목은 `확인 필요`다. 추측으로 채우지 않는다.

앱이 내려받는 글꼴 파일은 없다. 화면 글꼴은 CSS의 시스템 산세리프 스택이다 (`src/index.css`).

## 앱에 들어가는 그림

| 파일 | 무엇 | 출처 | 라이선스 |
|---|---|---|---|
| `public/hero/chest-160.webp`, `chest-320.webp`, `chest-480.webp` | 홈 상자 사진 | `docs/design/DESIGN.md`는 사용자가 만든 그림을 줄인 것이라고 적는다. 원본 파일명 `treasure-boardgame-chest.png`는 이 저장소에 없다 | 확인 필요 |
| `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/favicon-32.png`, `public/apple-touch-icon.png` | PWA·파비콘 | `docs/play/store-icon.md`는 저장소에서 직접 그린 열린 상자라고 적는다. 생성 스크립트는 이 커밋에 없다 | 확인 필요 |
| `assets/icon.png` | Capacitor 원본 아이콘 | 위와 같은 상자 시안 | 확인 필요 |
| `android/app/src/main/res/mipmap-*/ic_launcher*.png` | 런처 아이콘 | 같은 시안에서 만든 밀도별 PNG | 확인 필요 |
| `android/app/src/main/res/drawable*/splash.png` | 스플래시 | 같은 시안. 모서리 색 `#4834D4`는 `scripts/check-native-identity.mjs`가 확인한다 | 확인 필요 |
| `src/components/TreasureChest.tsx` | 상자 연출 SVG | 이 저장소의 코드 | 확인 필요 |
| `src/components/CoverPlaceholder.tsx`, `src/utils/imageFallback.ts` | 표지가 없을 때의 상자·미플 SVG | 이 저장소의 코드. 외부 이미지 주소를 쓰지 않는다 | 확인 필요 |
| `src/components`의 `lucide-react` 아이콘 | UI 아이콘 | npm `lucide-react`. 패키지 `LICENSE`는 ISC. Feather에서 온 일부는 MIT라고 그 파일에 적혀 있다 | ISC (일부 Feather MIT). 패키지 파일 기준 |

## 스토어 시안 (앱 번들 밖)

| 파일 | 무엇 | 출처 | 라이선스 |
|---|---|---|---|
| `docs/play/store-icon-512.png` | 스토어 아이콘 시안 | `docs/play/store-icon.md`: 저장소에서 직접 그린 상자 | 확인 필요 |
| `docs/play/feature-graphic-1024x500.png` | 피처 그래픽 시안 | 같은 문서. 글자는 그 환경의 WenQuanYi Micro Hei로 그렸다고 적는다. 앱 번들에는 그 글꼴 파일이 없다 | 그림: 확인 필요. 글꼴: 그 문서가 GNU GPL과 폰트 임베딩 예외를 말한다. 이 커밋에서 라이선스 원문을 다시 열지는 않음 |
| `docs/play/previous-4834d4/` 안의 PNG 5개 | 이전 보라 시안 | `docs/play/store-icon.md`가 비교용으로 남긴다고 적는다 | 확인 필요 |

## 쓰지 않음

시드 247개의 Unsplash 주소와 플레이 폼의 Unsplash 프리셋은 제거했다. 시드 게임은 이름과 앱 안 자리 표시만 보여 준다.
