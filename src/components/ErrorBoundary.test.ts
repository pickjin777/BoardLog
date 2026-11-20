import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

describe('ErrorFallback', () => {
  it('offers a reload and a backup reminder without a stack or the thrown text', () => {
    const html = renderToStaticMarkup(createElement(ErrorFallback, { onReload: () => undefined }));
    expect(html).toContain('다시 불러오기');
    expect(html).toContain('JSON 백업');
    expect(html).not.toContain('stack');
    expect(html).not.toContain('preview');
    expect(html).not.toContain('componentStack');
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
  });
});
