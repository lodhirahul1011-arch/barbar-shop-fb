import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { UserProfile, Appointment } from '../../types';
import { Search, Phone, Mail, Calendar, MessageSquare, ExternalLink, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function OwnerClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const shopId = 'default-shop';

  useEffect(() => {
    // In a real app, we might have a users collection or we derive unique customers from appointments
    // Here we query appointments to find unique customers who booked with this shop
    const q = query(collection(db, 'appointments'), where('shopId', '==', shopId), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => doc.data() as Appointment);
      const uniqueClientsMap = new Map();

      apps.forEach(app => {
        if (!uniqueClientsMap.has(app.customerId)) {
          uniqueClientsMap.set(app.customerId, {
            id: app.customerId,
            latestBooking: app.date,
            totalBookings: 1,
            notes: app.notes || 'No notes'
          });
        } else {
          const existing = uniqueClientsMap.get(app.customerId);
          existing.totalBookings += 1;
        }
      });

      setClients(Array.from(uniqueClientsMap.values()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredClients = clients.filter(c => 
    c.id.toLowerCase().includes(search.toLowerCase()) || 
    c.notes.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-[10px] text-slate-500">Retrieving client manifest...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight underline decoration-accent/30 underline-offset-8 uppercase">Client Base</h2>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Global list of your patrons and their engagement.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search patron ID or notes..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 pr-6 py-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-accent w-64 text-[10px] font-black uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)] p-8 transition-all hover:border-accent/40 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-20 h-20" />
             </div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center font-black text-xs text-accent shadow-inner uppercase">
                  {client.notes.slice(0, 2)}
                </div>
                <div>
                   <h3 className="font-black text-sm uppercase tracking-tight text-ink">{client.notes}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {client.id.slice(-8)}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/5 p-4 rounded-xl text-center">
                   <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Bookings</p>
                   <p className="text-xl font-black text-ink">{client.totalBookings}</p>
                </div>
                <div className="bg-black/5 p-4 rounded-xl text-center">
                   <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</p>
                   <p className="text-xs font-black text-green-500 uppercase tracking-widest">Active</p>
                </div>
             </div>

             <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-3 text-slate-500 hover:text-accent transition-colors cursor-pointer">
                   <Calendar className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Last Visit: {client.latestBooking}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 hover:text-accent transition-colors cursor-pointer">
                   <MessageSquare className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Send WhatsApp Reminder</span>
                </div>
             </div>

             <div className="mt-8">
                <button className="w-full py-4 rounded-xl bg-ink text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                  Full Customer File <ExternalLink className="w-3 h-3" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && !loading && (
        <div className="p-32 text-center bg-black/5 rounded-[3rem] border border-dashed border-slate-300">
           <Users className="w-16 h-16 text-slate-300 mx-auto mb-6 opacity-40" />
           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No matches found in the patron directory.</p>
        </div>
      )}
    </div>
  );
}
