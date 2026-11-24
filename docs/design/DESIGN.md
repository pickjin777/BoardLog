---
version: alpha
name: 보드로그 보물 상자
description: 네이비 바탕 위의 크림 정보와 골드 동작. 보드게임 상자를 열면 기록이 카드로 나오는 화면.
---

# 보드로그 보물 상자

## Overview

보드로그는 자기 보드게임과 플레이를 이 기기에 남겨 두는 기록장이다. 상자를 화면마다 반복하지 않는다. 홈에서 한 번 열고, 그 다음부터는 꺼낸 카드와 선반과 게임판을 본다.

바탕은 깊은 네이비 `#0E1628`이다. 따뜻한 골드 `#E2B657`는 주요 동작과 로고 타일에 쓴다. 제목과 수치와 추억 카드는 크림 `#F6EBD4` 위에 둔다. 보라를 쓰지 않는다. 아이콘, 스플래시, `theme-color`, 매니페스트 `background_color`도 같은 네이비이고, 마크는 골드 상자다. `check:secrets`가 그 모서리와 색 이름을 잠근다.

기능 이름은 "게임 등록", "플레이 기록"처럼 그대로 둔다. 보물 표현은 보조 문구와 그림에만 둔다.

문서 형식은 DESIGN.md 규약을 따른다. 다른 서비스의 로고, 상표, 문장은 가져오지 않는다. 글꼴 파일을 내려받지 않는다. 한글은 기기에 있는 산세리프가 그린다.

홈의 상자 그림은 사용자가 만든 이미지를 투명 WebP로 줄인 `public/hero/chest-160.webp`, `chest-320.webp`, `chest-480.webp`다. 글자는 그림 안에 없다. 첫 진입, 게임 등록, 레벨업의 짧은 연출은 `src/components/TreasureChest.tsx`의 SVG다. 왕관, 금화, 중세 장식, 카드마다의 금색 선은 쓰지 않는다.

카카오톡 버튼의 노랑 `#FEE500`과 글자 `#191919`는 카카오 버튼이라 이 팔레트로 칠하지 않는다. 공유 미리보기의 옅은 파랑 말풍선(`#B2C7D9`)도 그대로 둔다.

## Colors

읽히는 글자는 크림 면 위의 먹색이거나, 네이비 면 위의 크림이다. 강조 글자는 네이비 위에서 골드 `#E2B657`, 크림 위에서 청동 `#6B4423`이다. 포커스 링은 네이비 위에서 `#F3D48A`, 크림 위에서 `#1C160E`다.

아이콘 모서리, 스플래시 바탕, `theme-color`, 매니페스트 `theme_color`와 `background_color`, `splashBackground`, 웹뷰 바탕은 `#0E1628`이다. `check:secrets`가 이 값을 잠근다. 앱 창 바탕도 `#0E1628`이다.

황동 명판 글자는 네이비 `#0E1628`이다. 흰 글자를 골드 위에 올리지 않는다. 오류 버튼 채움은 `#C4453C`다. 승률 숫자는 크림 위에서 `#1B6B43`이고, 옆에 "N승"을 같이 적는다. 색만으로 상태를 말하지 않는다.

```yaml
colors:
  canvas: "#0E1628"
  surface: "#172033"
  inset: "#243044"
  cream: "#F6EBD4"
  cream-ink: "#1C160E"
  cream-muted: "#5C4632"
  ink: "#F6EBD4"
  muted: "#E4D3B4"
  gold: "#F3D48A"
  gold-fill: "#E2B657"
  gold-press: "#C9A24A"
  gold-ink: "#1A1408"
  line: "#2C3C56"
  input-line: "#C6B48A"
  focus: "#F3D48A"
  focus-on-cream: "#1C160E"
  ruby-fill: "#C4453C"
  emerald-on-cream: "#1B6B43"
  kakao: "#FEE500"
  kakao-ink: "#191919"
```

대비는 sRGB 상대 휘도로 맞춘다. 본문과 라벨은 4.5:1 이상, 입력 테두리와 포커스는 3:1 이상이다.

## Typography

내려받는 글꼴은 없다. 한글과 라틴은 같은 시스템 산세리프 스택이다. `word-break: keep-all`로 한글 단어 중간을 자르지 않는다.

- **제목:** 20px, 굵기 600. 화면의 이름에만 쓴다.
- **본문:** 16px 근처, 굵기 400.
- **라벨:** 12px, 굵기 500.
- **상자 문구:** 15px, 굵기 600, 골드. 연출에만 쓴다.

```yaml
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
```

`Noto Sans KR`을 번들에 넣지 않는다. 없어도 다음 글꼴로 넘어간다.

## Layout

전화는 한 열이다. 태블릿은 카드가 2~3열, 데스크톱(1024px부터)은 왼쪽 탭 기둥과 본문이다. 최대 폭은 전화 36rem, 태블릿 48rem, 데스크톱 72rem이다.

홈은 오늘의 보물 한 칸, 수치, 그다음 실제 게임이 있을 때만 표지 레일이다. 컬렉션은 표지 우선 격자다. 게임 상세와 마이 페이지 전시대도 같은 네이비·골드·크림이다. 다른 상점의 색, 로고, 가격은 쓰지 않는다.

간격은 4px 그리드다. 화면 가장자리는 16px, 태블릿부터 24px. 하단 탭은 아이콘과 이름이고, 가운데 기록 추가는 탭 안에 둔다. 본문은 탭과 안전 영역 위로 올라오지 않게 아래 여백을 둔다.

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 16px
  header: 60px
  tab-bar: 76px
```

터치 대상은 48×48px다. 320px 달력의 요일 칸만 너비 예외다. 높이는 48px 이상을 유지한다.

## Elevation & Depth

층은 밝기로 만든다. 바탕 `#0E1628`, 면 `#172033`, 입력 `#243044`. 정보 면은 반대로 크림 `#F6EBD4`다. 카드 그림자는 짧은 네이비 그림자 하나다. 금색 하이라이트 줄, 자수정 번짐, 글자 그라데이션, 반복 점 무늬는 쓰지 않는다.

모달은 크림 면이고, 뒤는 검은 막(약 50%)이다. 인쇄 도록은 흰 종이와 검은 글자다.

## Shapes

카드는 16px, 추억 카드와 달력 바깥은 24px다. 동작 버튼은 모서리 8px 명판이다. 필터 칩은 알약형이다. 레벨 칸은 8px 사각이다. 로고 타일은 12px 사각에 골드 면과 작은 상자다. 잠금 장식은 금, 크림, 구리 `#C9956A`다.

```yaml
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
```

## Components

- **버튼:** 주요 동작은 황동 명판이다. 위는 `#FBF6DF`, 가운데 `#E8C56A`, 아래 테는 `#8A6424`. 네 모서리 리벳과 안쪽 1px 음각선. 글자는 네이비 `#0E1628`, 굵기 700. 나란히 두는 두 번째 동작과 조용한 동작은 네이비 판(`#172033`)에 황동 테 `#C6A36A`와 리벳, 글자는 크림 `#F6EBD4`. 누르면 1~2px 내려가고 안쪽 그림자가 짙어진다. 끄면 채도를 낮춘다. 포커스는 크림 링과 네이비 외곽선이다. 작은 칩과 아이콘 버튼은 같은 금속이고 리벳은 없다. 파괴 동작은 `#C4453C`. 카카오 공유만 `#FEE500`. `prefers-reduced-motion`이면 이동만 없앤다.
- **칩:** 선택되면 황동 면과 네이비 글자. 아니면 네이비 면, 황동 테, 크림 글자. 리벳은 없다. `aria-pressed`를 같이 둔다.
- **카드:** 금색 테두리를 두르지 않는다. 추억 카드는 크림 종이. 게임 카드는 표지가 위, 크림 정보가 아래, 선반 막대 위에 놓인다. 출판사 그림이 없으면 임시 상자 표지를 쓴다. 한글 이름(없으면 저장된 제목)은 상자 앞면의 크림 명판에 먹색 `#1C160E`으로 1~2줄이다. 길면 줄이고, 그래도 넘치면 말줄임이다. 상태와 횟수는 상자 아래 정보 칸에 둔다. 삭제는 상세 화면에서만 하고 확인을 받는다. 목록, 상세, 달력, 추억 카드가 같은 표지다. 첨부 사진이 있으면 그 사진이 우선이다. 출판사 그림은 허락이 있기 전에는 넣지 않는다.
- **장르 상자:** 케이스 그림이 없을 때만 장르와 태그로 상자 모양을 고른다. 먼저 맞는 규칙이 이긴다. 공포·스릴러·크툴루·좀비는 랜턴이 있는 어두운 상자, 추리·추론·범죄·방탈출은 물음표, 단어·퀴즈·연상은 말풍선, 주사위·푸시유어럭은 주사위, 파티·블러핑·순발력은 리본 상자, 추상·퍼즐·타일은 도형, 카드·덱빌딩·트릭테이킹은 카드, 협력·팀전은 사슬, 경제·무역·경매·경영은 동전, 가족·유아는 별이 있는 둥근 상자, 전략·일꾼·엔진은 왕관, 나머지는 기본 보물 상자다. 색은 네이비·브라운·골드·크림뿐이다.
- **입력:** `#243044` 면, `#C6B48A` 테두리, 크림 글자. 포커스는 2px 링.
- **하단 탭:** 아이콘과 이름. 현재 탭은 굵기와 짧은 골드 막대와 `aria-current="page"`. 가운데 기록 추가는 리벳 없는 황동 원이고 본문을 가리지 않는다.
- **레벨 경로:** 번호가 있는 칸과, 지금 칸 위의 미플. 홈은 다섯 칸, 자세히는 더 긴 경로다. 자세한 경로와 문제 목록, 배지 선반은 처음 화면 묶음 밖에 둔다.
- **상자 연출:** 첫 진입, 새 게임 저장, 레벨업. 약 2.2초. 건너뛰기(최소 48×48px)와 Escape. 베일은 클릭을 가로채지 않는다. `prefers-reduced-motion: reduce`이면 애니메이션 없이 열린 자세를 약 0.8초 보여 준다.
- **달력:** 펼친 기록장. 크림 칸, 먹색 숫자. 기록이 있는 날은 미플 모양 표시나 사진. 오늘은 밑줄, 선택한 날은 먹색 외곽선. 이전·다음은 골드 버튼에 "이전", "다음"을 적는다.
- **수집:** 경험치, 문제, 배지, 상자 잠금 모양은 `boardlog_progress_${uid}`에만 둔다. 게임과 기록의 형식은 바꾸지 않는다. JSON 백업은 그 진행을 같이 넣고, 진행 칸이 없는 예전 파일도 읽는다(D-054). 진행은 기기에 있는 기록으로만 계산한다.

```yaml
components:
  button-gold:
    backgroundColor: "{colors.gold-fill}"
    textColor: "#0E1628"
    rounded: "{rounded.sm}"
    padding: 12px
  button-cream:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 12px
  chip-selected:
    backgroundColor: "{colors.gold-fill}"
    textColor: "#0E1628"
    rounded: "{rounded.full}"
  chip-idle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.cream-ink}"
    rounded: "{rounded.lg}"
  field:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  tab-active:
    textColor: "{colors.gold-fill}"
  chest-caption:
    textColor: "{colors.gold}"
    typography: "{typography.label}"
```

## Do's and Don'ts

- 주요 동작은 황동 명판이고 글자는 `#0E1628`이다. 보조 동작은 네이비 판, 황동 테, 크림 글자다.
- 앱 화면과 아이콘·스플래시·`theme-color`에 보라를 쓰지 않는다. 껍데기는 네이비 `#0E1628`과 골드 상자다.
- 카드마다 금색 선을 두르지 않는다. 면의 밝기, 그림자, 여백으로 나눈다.
- 크림 면의 본문은 `#1C160E` 또는 `#5C4632`다.
- 본문 대비는 4.5:1, 입력 테두리와 포커스는 3:1을 지킨다. 상태는 색만으로 구분하지 않는다.
- 카카오 노랑과 카카오 미리보기 말풍선 색을 골드로 바꾸지 않는다.
- 글꼴 파일을 넣지 않는다. 홈 상자 그림은 `public/hero/`의 WebP만 쓰고, 연출 상자는 저장소의 SVG만 쓴다.
- 연출이 기록 버튼의 클릭을 막지 않게 한다. 건너뛰기를 두고, 모션 줄이기를 존중한다.
- 경험치는 기록 id마다 한 번이고, 기록을 지우면 그 점수도 지운다. 없는 진행을 만들어 보여 주지 않는다.
- 인쇄 도록은 흰 바탕과 검은 글자로 둔다.
- 안전 영역, 전화 한 열, 1024px 사이드 탭을 깨지 않는다.
