# ADR-0008: FAQ answers stored as sanitized HTML

**Status:** Accepted
**Date:** 2026-10-10 (recorded after the fact; chosen November 2025)
**Deciders:** Martin Wittemann

## Context

FAQ answers need light formatting: links (parking, directions), bold text and lists. They are edited in the Supabase table editor, which only offers plain text fields.

## Decision

Store answers as a small subset of HTML in `faq.answer`. Clean them in the browser with DOMPurify before display, allowing only `a, b, i, em, strong, p, br, ul, ol, li` and the attributes `href, target, rel` (see `lib/sanitizeFaq.ts`). Links to `http(s)` open in a new tab with `rel="noopener noreferrer"`; `target` is removed from all other links.

## Options Considered

### Option A: Sanitized HTML (chosen)

**Pros:** No extra dependency apart from DOMPurify. Editors can write simple tags by hand.
**Cons:** Writing HTML by hand in a table cell is error-prone. Relies on the sanitizer being kept up to date.

### Option B: Markdown

**Pros:** Nicer to write.
**Cons:** Needs a Markdown renderer plus sanitizing anyway. Not worth it for about 10 answers.

### Option C: Plain text

**Pros:** No XSS risk at all.
**Cons:** No links or lists.

## Consequences

- Even though only trusted users can write FAQ rows (read-only public access per [ADR-0004](0004-client-side-realtime-reads.md)), the sanitizer stays as a second line of defence.
- `isomorphic-dompurify` is part of the dependency update pass before each event.
