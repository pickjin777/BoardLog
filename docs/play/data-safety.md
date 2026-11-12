# 데이터 보안 양식 초안

작성일: 2026-11-11. 수정: 2026-11-12 (D-048). 문장 맞춤: 2026-11-12. 플레이 콘솔에 입력하지 않았다. 제출본이 아니다.

같은 날의 [등록정보 초안](store-listing.draft.md)과 [개인정보처리방침 초안](privacy-policy.draft.md)도 이 표를 따른다. 지금 패키지에는 광고와 인앱 결제가 없다. 기록은 웹이면 그 브라우저, 안드로이드 앱이면 그 앱의 WebView(`https://localhost`)에만 있고 서로 동기화되지 않는다. 계정 삭제는 앱 안에 있다. 공개 처리방침 URL은 아직 없다.

콘솔 질문의 현재 문장은 이 자리에서 열지 못했다. 아래 항목 이름은 [데이터 보안 도움말](https://support.google.com/googleplay/android-developer/answer/10787469)의 구분을 따른 것이다. 화면 문구와 다르면 그 칸은 사용자 확인 필요가 된다. 선언이 앱과 다르면 조치될 수 있으므로, 넣는 값은 소유자가 콘솔에서 고친다.

이 초안이 보는 앱은 Capacitor로 `dist`를 담은 안드로이드 앱이다. 패키지 이름은 `com.pickjin.boardlog`. 웹뷰 출처는 `https://localhost`이고, `/api`만 `https://board-log.vercel.app`로 간다. `android/gradle.properties`의 `boardlog.monetization`이 `true`가 아니면 디버그와 릴리스 패키지 모두에서 AdMob과 Play Billing의 JS와 네이티브 플러그인이 빠진다. 매니페스트는 `AD_ID`와 `com.android.vending.BILLING`을 `tools:node="remove"`로 지운다. 서명 키는 만들지 않았으므로 패키지 확인은 디버그 APK로 한다. 플래그가 꺼진 릴리스 패키지도 같은 구성이다.

도움말은 기기 밖으로 전송되는 데이터를 수집으로 본다. 기기 안에만 있는 데이터는 그 정의에서는 수집이 아니다. 이 문장이 콘솔의 현재 질문과 같은지는 사용자 확인 필요가 있다.

## 지금 빌드에서 수집·공유

`boardlog.monetization`의 기본값은 `false`다. `VITE_ADMOB_ENABLED`와 `VITE_PLAY_BILLING_ENABLED`는 문자 `true`가 아니면 꺼지고, 패키지 플래그가 `true`가 아니면 그 문자만으로는 JS도 들어가지 않는다. 아래 표의 "지금"은 그 기본 빌드다.

| 항목 | 기기 밖으로 나가나 | 공유 | 양식에 적을 초안 | 코드 근거 | 확실함 |
|---|---|---|---|---|---|
| 사진, AI 인식 | 사용자가 사진 인식을 실행하고 서버에 키가 있을 때만. 줄인 이미지가 POST `/api/scan-games`로 가고, 그 함수가 Google Gemini `generateContent`에 넣는다 | 우리 함수는 이미지를 DB에 쓰지 않는다. Gemini로 넘긴다 | 사진. 수집 예, 조건부. 공유 예(Google). 목적: 앱 기능. 선택: 사용자가 그 버튼을 누를 때만 | `src/services/gameScanner.ts`, `api/scan-games.ts`. 키가 없으면 503이고 사진을 넘기지 않는다 | 우리 코드가 보관하지 않는다는 범위까지는 확실. Gemini와 Vercel이 그 요청을 얼마나 남기는지는 사용자 확인 필요 |
| 기록·소장 사진 | 아니오. IndexedDB 또는 localStorage | 공유 링크에는 사진을 넣지 않는다 | 수집 아니오 | `src/services/storage.ts`. `src/utils/sharedPlay.ts`는 사진 필드를 링크에 넣지 않는다 | 확실 |
| 로컬 계정 (이메일, 닉네임, 비밀번호) | 아니오. 이 기기 안 | 서버 계정이 없다 | 수집 아니오. 비밀번호는 평문이 아니라 PBKDF2-SHA256 210000회 해시 | `src/services/storage.ts`의 `signUp` | 확실. 예전 버전 해시가 남아 있는 기기가 있는지는 사용자 확인 필요 |
| 게임, 플레이, 함께한 사람 이름, 점수, 장소, 감상 | 백업 파일이나 공유 링크는 사용자가 직접 보낸다. 앱이 우리 서버로 올리지 않는다 | 앱 안의 다른 계정에게 보여 주는 기능은 없다 | 수집 아니오. 사용자가 링크를 보내는 경우를 콘솔이 "공유"로 보면 예로 고친다 | `src/services/storage.ts`, `src/utils/sharedPlay.ts` | 콘솔 질문 문장은 사용자 확인 필요 |
| Google Analytics | 이 저장소의 기본 빌드에는 측정 ID가 없어 스크립트를 넣지 않는다 | 없음 | 수집 아니오 | `src/services/analytics.ts`. ID가 있을 때만 gtag를 읽고, 이름·제목·장소·점수·사진·`#` 조각은 보내지 않는다. `allow_google_signals`와 `allow_ad_personalization_signals`는 false | 운영 사이트나 스토어용 빌드에 ID를 넣었는지는 사용자 확인 필요 (TBD-004) |
| Vercel 방문 통계 | 안드로이드 앱에서는 아니오. 웹뷰 호스트가 `localhost`라 컴포넌트를 그리지 않는다 | 없음 | 이 앱에 대해서는 수집 아니오 | `src/components/VercelAnalytics.tsx`, `isLocalHost` | 웹사이트 `board-log.vercel.app`는 따로 방문 통계를 보낸다. 스토어 양식은 앱만 본다. 웹까지 적으라는 안내가 있는지는 사용자 확인 필요 |
| 광고 ID (`AD_ID`) | 아니오. 광고 SDK가 패키지에 없다 | 아니오 | 수집 없음 | 기본 빌드는 `@capacitor-community/admob`을 넣지 않는다. 소스 매니페스트는 `com.google.android.gms.permission.AD_ID`를 `tools:node="remove"`로 지운다. 이 변경의 디버그 APK 병합 매니페스트에도 그 권한이 없다 | 이 패키지에 대해서는 확실 |
| Google Play 결제 | 아니오. 결제 라이브러리가 패키지에 없고, 상품 ID도 없다 | 우리 서버로 영수증을 보내지 않는다 | 금융 정보·구매 내역 수집 없음 | 기본 빌드는 `@capgo/native-purchases`를 넣지 않는다. `com.android.vending.BILLING`은 `tools:node="remove"`다. 이 변경의 디버그 APK 병합 매니페스트에도 그 권한이 없다 | 이 패키지에 대해서는 확실. 플레이가 결제 정보를 처리하는 것을 개발자 공유로 볼지는, 결제를 다시 켠 뒤에 사용자 확인 필요 |
| 전송 암호화 | 사진 인식, 웹, GA 스크립트는 HTTPS | 해당 없음 | 전송 중 암호화 예 | 운영 출처는 `https://board-log.vercel.app`. GA는 `https://www.googletagmanager.com` | 저장 중 암호화(기기 안 기록)를 따로 물으면, 플랫폼 기본 저장 외의 암호화는 없다. 그 칸의 선택지는 사용자 확인 필요 |
| 삭제 요청 | 서버에 사용자 계정은 없다. 마이 화면에서 확인 후 이 계정의 게임, 플레이, 로그인 정보를 이 기기에서 지운다. 공개 안내 `/account-deletion/` | 다른 기기의 계정은 지우지 않는다. 같은 기기의 다른 계정도 남긴다 | 사용자가 앱에서 삭제할 수 있다. 서버 삭제 API는 없다 | `storage.deleteAccount`, 마이 화면 확인 대화상자, `public/account-deletion/index.html` | 콘솔이 요구하는 웹 주소 문구는 사용자 확인 필요. 클라우드 백업이 생기면 서버 삭제는 운영의 서비스 역할 키가 있는 함수가 필요하며, 그 키는 만들지 않았다 |

2026-11-12 디버그 APK(`assembleDebug`)에서 `aapt dump permissions`는 `android.permission.INTERNET`과 앱 서명 권한 `com.pickjin.boardlog.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`만 보였다. `AD_ID`, `BILLING`, AdMob `APPLICATION_ID`는 병합 매니페스트에 없었다. APK 안에 AdMob·Play Billing 클래스와 광고 ID 문자열도 없었다. 같은 플래그의 릴리스 매니페스트 병합(`processReleaseMainManifest`)에도 그 두 권한은 없었다. 릴리스 APK는 서명 키가 없어 만들지 않았다.

독립 보안 심사는 하지 않았다. 코드와 문서에 심사 기록이 없다.

## 광고나 결제를 다시 켤 때

npm 의존성, 구글 샘플 광고 ID, 상품 ID `null`은 저장소에 남아 있다. 출시 패키지에 다시 넣으려면 아래를 한 변경에서 같이 한다.

1. `android/gradle.properties`의 `boardlog.monetization`을 `true`로 둔다. 이 값이 `false`이면 `cap sync`가 플러그인을 도로 적어도, 그 다음 스크립트와 Gradle이 네이티브 프로젝트에서 빼 낸다.
2. `android/app/src/main/AndroidManifest.xml`에서 `AD_ID`, `BILLING`, AdMob `APPLICATION_ID`의 `tools:node="remove"`를 지운다. 지우지 않으면 라이브러리를 넣어도 병합 매니페스트에서 그 노드가 빠진다.
3. 웹 빌드에 `VITE_ADMOB_ENABLED=true` 또는 `VITE_PLAY_BILLING_ENABLED=true`를 준다. 패키지 플래그가 `true`가 아니면 이 문자만으로는 JS가 들어가지 않는다.
4. `npm run cap:sync`로 안드로이드 프로젝트를 다시 맞춘 뒤 패키지를 만든다.

그 상태로 지금 코드를 그대로 쓰면, 광고는 구글 샘플 ID로 초기화만 하고 광고를 화면에 올리지 않는다. 결제는 기기 지원 여부만 묻는다. 그 상태에서도 아래를 다시 적어야 한다. 실제 광고 단위나 구독 상품을 만드는 것은 이 초안의 범위가 아니다.

| 켠 기능 | 그때 양식에서 바꿀 답 | 아직 코드에 없는 것 |
|---|---|---|
| AdMob (`boardlog.monetization=true`와 `VITE_ADMOB_ENABLED=true`) | 기기 또는 기타 ID 중 광고 ID를 수집·공유로 바꾼다. 수신자는 Google. 목적은 광고. 병합 매니페스트에 `AD_ID`가 돌아온다. 샘플이 아닌 우리 광고 단위를 쓰면 그 단위가 모으는 항목을 다시 본다 | 배너 요청, 동의 화면, 광고 ID를 앱이 직접 읽는 코드는 없다. SDK가 기본으로 모으는 위치·진단 정보는 사용자 확인 필요 |
| Play 결제 (`boardlog.monetization=true`와 `VITE_PLAY_BILLING_ENABLED=true`) | 구매를 시작하면 금융 정보 또는 구매 내역을 다시 본다. 병합 매니페스트에 `BILLING`이 돌아온다. 지금은 지원 여부만 묻므로, 그 호출만으로 구매 내역이 우리 쪽으로 오는 코드는 없다 | 상품 ID, 영수증 저장, 구독 상태 화면은 없다. 플레이가 결제 정보를 처리하는 것을 개발자 공유로 적을지는 사용자 확인 필요 |

둘 중 하나라도 스토어 빌드에서 켜면, 이 문서의 "지금" 열과 개인정보처리방침 초안을 같은 날 고친다.

## 사용자 확인 필요

- 콘솔에 보이는 질문 문장이 이 표의 항목 이름과 같은지.
- 운영 웹과 스토어용 APK에 GA4 측정 ID가 들어가 있는지.
- 사진 인식 요청을 Gemini와 Vercel이 얼마나 보관하는지.
- 공유 링크를 사용자가 직접 보내는 것을 공유로 적을지.
- 콘솔이 요구하는 계정 삭제 웹 주소의 정확한 문구. 앱 안 삭제와 `/account-deletion/`은 있다. 서버 삭제는 클라우드 백업 전이라 만들지 않았다.
- 웹사이트 방문 통계를 앱 양식에 넣을지.
