'use client';

import { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRealtimeTable } from '@/lib/useRealtimeTable';

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

export default function Page() {
  const faqs = useRealtimeTable<FAQ>('faq', [{ column: 'question' }]);
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleQuestion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // Sanitize HTML to prevent XSS attacks
  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a',
        'b',
        'i',
        'em',
        'strong',
        'p',
        'br',
        'ul',
        'ol',
        'li',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
        <p className="text-gray-700 dark:text-gray-200">
          Willkommen beim Bretten Kangaroos Xmas-Ball! Hier findest du alle
          wichtigen Informationen rund um das Turnier. Klicke auf eine Frage, um
          die Antwort zu sehen.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id}>
            <button
              onClick={() => toggleQuestion(faq.id)}
              className="w-full py-2 text-left flex justify-between items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="font-semibold pr-4">{faq.question}</span>
              <svg
                className={`w-5 h-5 shrink-0 transform transition-transform ${
                  openId === faq.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {openId === faq.id && (
              <div
                className="py-2 text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(faq.answer),
                }}
              />
            )}
          </div>
        ))}
      </div>

      {faqs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          Keine FAQs verfügbar.
        </p>
      )}
    </div>
  );
}
