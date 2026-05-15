import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  Appointment, 
  BarberService 
} from '../../types';
import { 
  ChevronLeft, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Scissors
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Tracking() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [service, setService] = useState<BarberService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) return;

    const unsubscribe = onSnapshot(doc(db, 'appointments', appointmentId), async (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Appointment;
        setAppointment(data);
        
        // Fetch service details
        const serviceSnap = await getDoc(doc(db, 'shops', data.shopId, 'services', data.serviceId));
        if (serviceSnap.exists()) {
          setService({ id: serviceSnap.id, ...serviceSnap.data() } as BarberService);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appointmentId]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest bg-paper text-ink">Verifying Token...</div>;
  if (!appointment) return <div className="h-screen flex items-center justify-center font-black uppercase text-red-500">SESSION NOT FOUND</div>;

  const steps = [
    { label: 'Booking Sent', active: true, done: true },
    { label: 'WhatsApp Confirmed', active: appointment.status === 'confirmed', done: appointment.status === 'confirmed' },
    { label: 'Shop Check-in', active: false, done: false },
    { label: 'Service Started', active: false, done: false }
  ];

  return (
    <div className="max-w-2xl mx-auto py-24 px-6 bg-[var(--color-paper)] min-h-screen font-sans transition-colors">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-ink" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center font-black text-white text-xs">B</div>
           <span className="text-xs font-black tracking-widest uppercase opacity-50">BarberFlow Engine</span>
        </div>
      </div>

      <div className="space-y-16">
        <div>
          <h1 className="text-4xl md:text-6xl font-black m-0 leading-tight uppercase tracking-tighter">SESSION<br /><span className="text-accent underline text-3xl md:text-5xl">#TRACKING</span></h1>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-6 opacity-60">Reference ID: {appointment.id?.slice(0, 8)}</p>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 md:p-10 space-y-12 transition-colors rounded-3xl shadow-xl shadow-black/5">
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[var(--color-border)] pb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{service?.name || 'Grooming Service'}</h2>
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">{format(new Date(appointment.date), 'MMM dd')} • {appointment.time}</p>
            </div>
            <div className={`badge-status ${appointment.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-accent'}`}>
              {appointment.status}
            </div>
          </div>

          <div className="space-y-8 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[var(--color-border)] -z-0"></div>
            
            {steps.map((step, i) => (
              <div key={i} className="flex gap-8 items-center relative z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  step.done ? 'bg-accent border-accent text-white' : 'bg-[var(--color-paper)] border-[var(--color-border)] text-slate-500'
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                </div>
                <div className={`transition-all ${step.done ? 'opacity-100' : 'opacity-30'}`}>
                  <p className="font-black uppercase tracking-widest text-xs">{step.label}</p>
                  {step.done && <p className="text-[10px] font-black text-slate-500 mt-1 uppercase">Operational</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl transition-colors">
            <Clock className="w-5 h-5 text-accent mb-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Duration</h3>
            <p className="font-black uppercase tracking-tight">{service?.duration || 30} MINS</p>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl transition-colors">
            <MapPin className="w-5 h-5 text-accent mb-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Queue Pos</h3>
            <p className="font-black uppercase tracking-tight">EST. #2</p>
          </div>
        </div>

        <div className="p-8 bg-ink text-[var(--color-paper)] rounded-3xl flex flex-col sm:flex-row justify-between items-center relative overflow-hidden gap-6">
           <div className="relative z-10 text-center sm:text-left">
             <h4 className="text-xl font-black uppercase mb-1 leading-none">NOTIFY<br />ON DELAY</h4>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">WhatsApp Auto-Alert Active</p>
           </div>
           <Scissors className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
           <button className="bg-accent text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] relative z-10 hover:bg-amber-600 transition-all shadow-lg shadow-accent/20">
             Toggle ON
           </button>
        </div>
      </div>
    </div>
  );
}
