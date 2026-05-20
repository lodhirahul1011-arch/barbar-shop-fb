import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { notifyCustomerStatusUpdate } from '../../services/notificationService';
import { Appointment, BookingStatus, PaymentStatus } from '../../types';
import { 
  Check, 
  X, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  User, 
  CreditCard 
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function OwnerAppointments() {
  const shopId = 'default-shop';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [referencedData, setReferencedData] = useState<any>({
    customers: {},
    services: {},
    barbers: {}
  });

  useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(apps);
      
      // Fetch missing data
      const newRefs = { ...referencedData };
      let changed = false;

      for (const app of apps) {
        if (!newRefs.services[app.serviceId]) {
          const sDoc = await getDocs(query(collection(db, 'shops', shopId, 'services')));
          sDoc.forEach(d => { newRefs.services[d.id] = d.data().name; });
          changed = true;
        }
        if (!newRefs.barbers[app.barberId] && app.barberId !== 'any') {
          const bDoc = await getDocs(query(collection(db, 'shops', shopId, 'barbers')));
          bDoc.forEach(d => { newRefs.barbers[d.id] = d.data().name; });
          changed = true;
        }
      }

      if (changed) setReferencedData(newRefs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      const appointment = appointments.find(app => app.id === id);
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: Date.now()
      });
      if (appointment) {
        void notifyCustomerStatusUpdate({
          appointment: { ...appointment, status, updatedAt: Date.now() },
          customer: {
            name: appointment.notes,
            email: appointment.customerEmail,
          },
          actorName: 'Owner',
        }, status).catch(err => {
          console.warn('Could not send customer status email.', err);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentUpdate = async (id: string, status: PaymentStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        paymentStatus: status,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApps = appointments.filter(a => filter === 'all' || a.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight underline decoration-accent/30 underline-offset-8">Appointments</h2>
          <p className="text-slate-500 mt-2">Approve, reject, and manage your bookings.</p>
        </div>
        <div className="flex bg-[var(--color-card)] p-1 rounded-2xl border border-[var(--color-border)] shadow-sm">
          {['pending', 'confirmed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--color-border)]">
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">Customer & Service</th>
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">Staff Assigned</th>
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">Date & Time</th>
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">Status</th>
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">Payment</th>
                <th className="p-6 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              <AnimatePresence>
                {filteredApps.map((app) => (
                  <motion.tr 
                    key={app.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-black text-xs uppercase">
                          {app.notes ? app.notes.slice(0, 2) : 'CL'}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">{referencedData.services[app.serviceId] || 'Service'}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Ref: {app.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                         <span className="text-xs font-black uppercase tracking-widest">{app.barberId === 'any' ? 'First Available' : (referencedData.barbers[app.barberId] || 'Barber')}</span>
                       </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink">{format(new Date(app.date), 'MMM dd, yyyy')}</span>
                        <span className="text-[10px] text-accent uppercase font-black tracking-[0.2em]">{app.time}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        app.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                        app.status === 'pending' ? 'bg-amber-500/10 text-accent' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-6">
                       <button 
                        onClick={() => handlePaymentUpdate(app.id, app.paymentStatus === 'paid' ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                        className={`flex items-center gap-2 text-[10px] font-black transition-colors uppercase tracking-widest ${
                        app.paymentStatus === 'paid' ? 'text-green-500' : 'text-slate-400 hover:text-accent'
                      }`}>
                         <div className={`w-2 h-2 rounded-full ${app.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-slate-300'}`} />
                         {app.paymentStatus === 'paid' ? 'PAID' : 'COLLECT'}
                       </button>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {app.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, BookingStatus.CONFIRMED)}
                              className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-all hover:scale-110 active:scale-95"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, BookingStatus.REJECTED)}
                              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-3 text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredApps.length === 0 && !loading && (
            <div className="p-20 text-center">
               <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-40">
                  <Calendar className="w-10 h-10 text-slate-400" />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                 No {filter !== 'all' ? filter : ''} appointments found.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
