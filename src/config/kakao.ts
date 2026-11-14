/**
 * TODO: 카카오 개발자 앱 키가 정해지면 이 문자열만 채운다.
 * 비어 있으면 카카오 공유 창을 열지 않고, 기기의 공유 또는 링크 복사만 한다.
 */
export const KAKAO_APP_KEY = '';

/** Null when the key is still the empty placeholder, so a stand-in key cannot be sent. */
export function kakaoSharerUrl(pageUrl: string, appKey: string = KAKAO_APP_KEY): string | null {
  const key = appKey.trim();
  if (!key) return null;
  return `https://sharer.kakao.com/talk/friends/picker/link?app_key=${encodeURIComponent(key)}&shortKey=${encodeURIComponent(pageUrl)}`;
}
