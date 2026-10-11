import DOMPurify from 'isomorphic-dompurify';

const EXTERNAL_HREF = /^https?:/i;

// Registered once at module scope. This is the only DOMPurify caller in the app.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName !== 'A') return;
  if (EXTERNAL_HREF.test((node.getAttribute('href') ?? '').trim())) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  } else {
    node.removeAttribute('target');
    node.removeAttribute('rel');
  }
});

/** Cleans FAQ answer HTML; external links open in a new tab. */
export function sanitizeFaq(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
