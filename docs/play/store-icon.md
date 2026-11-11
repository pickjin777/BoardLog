# 스토어 아이콘 시안

작성일: 2026-11-11. 금고 그림: 2026-11-11. 콘솔에 올리지 않았다. 최종 그림인지는 소유자가 본다.

이전 `#4834D4` 글자 B 시안은 [previous-4834d4](previous-4834d4/)에 그대로 둔다. 비교용이다.

- [previous-4834d4/store-icon-512.png](previous-4834d4/store-icon-512.png)
- [previous-4834d4/feature-graphic-1024x500.png](previous-4834d4/feature-graphic-1024x500.png)
- [previous-4834d4/icon-512-letter-b.png](previous-4834d4/icon-512-letter-b.png)
- [previous-4834d4/splash-320x480.png](previous-4834d4/splash-320x480.png)
- [previous-4834d4/assets-icon-1024.png](previous-4834d4/assets-icon-1024.png)

## 결정

화면 테마 `#4834D4`(빨강 72, 초록 52, 파랑 212)는 유지한다. 아이콘·스플래시·적응형 배경의 모서리는 이 색이다. `check:secrets`가 그 모서리를 확인한다.

가운데 그림은 글자 B가 아니다. 저장소에서 직접 그린 열린 상자다. 금색 몸통, 뚜껑 틈의 빛, 가운데 자수정이다. 외부 그림 파일을 쓰지 않았다.

피처 그래픽만 먹색 바탕이다. 스토어 배너가 앱 안의 금고 화면과 맞닿게 하려는 시안이다. 글은 "보드로그", "내 보드게임이 보물처럼"이다.

글자는 이 환경의 WenQuanYi Micro Hei(`/usr/share/fonts/truetype/wqy/wqy-microhei.ttc`)로 그렸다. 문천역 마이크로헤이, GNU GPL에 폰트 임베딩 예외가 있는 글꼴이다. 앱 번들에는 넣지 않는다. 화면 글꼴은 시스템 산세리프다. 스토어에 쓸 최종 글꼴은 사용자 확인 필요가 있다.

## 만든 파일

| 파일 | 크기 | 픽셀 | PNG | 바이트 |
|---|---|---|---|---|
| [store-icon-512.png](store-icon-512.png) | 스토어 아이콘 시안 | 512×512 | 8비트, 색 형식 6 (채널 4) | 5017 |
| [feature-graphic-1024x500.png](feature-graphic-1024x500.png) | 피처 그래픽 시안 | 1024×500 | 8비트, 색 형식 2 (알파 없음) | 13633 |

아이콘은 1MB 아래다. 모서리 픽셀은 `#4834D4`다. 피처 그래픽은 1024×500, 알파 없는 PNG다. 도움말 문구가 바뀌었는지는 사용자 확인 필요가 있다. 출처로 삼은 문서는 [미리보기 자산](https://support.google.com/googleplay/android-developer/answer/9866151)이다.

`public/icon-512.png`, `public/icon-maskable-512.png`, 런처, 스플래시도 같은 상자다. 마스크용과 적응형 전경은 상자를 가운데에 더 작게 두었다. 적응형 배경은 빈 `#4834D4`다.

시안을 스토어에 쓸지는 사용자 확인 필요가 있다.

## 그때의 색 통일

화면 테마 `#4834D4`와, 그때의 런처 배경 `#5641DE`는 달랐다. `#5641DE`는 기존 512 아이콘 모서리에서 읽은 값이었다. 소유자는 브랜드 보라를 화면 테마색 `#4834D4`로 통일하기로 했다. `#5641DE`로 화면을 맞추는 안은 쓰지 않는다.
