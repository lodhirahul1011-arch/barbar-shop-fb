import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Mail, Phone, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Support() {
  const navigate = useNavigate();
  const [formStep, setFormStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 bg-[var(--color-paper)] min-h-screen font-sans transition-colors">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="text-4xl md:text-6xl font-black m-0 leading-tight uppercase tracking-tighter">GET<br /><span className="text-accent underline text-3xl md:text-5xl">SUPPORT</span></h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">Common Issues</h2>
            <div className="space-y-4">
              {[
                "How do I cancel my appointment?",
                "Not receiving WhatsApp OTP",
                "Can I book for multiple people?",
                "How to change my shop location?"
              ].map((faq, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-accent transition-all cursor-pointer rounded-xl group">
                  <HelpCircle className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-500 group-hover:text-ink">{faq}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-ink uppercase tracking-tight mb-6 underline decoration-accent/20 underline-offset-8">Direct Contact</h2>
            <div className="flex gap-4">
              <div className="flex-1 p-6 bg-ink text-[var(--color-paper)] rounded-2xl">
                <Mail className="w-6 h-6 mb-4 text-accent" />
                <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Email Us</p>
                <p className="font-black text-sm">support@barberflow.io</p>
              </div>
              <div className="flex-1 p-6 bg-accent text-white rounded-2xl">
                <MessageSquare className="w-6 h-6 mb-4" />
                <p className="text-[10px] uppercase font-black tracking-widest opacity-70">WhatsApp</p>
                <p className="font-black text-sm">+1 (555) HELP-BF</p>
              </div>
            </div>
          </section>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-10 relative overflow-hidden rounded-3xl transition-colors">
          <div className="absolute top-0 right-0 p-6 font-black text-[8px] uppercase tracking-[0.2em] text-slate-500 opacity-20">Ticket System v1.0</div>
          
          <h3 className="text-3xl font-black text-ink uppercase tracking-tighter mb-8 leading-none">SUBMIT<br />REQUEST</h3>
          
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setFormStep(2); }}>
            {formStep === 1 ? (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Category</label>
                  <select className="w-full bg-[var(--color-paper)] border border-[var(--color-border)] px-4 py-4 font-black uppercase text-xs focus:border-accent outline-none text-ink appearance-none rounded-xl">
                    <option>Booking Issue</option>
                    <option>Account Sync</option>
                    <option>Technical Error</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Message Details</label>
                  <textarea 
                    rows={4}
                    placeholder="DESCRIBE YOUR PROBLEM..."
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-border)] px-4 py-4 font-black uppercase text-xs focus:border-accent outline-none text-ink rounded-xl"
                  ></textarea>
                </div>
                <button className="w-full bg-accent text-white py-5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20 hover:bg-amber-600 transition-all">
                  Send Support Ticket
                </button>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-black uppercase mb-2 text-ink">TICKET SENT</h4>
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest leading-loose">We will respond within 24 hours via WhatsApp.</p>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
