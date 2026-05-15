import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ShopSettings } from '../../types';
import { Save, Clock, Calendar, Ban, User, Trash2, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function OwnerSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const shopId = 'default-shop';

  useEffect(() => {
    async function fetchSettings() {
      const snap = await getDoc(doc(db, 'shops', shopId));
      if (snap.exists()) {
        setSettings(snap.data().settings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'shops', shopId), { settings });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      workingHours: {
        ...settings.workingHours,
        [day]: {
          ...settings.workingHours[day],
          [field]: value
        }
      }
    });
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-[10px] text-slate-500">Loading infrastructure...</div>;

  return (
    <div className="space-y-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight underline decoration-accent/30 underline-offset-8 uppercase">Shop Config</h2>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Core operational parameters and logic gates.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-accent text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-amber-600 transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50"
        >
          <Save className="w-5 h-5" /> {saving ? 'Writing...' : 'Update Global State'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Working Hours */}
        <section className="bg-[var(--color-card)] p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center gap-4 mb-10 overflow-hidden">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Operational Hours</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Define your availability windows.</p>
            </div>
          </div>

          <div className="space-y-3">
            {settings && Object.entries(settings.workingHours).map(([day, hrs]: [string, any]) => (
              <div key={day} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl transition-all ${hrs.isClosed ? 'bg-red-500/5 opacity-60' : 'bg-black/5 hover:bg-black-[0.07]'}`}>
                <span className="font-black uppercase tracking-widest text-[10px] text-ink mb-4 sm:mb-0 w-24">{day}</span>
                <div className="flex flex-wrap items-center gap-4 flex-1 justify-end">
                   <div className={`flex items-center gap-3 transition-opacity ${hrs.isClosed ? 'opacity-20 pointer-events-none' : ''}`}>
                    <input 
                      type="time" 
                      value={hrs.open} 
                      onChange={e => updateWorkingHours(day, 'open', e.target.value)}
                      className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-accent w-28 text-center border border-transparent shadow-sm"
                    />
                    <span className="text-slate-400 font-black text-[10px]">TO</span>
                    <input 
                      type="time" 
                      value={hrs.close} 
                      onChange={e => updateWorkingHours(day, 'close', e.target.value)}
                      className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-accent w-28 text-center border border-transparent shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 sm:ml-6 sm:border-l sm:pl-6 border-slate-200">
                    <button 
                      onClick={() => updateWorkingHours(day, 'isClosed', !hrs.isClosed)}
                      className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all ${hrs.isClosed ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {hrs.isClosed ? 'CLOSED' : 'OPEN'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-8 col-span-1">
          {/* Slot Duration */}
          <section className="bg-[var(--color-card)] p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm">
             <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-accent" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Reservation Unit</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose mb-8">Standard atomic time unit per customer sitting.</p>
            
            <div className="flex items-center gap-6">
              <input 
                type="number" 
                value={settings?.slotDuration}
                onChange={e => setSettings({...settings!, slotDuration: Number(e.target.value)})}
                className="flex-1 p-5 bg-black/5 rounded-2xl font-black text-2xl text-center focus:ring-2 focus:ring-accent outline-none border border-transparent"
              />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Min</div>
            </div>
          </section>

          {/* Danger Zone / Extra Config */}
          <section className="bg-ink p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ban className="w-20 h-20" />
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Access Rights</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed mb-10">Provision additional admin seats or restricted staff views for your artisans.</p>
               <button className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5 active:scale-95">
                 Manage Permissions
               </button>
             </div>
          </section>

          <div className="p-8 bg-accent/5 rounded-[2rem] border border-accent/10">
             <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">Advanced Logic Gates</p>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Min Notice (Min)</span>
                   <input 
                      type="number"
                      value={settings?.minimumBookingNoticeMinutes || 60}
                      onChange={e => setSettings({...settings!, minimumBookingNoticeMinutes: Number(e.target.value)})}
                      className="w-16 p-2 bg-white rounded-lg text-center font-black text-[10px] outline-none border border-slate-200"
                   />
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Max Advance (Days)</span>
                   <input 
                      type="number"
                      value={settings?.maxAdvanceBookingDays || 30}
                      onChange={e => setSettings({...settings!, maxAdvanceBookingDays: Number(e.target.value)})}
                      className="w-16 p-2 bg-white rounded-lg text-center font-black text-[10px] outline-none border border-slate-200"
                   />
                </div>
             </div>
             <p className="text-[8px] font-black text-accent/50 uppercase tracking-[0.2em] mt-4 leading-loose text-center">
               These parameters define the strict boundaries of your booking window.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
