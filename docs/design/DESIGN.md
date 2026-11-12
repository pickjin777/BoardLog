---
version: alpha
name: 보드로그 금고
description: 어두운 금고 위에 금과 자수정. 보드게임 한 판이 상자에서 나오는 순간의 화면.
---

# 보드로그 금고

## Overview

보드로그는 자기 보드게임과 플레이를 이 기기에 남겨 두는 기록장이다. 화면은 보물 창고다. 바탕은 따뜻한 먹색이고, 게임 카드는 상자 칸이며, 금은 빛이 새는 자리, 보라 `#4834D4`는 자수정 보석이다.

느끼고 싶은 순간은 둘이다. 앱을 열 때 상자가 열리고, 게임을 하나 들일 때 다시 빛이 난다. 평소 화면은 그 여운만 남긴다. 장식보다 제목, 승패, 보관 장소가 먼저 읽힌다.

문서 형식은 DESIGN.md 규약을 따른다. 다른 서비스의 로고, 상표, 문장은 가져오지 않는다. getdesign.md와 getdesign.kr은 이 파일의 절 구성을 볼 때 참고했을 뿐, 그 카탈로그의 색·문장·마크를 쓰지 않는다.

글꼴 파일을 내려받지 않는다. 한글은 기기에 있는 산세리프가 그린다. 외부 사진·영상·로티는 쓰지 않는다. 상자 그림은 `src/components/TreasureChest.tsx`의 SVG다.

카카오톡 버튼의 노랑 `#FEE500`과 글자 `#191919`는 카카오 버튼이라 이 팔레트로 칠하지 않는다. 공유 미리보기의 옅은 파랑 말풍선(`#B2C7D9`)도 그대로 둔다.

## Colors

금고는 어둡고, 읽히는 글자는 밝다. 보석 원색 `#4834D4`는 채움에만 쓴다. 이 색을 카드 위 작은 글자에 쓰면 대비가 약 2.3:1이라 WCAG AA 4.5:1에 못 미친다. 글·아이콘·키보드 포커스는 같은 색조의 밝은 자수정 `#E4DCFF`다(카드 `#1C1812` 위 약 13:1). 포커스 링도 `#E4DCFF`다. `#4834D4`는 인접한 먹색과 약 2.3:1이라 포커스 표시 3:1에 부족하다.

아이콘 모서리, 스플래시 바탕, `theme-color`, 매니페스트 `theme_color`, `splashBackground`는 `#4834D4` 그대로다. 오늘 확정한 브랜드 색이고, `check:secrets`가 모서리를 이 값으로 잠근다. 앱 창 바탕(`windowBackground`, Capacitor `backgroundColor`)만 `#100E0B`로 바꿔 흰 깜빡임을 없앤다.

흰 글자는 `#4834D4` 버튼 위에서 약 7.7:1이다. 오류 버튼 채움은 `#EB4D4B`(흰 글자 약 3.7:1) 대신 `#C4453C`(약 4.9:1)다. 파티 필터의 주황 채움 `#E67E22`는 유지하고, 그 위 글자는 흰 글자(약 2.9:1) 대신 `#1A1408`(약 6.4:1)이다.

```yaml
colors:
  canvas: "#100E0B"
  surface: "#1C1812"
  inset: "#2A241C"
  ink: "#F6EBD4"
  muted: "#E4D3B4"
  gem: "#4834D4"
  gem-ink: "#E4DCFF"
  gem-press: "#3C2AB9"
  gold: "#F3D48A"
  gold-fill: "#E2B657"
  gold-ink: "#1A1408"
  line: "#C6A36A"
  hairline: "#5C4C38"
  ruby: "#FFC2BC"
  ruby-fill: "#C4453C"
  emerald: "#9BE7B8"
  kakao: "#FEE500"
  kakao-ink: "#191919"
```

대비는 sRGB 상대 휘도로 계산했다. 본문·라벨은 캔버스, 카드, 입력 칸 모두에서 4.5:1 이상이다. 입력 테두리 `#C6A36A`는 칸 `#2A241C`와 약 6.5:1이다.

## Typography

내려받는 글꼴은 없다. 한글과 라틴은 같은 시스템 산세리프 스택이다.

- **제목:** 굵은 이탤릭. 화면의 이름(게임, 기록, 탭 제목)에만 쓴다.
- **본문:** 16px 근처, 보통 굵기. 긴 설명은 13~14px까지 내려가되 색은 `ink` 또는 `muted`만 쓴다.
- **라벨:** 11~12px, 굵게. 숫자 강조(승률, 횟수)는 제목 굵기에 `gem-ink` 또는 `emerald`.
- **상자 문구:** 15px, 굵게, `gold`. 연출에만 쓴다.

```yaml
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 20px
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: -0.02em
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.45
```

기기 글꼴 이름은 힌트다. 없어도 다음 글꼴로 넘어간다. `Noto Sans KR`을 번들에 넣지 않는다.

## Layout

전화는 한 열이다. 태블릿은 카드가 2~3열, 데스크톱(1024px부터)은 왼쪽 탭 기둥과 본문이다. 최대 폭은 전화 36rem, 태블릿 48rem, 데스크톱 72rem이다. 이 폭과 하단 탭·안전 영역 패딩은 이전 껍데기를 유지한다.

간격은 4px 그리드다. 화면 가장자리는 16px, 태블릿부터 24px. 탭 바 위로 본문이 가리지 않게 아래 여백을 둔다. 상단 헤더와 하단 탭, 스캔 시트는 `env(safe-area-inset-*)`와 Capacitor `--safe-area-inset-*`를 같이 쓴다.

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 14px
  margin: 16px
  header: 60px
  tab-bar: 64px
```

## Elevation & Depth

그림자로 층을 만들지 않는다. 바탕 `#100E0B`, 카드 `#1C1812`, 입력 칸 `#2A241C` 순으로 한 단씩 밝아진다. 카드 맨 위에는 얇은 금 하이라이트(직선 그라데이션, 불투명도 8%)가 있다. 페이지 위쪽에는 자수정과 금의 은은한 빛이 깔린다. 반복 점 무늬는 CSS 안 SVG이고, 파일로 두지 않는다.

모달은 카드와 같은 면이고, 뒤는 검은 막(40~50%)이다. 사진 위의 칩은 검은 막을 유지한다. 인쇄 도록은 이 어두운 층을 쓰지 않고 흰 종이·검은 글자로 돌아간다.

## Shapes

카드와 모달은 크게 둥글다(20~32px). 버튼과 필터, 탭의 선택 알약은 알약형이다. 입력은 16px. 로고 타일은 12px 사각에 자수정 면과 닫힌 상자다.

```yaml
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
```

## Components

- **버튼:** 주요 동작은 `#4834D4` 면, 흰 글자, 누르면 `#3C2AB9`. 홈의 "새 플레이 기록"과 사진 일괄 등록은 금패(`#E2B657` 면, `#1A1408` 글자)다. 보조 버튼은 칸 색 면과 양피지 글자. 파괴 동작은 `#C4453C` 면, 흰 글자. 카카오 공유만 `#FEE500`.
- **칩·탭:** 선택되면 자수정 면과 흰 글자. 아니면 카드 면, 보조 글자, 헤어라인. 하단 탭의 선택 글자는 `gem-ink`. 가운데 기록 추가는 자수정 원, 고리는 탭 면과 같은 `#1C1812`.
- **카드:** 표면 색, 헤어라인, 위쪽 금 빛. 게임 사진이 주인공이고 배지는 그 위에 얹는다.
- **입력:** 칸 색 면, `#C6A36A` 테두리, 양피지 글자, 플레이스홀더 `#E4D3B4`(불투명도 1). 포커스는 2px `#E4DCFF` 외곽선, 오프셋 2px. 네이티브 컨트롤은 `color-scheme: dark`.
- **목록:** 행 사이 8~14px. 구분선은 헤어라인. 빈 상태는 점선 헤어라인과 주요 버튼.
- **상자 연출:** 첫 진입과 새 게임 저장(사진으로 여러 개를 등록한 경우 포함)에만. SVG 뚜껑이 회전하고 빛이 올라온다. 약 2.2초 뒤 사라진다. 건너뛰기 버튼(최소 44×44px)과 Escape. 베일은 클릭을 가로채지 않는다. `prefers-reduced-motion: reduce`이면 애니메이션 없이 열린 자세를 약 0.8초 보여 준다.
- **추억 카드:** 저장 직후 공유 시트와 기록 목록에 둔다. 안쪽 여백은 16px. 사진은 둥근 칸이고, 없으면 `#4834D4` 면 위의 상자다. "추억 카드" 라벨은 금색, 제목·참여자·승자는 양피지다. 테이프·스티커는 없다.
- **달력:** 기록 탭의 월 격자. 일곱 열이 화면 안에 들어가고, 기록이 있는 날만 썸네일이나 금색 점을 갖는다. 사진이 있는 날은 칸을 채운 썸네일 위에 날짜를 올린다. 칸 높이는 48px 이상. 모션은 넣지 않는다.

```yaml
components:
  button-primary:
    backgroundColor: "{colors.gem}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: 12px
  button-primary-press:
    backgroundColor: "{colors.gem-press}"
  button-gold:
    backgroundColor: "{colors.gold-fill}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.full}"
    padding: 12px
  button-quiet:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 12px
  chip-selected:
    backgroundColor: "{colors.gem}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
  chip-idle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  field:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  tab-active:
    textColor: "{colors.gem-ink}"
  chest-caption:
    textColor: "{colors.gold}"
    typography: "{typography.label}"
```

## Do's and Don'ts

- 주요 버튼 채움과 아이콘·스플래시 면에는 `#4834D4`를 쓴다.
- 어두운 면 위의 작은 글자·아이콘·포커스 링에는 `#E4DCFF`를 쓴다. `#4834D4`를 그 자리에 쓰지 않는다.
- 본문 대비는 4.5:1, 입력 테두리와 포커스 표시는 3:1을 지킨다.
- 카카오 노랑과 카카오 미리보기 말풍선 색을 금색으로 바꾸지 않는다.
- 글꼴 파일, 스톡 영상, 저작권이 불분명한 상자 그림을 넣지 않는다. 상자는 저장소의 SVG만 쓴다.
- 연출이 기록 버튼의 클릭을 막지 않게 한다. 건너뛰기를 두고, 모션 줄이기를 존중한다.
- 인쇄 도록은 흰 바탕과 검은 글자로 둔다.
- 안전 영역, 전화 한 열, 1024px 사이드 탭을 깨지 않는다.
