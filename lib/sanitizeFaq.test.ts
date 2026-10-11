import { describe, expect, it } from 'vitest';
import { sanitizeFaq } from './sanitizeFaq';

describe('sanitizeFaq', () => {
  it('opens http(s) links in a new tab with noopener', () => {
    const out = sanitizeFaq('<a href="https://example.com">x</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('leaves relative and mailto links alone', () => {
    for (const href of ['/faq', 'mailto:a@b.de']) {
      const out = sanitizeFaq(`<a href="${href}">x</a>`);
      expect(out).not.toContain('target');
      expect(out).not.toContain('rel=');
    }
  });

  it('strips scripts and event handlers', () => {
    const out = sanitizeFaq(
      '<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">y</a>',
    );
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('javascript:');
  });

  it('overrides existing target and rel on external links', () => {
    const out = sanitizeFaq(
      '<a href="http://example.com" target="_self" rel="opener">x</a>',
    );
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('opener"');
    expect(out).not.toContain('_self');
  });

  it('removes target from non-http links', () => {
    expect(sanitizeFaq('<a href="/x" target="_blank">x</a>')).not.toContain(
      'target',
    );
  });
});
