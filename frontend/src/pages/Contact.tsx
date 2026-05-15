import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, MapPin, Phone, Globe, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 bg-[var(--color-paper)] min-h-screen font-sans transition-colors">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="text-4xl md:text-6xl font-black m-0 leading-tight uppercase tracking-tighter">CONTACT<br /><span className="text-accent underline text-3xl md:text-5xl">OFFICE</span></h1>
      </div>

      <div className="grid md:grid-cols-5 gap-1 bg-[var(--color-border)] border border-[var(--color-border)]">
        <div className="md:col-span-2 space-y-1">
          <div className="p-10 bg-[var(--color-card)] flex flex-col items-start h-full">
            <Mail className="w-8 h-8 text-accent mb-10" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Corporate Email</h3>
            <p className="font-black text-xl mb-12">hello@barberflow.io</p>
            
            <Phone className="w-8 h-8 text-accent mb-10" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Direct Line</h3>
            <p className="font-black text-xl mb-12">+1 (555) 092-8831</p>

            <MapPin className="w-8 h-8 text-accent mb-10" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Primary HQ</h3>
            <p className="font-black text-xl uppercase leading-tight">642 Tech Plaza,<br />San Francisco, CA</p>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="p-8 md:p-12 bg-[var(--color-card)] h-full">
             {!submitted ? (
               <form onSubmit={handleSubmit} className="space-y-8">
                 <h2 className="text-3xl font-black uppercase tracking-tight mb-10 leading-none">SEND US A<br />DIRECT WIRE</h2>
                 
                 <div className="space-y-6">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Your Full Identity</label>
                     <input 
                       type="text" 
                       required
                       placeholder="NAME OR ORGANIZATION"
                       className="w-full bg-[var(--color-paper)] border border-[var(--color-border)] px-6 py-5 font-black uppercase text-xs focus:border-accent outline-none text-ink" 
                     />
                   </div>

                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Route To</label>
                     <select className="w-full bg-[var(--color-paper)] border border-[var(--color-border)] px-6 py-5 font-black uppercase text-xs focus:border-accent outline-none text-ink appearance-none">
                       <option>Media & PR</option>
                       <option>Partnerships</option>
                       <option>Investments</option>
                       <option>Technical Careers</option>
                     </select>
                   </div>

                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Transmission Details</label>
                     <textarea 
                       rows={4}
                       required
                       placeholder="TYPE YOUR MESSAGE..."
                       className="w-full bg-[var(--color-paper)] border border-[var(--color-border)] px-6 py-5 font-black uppercase text-xs focus:border-accent outline-none text-ink"
                     ></textarea>
                   </div>
                 </div>

                 <button className="w-full bg-ink text-[var(--color-paper)] py-6 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-xl shadow-ink/10">
                   Initiate Message <Send className="w-4 h-4" />
                 </button>
               </form>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="py-24 text-center space-y-8"
               >
                 <div className="w-20 h-20 bg-accent text-white flex items-center justify-center mx-auto rounded-full shadow-2xl shadow-accent/20">
                    <Globe className="w-10 h-10" />
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter">MESSAGE<br /><span className="text-accent underline text-3xl">ROUTED</span></h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-loose max-w-xs mx-auto">
                   Your signal has been received. Our team will decrypt and respond within 12 standard hours.
                 </p>
                 <button 
                  onClick={() => setSubmitted(false)}
                  className="bg-black/5 dark:bg-white/5 text-slate-500 hover:text-ink px-10 py-4 font-black uppercase tracking-widest text-[10px] transition-all rounded-sm"
                 >
                   Send Another
                 </button>
               </motion.div>
             )}
          </div>
        </div>
      </div>

      <div className="mt-24 pt-12 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-50">Global Communication Node: 09-SF-01</p>
        <div className="flex gap-8">
           {['LinkedIn', 'Twitter', 'GitHub'].map(social => (
             <span key={social} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-accent cursor-pointer transition-colors">
               {social}
             </span>
           ))}
        </div>
      </div>
    </div>
  );
}
