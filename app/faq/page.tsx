'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

export default function Page() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initial fetch
    const fetchFaqs = async () => {
      const { data, error } = await supabase.from('faq').select().order('id');
      if (error) {
        console.error('Supabase error:', error);
      } else if (data) {
        setFaqs(data);
      }
    };

    fetchFaqs();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('faq-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faq' },
        async () => {
          // Re-fetch when changes occur
          await fetchFaqs();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-gray-700">
          Willkommen beim Bretten Kangaroos Xmas-Cup! Hier findest du alle
          wichtigen Informationen rund um das Turnier. Klicke auf eine Frage, um
          die Antwort zu sehen.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id}>
            <button
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
                className="py-2 text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(faq.answer),
                }}
              />
            )}
          </div>
        ))}
      </div>

      {faqs.length === 0 && (
        <p className="text-gray-500">Keine FAQs verfügbar.</p>
      )}
    </div>
  );
}
