import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { notifyAdminSlotChangeRequest } from '../../services/notificationService';
import { 
  Appointment, 
  ShopSettings, 
  BarberService,
  BookingStatus
} from '../../types';
import { isSlotAvailable } from '../../lib/booking';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';

const LOCAL_APPOINTMENTS_KEY = 'barberflow_local_appointments';

const saveLocalAppointment = (appointment: Appointment) => {
  const existing = JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || '[]') as Appointment[];
  localStorage.setItem(
    LOCAL_APPOINTMENTS_KEY,
    JSON.stringify([appointment, ...existing.filter(app => app.id !== appointment.id)].slice(0, 20))
  );
};

const syncServerAppointment = async (appointment: Appointment) => {
  try {
    await fetch('/api/local-appointments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(appointment),
    });
  } catch (err) {
    console.warn('Could not mirror change request to local server queue.', err);
  }
};

export default function ReschedulePage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [service, setService] = useState<BarberService | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [step, setStep] = useState(1);

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');

  const defaultSettings: ShopSettings = {
    workingHours: {
      mon: { open: '09:00', close: '18:00', isClosed: false },
      tue: { open: '09:00', close: '18:00', isClosed: false },
      wed: { open: '09:00', close: '18:00', isClosed: false },
      thu: { open: '09:00', close: '18:00', isClosed: false },
      fri: { open: '09:00', close: '18:00', isClosed: false },
      sat: { open: '10:00', close: '16:00', isClosed: false },
      sun: { open: '00:00', close: '00:00', isClosed: true },
    },
    slotDuration: 30,
    breakTimes: [{ start: '13:00', end: '14:00' }],
    blockedDates: []
  };

  useEffect(() => {
    async function fetchData() {
      if (!appointmentId) return;
      try {
        const appSnap = await getDoc(doc(db, 'appointments', appointmentId));
        if (appSnap.exists()) {
          const appData = { ...appSnap.data(), id: appSnap.id } as Appointment;
          setAppointment(appData);
          
          // Fetch Service
          const serviceSnap = await getDoc(doc(db, 'shops', appData.shopId, 'services', appData.serviceId));
          if (serviceSnap.exists()) {
            setService({ id: serviceSnap.id, ...serviceSnap.data() } as BarberService);
          } else {
            setService({
              id: appData.serviceId,
              name: appData.serviceName || 'Grooming Service',
              description: 'Requested service',
              duration: appData.serviceDuration || 30,
              price: 0,
            });
          }

          // Fetch Settings
          const shopSnap = await getDoc(doc(db, 'shops', appData.shopId));
          if (shopSnap.exists()) {
            setShopSettings(shopSnap.data().settings || defaultSettings);
          } else {
            setShopSettings(defaultSettings);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [appointmentId]);

  useEffect(() => {
    if (selectedDate && shopSettings && service) {
      generateSlots();
    }
  }, [selectedDate, shopSettings, service]);

  const generateSlots = async () => {
    if (!shopSettings || !service || !appointment) return;

    setSlotLoading(true);
    setSlotError('');
    setSelectedTime('');

    try {
      let apps: Appointment[] = [];
      try {
        const q = query(
          collection(db, 'appointments'),
          where('shopId', '==', appointment.shopId),
          where('date', '==', selectedDate)
        );
        const snap = await getDocs(q);
        apps = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as Appointment))
          .filter(a => a.id !== appointmentId);
      } catch (err) {
        console.warn('Could not load bookings for reschedule. Showing schedule-based slots.', err);
      }

      const slots: string[] = [];
      const dayName = format(new Date(selectedDate), 'EEE').toLowerCase();
      const daySettings = shopSettings.workingHours[dayName];
      const minNotice = shopSettings.minimumBookingNoticeMinutes || 60;
      const minAllowedTime = new Date(Date.now() + minNotice * 60000);

      if (daySettings && !daySettings.isClosed) {
        let current = new Date(`${selectedDate}T${daySettings.open}`);
        const end = new Date(`${selectedDate}T${daySettings.close}`);

        while (current < end) {
          const timeStr = format(current, 'HH:mm');
          if (current > minAllowedTime && isSlotAvailable(selectedDate, timeStr, service.duration, apps, shopSettings)) {
            slots.push(timeStr);
          }
          current = new Date(current.getTime() + shopSettings.slotDuration * 60000);
        }
      }

      setAvailableSlots(slots);
      if (slots.length === 0) setSlotError('No available slots for this date. Try another day.');
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
      setSlotError('Unable to load slots. Please try another date.');
    } finally {
      setSlotLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!appointmentId || !selectedDate || !selectedTime) return;
    setRescheduling(true);
    const previousDate = appointment?.date;
    const previousTime = appointment?.time;
    try {
      const changes = {
        date: selectedDate,
        time: selectedTime,
        status: BookingStatus.PENDING,
        changeRequested: true,
        changeRequestedAt: Date.now(),
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'appointments', appointmentId), changes);
      if (appointment) {
        const updatedAppointment = { ...appointment, ...changes };
        saveLocalAppointment(updatedAppointment);
        await syncServerAppointment(updatedAppointment);
        await Promise.allSettled([
          notifyAdminSlotChangeRequest({
            appointment: updatedAppointment,
            customer: {
              name: profile?.displayName,
              email: profile?.email,
            },
            previousDate,
            previousTime,
          }),
        ]);
        setAppointment(updatedAppointment);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      if (appointment) {
        const fallbackAppointment = {
          ...appointment,
          date: selectedDate,
          time: selectedTime,
          status: BookingStatus.PENDING,
          changeRequested: true,
          changeRequestedAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveLocalAppointment(fallbackAppointment);
        await syncServerAppointment(fallbackAppointment);
        await Promise.allSettled([
          notifyAdminSlotChangeRequest({
            appointment: fallbackAppointment,
            customer: {
              name: profile?.displayName,
              email: profile?.email,
            },
            previousDate,
            previousTime,
          }),
        ]);
        setAppointment(fallbackAppointment);
        setStep(2);
        return;
      }
      alert('Could not send change request. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest bg-paper text-ink">Verifying Schedule...</div>;
  if (!appointment) return <div className="h-screen flex items-center justify-center font-bold">Appointment not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-24 px-6 bg-paper min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-3 bg-white border border-ink/5 rounded-full hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-ink" />
              </button>
              <h1 className="text-4xl font-black m-0 leading-tight">RESCHEDULE<br /><span className="text-accent underline">BOOKING</span></h1>
            </div>

            <div className="p-8 bg-white border border-ink/5 rounded-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Selection</p>
               <div className="flex justify-between items-end">
                 <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">{service?.name || 'Grooming Service'}</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{appointment.date} @ {appointment.time}</p>
                   <p className="text-accent font-black uppercase tracking-widest text-[10px] mt-3">Current status: {appointment.status}</p>
                 </div>
                 <Calendar className="w-8 h-8 text-slate-200" />
               </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-xl font-black uppercase tracking-[0.1em] border-b-2 border-accent w-fit pb-2">Select New Date</h2>
              
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = addDays(new Date(), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex-shrink-0 w-24 py-6 border-2 transition-all ${
                        isSelected 
                          ? 'border-accent bg-accent text-white shadow-xl shadow-accent/20' 
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`text-[10px] uppercase font-black mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {format(date, 'EEE')}
                      </p>
                      <p className="text-2xl font-black">
                        {format(date, 'dd')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <h2 className="text-xl font-black uppercase tracking-[0.1em] border-b-2 border-accent w-fit pb-2 pt-6">Select New Time</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {slotLoading ? (
                  <div className="col-span-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200">
                    <Clock className="w-8 h-8 text-accent mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Checking slots</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  availableSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-4 font-black uppercase tracking-widest text-xs transition-all border-2 ${
                        selectedTime === time 
                          ? 'bg-ink text-white border-ink' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <div className="col-span-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{slotError || 'No slots available'}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedTime && (
              <div className="p-6 bg-accent/10 border border-accent/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Change request</p>
                <p className="font-black text-ink">
                  Move to {format(new Date(selectedDate), 'MMM dd, yyyy')} at {selectedTime}
                </p>
                <p className="text-xs text-slate-500 mt-2">After confirmation, this will go back to admin review as pending.</p>
              </div>
            )}

            {selectedTime && (
              <button
                disabled={rescheduling}
                onClick={handleReschedule}
                className="w-full bg-accent text-white py-6 rounded-md font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-4"
              >
                {rescheduling ? 'Syncing...' : 'Confirm Change'}
              </button>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 space-y-10"
          >
            <div className="w-32 h-32 bg-green-50 border-4 border-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h1 className="text-6xl font-black uppercase leading-tight mb-4">SLOT<br /><span className="text-green-500 underline">UPDATED</span></h1>
              <p className="text-slate-400 font-bold max-w-sm mx-auto uppercase tracking-widest text-xs leading-loose">
                Your change request has been moved to <span className="text-ink">{selectedDate}</span> at <span className="text-ink">{selectedTime}</span> and sent back to admin review.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-ink text-white px-16 py-6 rounded-md font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl"
            >
              Return Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
