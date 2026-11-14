export type StoragePlace = 'browser' | 'device';

/** Installed shells, and Android or Windows, talk about the device rather than a browser. */
export function storagePlace(native: boolean, userAgent: string): StoragePlace {
  if (native) return 'device';
  if (/Electron/i.test(userAgent)) return 'device';
  if (/Android/i.test(userAgent)) return 'device';
  if (/Windows/i.test(userAgent)) return 'device';
  return 'browser';
}

export function localStorageNoticeText(place: StoragePlace): { lead: string; rest: string } {
  if (place === 'device') {
    return {
      lead: '이 기기에만',
      rest: ' 저장돼요. 기기를 바꾸거나 앱을 지우면 사라질 수 있어요. JSON 백업을 사용해 주세요.'
    };
  }
  return {
    lead: '이 기기의 브라우저에만',
    rest: ' 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면 사라질 수 있어요.'
  };
}

export function recordStorageSentence(place: StoragePlace): string {
  if (place === 'device') {
    return '게임, 플레이 기록, 함께한 사람의 이름, 사진은 이 기기에만 저장됩니다. 보드로그 서버로 보내지 않습니다. 기기를 바꾸거나 앱을 지우면 사라질 수 있으니 JSON 백업을 사용해 주세요.';
  }
  return '게임, 플레이 기록, 함께한 사람의 이름, 사진은 이 기기의 브라우저에만 저장됩니다. 보드로그 서버로 보내지 않습니다.';
}

export function recordLossSentence(place: StoragePlace): string {
  if (place === 'device') {
    return '그래서 앱을 지우거나 기기를 바꾸면 기록이 사라질 수 있어요. 마이페이지의 JSON 백업으로 미리 저장해 두세요.';
  }
  return '그래서 브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라질 수 있어요. 마이페이지의 백업 파일로 미리 저장해 두세요.';
}
