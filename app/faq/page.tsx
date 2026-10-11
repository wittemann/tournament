'use client';

import { useState } from 'react';
import Spinner from '../Spinner';
import ConnectionBanner from '../ConnectionBanner';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { sanitizeFaq } from '@/lib/sanitizeFaq';

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

export default function Page() {
  const {
    rows: faqs,
    loading,
    error,
  } = useRealtimeTable<FAQ>('faq', [{ column: 'question' }]);
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleQuestion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <ConnectionBanner show={error} />

      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-gray-700">
          Willkommen beim Bretten Kangaroos Xmas-Ball! Hier findest du alle
          wichtigen Informationen rund um das Turnier. Klicke auf eine Frage, um
          die Antwort zu sehen.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id}>
            <button
              type="button"
              id={`faq-question-${faq.id}`}
              aria-expanded={openId === faq.id}
              aria-controls={`faq-answer-${faq.id}`}
              onClick={() => toggleQuestion(faq.id)}
              className="w-full py-2 text-left flex justify-between items-center hover:text-gray-600 transition-colors"
            >
              <span className="font-semibold pr-4">{faq.question}</span>
              <svg
                className={`w-5 h-5 shrink-0 transform transition-transform ${
                  openId === faq.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              id={`faq-answer-${faq.id}`}
              aria-labelledby={`faq-question-${faq.id}`}
              hidden={openId !== faq.id}
              className="py-2 text-gray-700"
              dangerouslySetInnerHTML={{
                __html: openId === faq.id ? sanitizeFaq(faq.answer) : '',
              }}
            />
          </div>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && !error && faqs.length === 0 && (
        <p className="text-gray-500">Keine FAQs verfügbar.</p>
      )}
    </div>
  );
}
