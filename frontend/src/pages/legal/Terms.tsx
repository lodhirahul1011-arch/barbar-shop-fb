import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 bg-[var(--color-paper)] min-h-screen font-sans transition-colors">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="text-4xl md:text-6xl font-black m-0 leading-tight uppercase tracking-tighter">TERMS OF<br /><span className="text-accent underline text-3xl md:text-5xl">SERVICE</span></h1>
      </div>

      <div className="space-y-12 text-slate-500 font-medium leading-relaxed">
        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">1. BOOKING RULES</h2>
          <p>
            Users are responsible for arriving on time for their scheduled appointments. Cancellations or rescheduling should be done at least 2 hours in advance. Repeated no-shows may lead to account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">2. PAYMENTS</h2>
          <p>
            BarberFlow facilitates the booking process. Payment for services is handled at the physical shop location unless otherwise specified by a specific shop's policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">3. USER CONDUCT</h2>
          <p>
            Users must provide accurate information (name and phone number). Any attempt to manipulate the booking system or bypass security measures is strictly prohibited.
          </p>
        </section>
      </div>

      <div className="mt-24 pt-12 border-t border-[var(--color-border)] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-50">Last Updated: May 2024 • BarberFlow Engine v1.0</p>
      </div>
    </div>
  );
}
