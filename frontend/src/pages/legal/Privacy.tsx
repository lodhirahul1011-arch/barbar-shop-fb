import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Privacy() {
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
        <h1 className="text-4xl md:text-6xl font-black m-0 leading-tight uppercase tracking-tighter">PRIVACY<br /><span className="text-accent underline text-3xl md:text-5xl">POLICY</span></h1>
      </div>

      <div className="space-y-12 text-slate-500 font-medium leading-relaxed">
        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">1. DATA COLLECTION</h2>
          <p>
            We collect minimal data necessary to provide our grooming services. This includes your phone number for authentication via WhatsApp and SMS, and your name for appointment booking. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">2. WHATSAPP INTEGRATION</h2>
          <p>
            Our service uses WhatsApp to send booking confirmations and reminders. By using BarberFlow, you consent to receive these essential service messages. We use the official WhatsApp Business API to ensure your data is handled securely.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">3. SECURITY</h2>
          <p>
            We implement industry-standard security measures, including Firebase Zero-Trust authentication and Firestore security rules, to protect your data from unauthorized access.
          </p>
        </section>
      </div>
      
      <div className="mt-24 pt-12 border-t border-[var(--color-border)] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-50">Last Updated: May 2024 • BarberFlow Engine v1.0</p>
      </div>
    </div>
  );
}
