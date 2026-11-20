import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export function ErrorFallback({ onReload }: { onReload: () => void }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem('boardlog-preview-error');
    } catch {
      // The recovery screen must still render when storage is blocked.
    }
  }, []);
  return (
    <div id="app-error-screen" className="flex min-h-screen items-center justify-center bg-[#0E1628] p-6">
      <div className="w-full max-w-sm rounded-3xl bg-[#F6EBD4] p-6 text-[#1C160E]">
        <h1 className="text-xl font-medium">화면을 열지 못했습니다</h1>
        <p className="mt-3 text-sm leading-relaxed">
          잠시 문제가 생겼습니다. 다시 불러오기를 눌러 주세요. 기록은 이 기기에 있습니다. 기기를 바꾸기 전에는 마이
          화면의 JSON 백업을 받아 두세요.
        </p>
        <button
          id="app-error-reload"
          type="button"
          onClick={onReload}
          className="btn-gold mt-5 w-full rounded-full px-4 text-sm font-medium"
        >
          다시 불러오기
        </button>
      </div>
    </div>
  );
}

/** Catches a render crash. The screen never includes the exception text or a stack. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('boardlog render error', error.name, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <ErrorFallback onReload={() => window.location.reload()} />;
  }
}

export function PreviewCrash(): null {
  try {
    if (sessionStorage.getItem('boardlog-preview-error') === '1') {
      throw new Error('preview');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'preview') throw err;
  }
  return null;
}
