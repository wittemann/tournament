'use client';

import { useMemo, useState } from 'react';
import Spinner from '../Spinner';
import StatusCard from '../StatusCard';
import ConnectionBanner from '../ConnectionBanner';
import { Faq } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { sanitizeFaq } from '@/lib/sanitizeFaq';
import { infoLinks, infoTiles, sortFaqs } from '@/lib/info';

const linkClass =
  'flex min-h-14 items-center gap-2.5 rounded-card bg-primary p-3.5 text-base font-bold text-primary-content';

export default function Page() {
  const {
    rows: rawFaqs,
    loading,
    error,
  } = useRealtimeTable<Faq>('faq', [
    { column: 'sort' },
    { column: 'question' },
  ]);
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs = useMemo(() => sortFaqs(rawFaqs), [rawFaqs]);
  const tiles = useMemo(() => infoTiles(rawFaqs), [rawFaqs]);
  const links = useMemo(() => infoLinks(rawFaqs), [rawFaqs]);

  if (loading) return <Spinner />;

  return (
    <>
      <ConnectionBanner show={error} />

      {(tiles.length > 0 || links.length > 0) && (
        <section
          aria-label="Auf einen Blick"
          className="mb-5 grid grid-cols-2 gap-2.5"
        >
          {tiles.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-1 rounded-card bg-base-100 p-3.5"
            >
              <div className="text-xs font-bold tracking-wider text-muted uppercase">
                {t.title}
              </div>
              <div className="font-display text-3xl leading-none font-bold">
                {t.value}
              </div>
              {t.detail && <div className="text-sm text-muted">{t.detail}</div>}
            </div>
          ))}
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {l.label}
            </a>
          ))}
        </section>
      )}

      {!error && faqs.length === 0 && (
        <StatusCard>Keine FAQs verfügbar.</StatusCard>
      )}

      {faqs.length > 0 && (
        <section aria-labelledby="faq-heading" className="space-y-2.5">
          <h2
            id="faq-heading"
            className="font-display text-[22px] leading-tight font-bold text-muted uppercase"
          >
            Häufige Fragen
          </h2>
          <div className="overflow-hidden rounded-card bg-base-100">
            {faqs.map((faq) => {
              const open = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border-t border-line first:border-t-0"
                >
                  <button
                    type="button"
                    id={`faq-question-${faq.id}`}
                    aria-expanded={open}
                    aria-controls={`faq-answer-${faq.id}`}
                    onClick={() => setOpenId(open ? null : faq.id)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3.5 text-left text-base font-semibold"
                  >
                    <span className="flex-1">{faq.question}</span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    id={`faq-answer-${faq.id}`}
                    role="region"
                    aria-labelledby={`faq-question-${faq.id}`}
                    hidden={!open}
                    className="px-4 pb-4 text-[15px] leading-snug text-muted-2 [&_a]:font-bold [&_a]:text-primary [&_a]:underline"
                  >
                    {open && (
                      <>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeFaq(faq.answer),
                          }}
                        />
                        {faq.link_url && faq.link_label && (
                          <a
                            href={faq.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex min-h-10 items-center font-bold text-primary underline"
                          >
                            {faq.link_label}
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
