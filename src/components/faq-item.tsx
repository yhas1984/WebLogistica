'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="bento-card !p-0 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
                <span className="text-sm font-medium text-white pr-4">{question}</span>
                <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="px-6 pb-5 text-sm text-white/40 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
}
