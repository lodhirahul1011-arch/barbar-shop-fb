import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  BarberService, 
  ShopSettings, 
  Appointment, 
  BookingStatus, 
  PaymentStatus 
} from '../../types';
import { isSlotAvailable } from '../../lib/booking';
import { 
  Scissors, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, parse } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

const fallbackServices: BarberService[] = [
  { id: '1', name: 'Master Haircut', duration: 30, price: 35, description: 'Surgical precision cut with premium styling' },
  { id: '2', name: 'Signature Shave', duration: 40, price: 25, description: 'Traditional straight razor shave with hot towel' },
  { id: '3', name: 'Deep Cleanse Facial', duration: 45, price: 40, description: 'Full oxygen treatment and exfoliation' },
];

const fallbackBarbers = [
  { id: '1', name: 'Antonio Vaccaro', specialty: 'Master Barber', active: true, image: 'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=300&q=80' },
  { id: '2', name: 'Luca Moretti', specialty: 'Beard Architect', active: true, image: 'https://images.unsplash.com/photo-1521446704128-444439775330?auto=format&fit=crop&w=300&q=80' },
  { id: '3', name: 'Matteo Gallo', specialty: 'Fade Specialist', active: true, image: 'https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&w=300&q=80' },
];

const LOCAL_APPOINTMENTS_KEY = 'barberflow_local_appointments';
const FIRESTORE_TIMEOUT_MS = 5000;
const SERVER_SYNC_TIMEOUT_MS = 3000;

const withTimeout = async <T,>(promise: Promise<T>, label: string, ms = FIRESTORE_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

const isPermissionError = (err: unknown) => {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
  const message = err instanceof Error ? err.message : String(err || '');
  return code === 'permission-denied' || message.toLowerCase().includes('insufficient permissions');
};

const saveLocalAppointment = (appointment: Appointment) => {
  const existing = JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || '[]') as Appointment[];
  localStorage.setItem(
    LOCAL_APPOINTMENTS_KEY,
    JSON.stringify([appointment, ...existing.filter(app => app.id !== appointment.id)].slice(0, 20))
  );
};

const syncServerAppointment = async (appointment: Appointment) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERVER_SYNC_TIMEOUT_MS);

  try {
    await fetch('/api/local-appointments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(appointment),
      signal: controller.signal,
    });
  } catch (err) {
    console.warn('Could not mirror booking to local server queue.', err);
  } finally {
    clearTimeout(timeoutId);
  }
};

export default function BookingFlow() {
  const { shopId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<BarberService[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<BarberService | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');
  const slotRequestId = useRef(0);
  
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [useWhatsApp, setUseWhatsApp] = useState(false);
  const selectedSlotIsAvailable = selectedTime !== '' && availableSlots.includes(selectedTime);

  const getDateSettings = (date: string) => {
    if (!shopSettings) return null;
    const dayName = format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE').toLowerCase();
    return shopSettings.workingHours[dayName];
  };

  const isDateBookable = (date: string) => {
    const dateSettings = getDateSettings(date);
    return Boolean(
      dateSettings &&
      !dateSettings.isClosed &&
      !shopSettings?.blockedDates?.includes(date)
    );
  };

  const getNextBookableDate = () => {
    for (let i = 0; i < 14; i++) {
      const dateStr = format(addDays(new Date(), i), 'yyyy-MM-dd');
      if (isDateBookable(dateStr)) return dateStr;
    }
    return '';
  };

  const getWhatsAppLink = () => {
    if (!selectedService || !selectedTime || !selectedDate) return '';
    const name = profile?.displayName || 'Gentleman';
    const barberName = selectedBarber?.name || 'a master barber';
    const message = `Hello! I would like to book a ${selectedService.name} with ${barberName} on ${selectedDate} at ${selectedTime}. My name is ${name}. Please confirm my slot.`;
    const encodedMessage = encodeURIComponent(message);
    // In a real app, this would be the shop's phone number from Firestore
    const phone = '15550928831'; 
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  // Default fallback settings
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
      try {
        // Fetch Services
        const servicesSnap = await withTimeout(
          getDocs(collection(db, 'shops', shopId || 'default-shop', 'services')),
          'Loading services'
        );
        const servicesList = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BarberService));
        
        if (servicesList.length === 0) {
          // Add dummy services if none exist for demo
          setServices(fallbackServices);
        } else {
          setServices(servicesList);
        }

        // Fetch Barbers
        const barbersSnap = await withTimeout(
          getDocs(collection(db, 'shops', shopId || 'default-shop', 'barbers')),
          'Loading barbers'
        );
        const barbersList = barbersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((b: any) => b.active !== false); // Default to true if active field is missing

        if (barbersList.length === 0) {
          setBarbers(fallbackBarbers.filter(b => b.active));
        } else {
          setBarbers(barbersList);
        }

        // Fetch Settings
        const shopSnap = await withTimeout(
          getDoc(doc(db, 'shops', shopId || 'default-shop')),
          'Loading shop settings'
        );
        if (shopSnap.exists()) {
          setShopSettings(shopSnap.data().settings || defaultSettings);
        } else {
          setShopSettings(defaultSettings);
        }
      } catch (err) {
        console.error(err);
        setServices(fallbackServices);
        setBarbers(fallbackBarbers.filter(b => b.active));
        setShopSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [shopId]);

  useEffect(() => {
    if (!shopSettings || isDateBookable(selectedDate)) return;

    setSelectedTime('');
    setAvailableSlots([]);
    const nextBookableDate = getNextBookableDate();
    if (nextBookableDate && nextBookableDate !== selectedDate) {
      setSelectedDate(nextBookableDate);
    }
  }, [selectedDate, shopSettings]);

  useEffect(() => {
    if (selectedDate && shopSettings && selectedService && isDateBookable(selectedDate)) {
      generateSlots();
    }
  }, [selectedDate, shopSettings, selectedService]);

  const generateSlots = async () => {
    const requestId = ++slotRequestId.current;

    if (!shopSettings || !selectedService) {
      setAvailableSlots([]);
      setSelectedTime('');
      return;
    }

    setSlotLoading(true);
    setSlotError('');
    setSelectedTime('');

    try {
      let apps: Appointment[] = [];
      try {
        // Fetch existing appointments for the day.
        const q = query(
          collection(db, 'appointments'),
          where('shopId', '==', shopId || 'default-shop'),
          where('date', '==', selectedDate)
        );
        const snap = await withTimeout(getDocs(q), 'Loading existing appointments');
        apps = snap.docs.map(d => d.data() as Appointment);
      } catch (err) {
        console.warn('Could not load existing appointments. Showing schedule-based slots.', err);
      }
      
      const slots: string[] = [];
      const dayName = format(new Date(selectedDate), 'EEE').toLowerCase();
      const daySettings = shopSettings.workingHours[dayName];
      
      if (daySettings && !daySettings.isClosed) {
        let current = new Date(`${selectedDate}T${daySettings.open}`);
        const end = new Date(`${selectedDate}T${daySettings.close}`);
        const now = new Date();
        
        // Respect minimum booking notice
        const minNotice = shopSettings.minimumBookingNoticeMinutes || 60;
        const minAllowedTime = new Date(now.getTime() + minNotice * 60000);

        while (current < end) {
          const timeStr = format(current, 'HH:mm');
          
          // Final condition: slot must be in the future AND respect minimum notice
          if (current > minAllowedTime && isSlotAvailable(selectedDate, timeStr, selectedService.duration, apps, shopSettings)) {
            slots.push(timeStr);
          }
          current = new Date(current.getTime() + shopSettings.slotDuration * 60000);
        }
      }

      if (slotRequestId.current === requestId) {
        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error(err);
      if (slotRequestId.current === requestId) {
        setAvailableSlots([]);
        setSlotError('Unable to build slots for this date. Please try another day.');
      }
    } finally {
      if (slotRequestId.current === requestId) {
        setSlotLoading(false);
      }
    }
  };

  const createBookingRequest = async () => {
    if (!profile || !selectedService || !selectedTime || !selectedDate || !shopSettings) return;
    if (!selectedSlotIsAvailable) {
      alert('Please choose an available slot before booking.');
      return;
    }

    const selectedStart = new Date(`${selectedDate}T${selectedTime}`);
    const minNotice = shopSettings.minimumBookingNoticeMinutes || 60;
    const minAllowedTime = new Date(Date.now() + minNotice * 60000);

    if (selectedStart <= minAllowedTime) {
      throw new Error('This slot is no longer available. Please choose another one.');
    }

    const buildAppointment = (appointmentId: string): Appointment => ({
        id: appointmentId,
        shopId: shopId || 'default-shop',
        customerId: profile.uid,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.duration,
        barberId: selectedBarber?.id || 'any',
        date: selectedDate,
        time: selectedTime,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        notes: profile.displayName || 'Guest Client'
    });

    const appRef = doc(collection(db, 'appointments'));
    const newAppointment = buildAppointment(appRef.id);

    try {
      let apps: Appointment[] = [];
      try {
        const q = query(
          collection(db, 'appointments'),
          where('shopId', '==', shopId || 'default-shop'),
          where('date', '==', selectedDate)
        );
        const snap = await withTimeout(getDocs(q), 'Re-checking existing appointments');
        apps = snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
      } catch (err) {
        console.warn('Could not re-check existing appointments before booking.', err);
      }

      if (!isSlotAvailable(selectedDate, selectedTime, selectedService.duration, apps, shopSettings)) {
        throw new Error('This slot has just been taken. Please choose another one.');
      }

      saveLocalAppointment(newAppointment);
      await syncServerAppointment(newAppointment);
      await withTimeout(setDoc(appRef, newAppointment), 'Saving booking request');
    } catch (err) {
      if (isPermissionError(err) || (err instanceof Error && err.message.includes('timed out'))) {
        saveLocalAppointment(newAppointment);
        await syncServerAppointment(newAppointment);
        return true;
      }

      localStorage.setItem('barberflow_last_booking_error', err instanceof Error ? err.message : String(err));
      throw err;
    }

    return true;
  };

  const handleBooking = async () => {
    setBookingLoading(true);

    try {
      const created = await createBookingRequest();
      if (created) setStep(5);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWhatsAppBooking = async () => {
    const whatsappLink = getWhatsAppLink();
    setBookingLoading(true);

    try {
      const created = await createBookingRequest();
      if (!created) return;

      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      setStep(5);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Initializing Booking Engine...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-4 mb-12">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-orange-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter">SELECT <span className="text-accent underline">SERVICE</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Step 01 / Choose your transformation</p>
            </div>
            <div className="grid gap-6">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep(2); }}
                  className={`w-full overflow-hidden border-2 rounded-3xl transition-all text-left ${
                    selectedService?.id === s.id ? 'border-accent bg-accent/5' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-accent/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    {s.image && (
                      <div className="md:w-32 h-32 md:h-auto shrink-0 overflow-hidden">
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-black uppercase tracking-tighter">{s.name}</h3>
                          <span className="text-xl font-display font-black text-accent">${s.price}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">{s.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="w-4 h-4" /> {s.duration} MINS
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep(1)} className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">CHOOSE <span className="text-accent underline">BARBER</span></h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Step 02 / Select your preferred artisan</p>
              </div>
            </div>

            <div className="grid gap-6">
              {barbers.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBarber(b); setStep(3); }}
                  className={`w-full overflow-hidden border-2 rounded-3xl transition-all text-left ${
                    selectedBarber?.id === b.id ? 'border-accent bg-accent/5' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center p-4 gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-700">
                      <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black uppercase tracking-tighter">{b.name}</h3>
                      <p className="text-accent font-black uppercase tracking-widest text-[10px] mt-1">{b.specialty}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-300" />
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setSelectedBarber({ id: 'any', name: 'Anyone Available' }); setStep(3); }}
                className="w-full p-6 border-2 border-dashed border-[var(--color-border)] rounded-3xl text-slate-500 font-black uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition-all"
              >
                Anyone Available
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep(2)} className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">SCHEDULE <span className="text-accent underline">SESSION</span></h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Step 03 / Pick your preferred timing</p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                const isClosed = shopSettings ? !isDateBookable(dateStr) : false;

                return (
                  <button
                    key={dateStr}
                    disabled={isClosed}
                    onClick={() => {
                      if (isClosed) return;
                      setSelectedDate(dateStr);
                      setSelectedTime('');
                    }}
                    className={`flex-shrink-0 w-20 py-4 border-2 rounded-2xl transition-all ${
                      isSelected ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30' : isClosed ? 'border-[var(--color-border)] bg-[var(--color-card)] opacity-40 cursor-not-allowed' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-gray-300'
                    }`}
                    title={isClosed ? 'Shop closed on this date' : 'Select date'}
                  >
                    <p className={`text-[10px] uppercase font-black mb-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      {format(date, 'EEE')}
                    </p>
                    <p className="text-xl font-black tracking-tighter">
                      {format(date, 'dd')}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Selector */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {slotLoading ? (
                <div className="col-span-3 p-10 text-center bg-white/5 rounded-3xl border-2 border-dashed border-[var(--color-border)]">
                  <Clock className="w-10 h-10 text-accent mx-auto mb-4 opacity-60 animate-pulse" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Checking live slots...</p>
                </div>
              ) : slotError ? (
                <div className="col-span-3 p-10 text-center bg-red-500/5 rounded-3xl border-2 border-dashed border-red-500/20">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4 opacity-60" />
                  <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">{slotError}</p>
                </div>
              ) : availableSlots.length > 0 ? (
                availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-2 ${
                      selectedTime === time ? 'bg-ink text-white border-ink' : 'bg-[var(--color-card)] text-slate-500 border-[var(--color-border)] hover:border-accent/40'
                    }`}
                  >
                    {time}
                  </button>
                ))
              ) : (
                <div className="col-span-3 p-10 text-center bg-white/5 rounded-3xl border-2 border-dashed border-[var(--color-border)]">
                  <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No slots available for this day.</p>
                </div>
              )}
            </div>

            {selectedSlotIsAvailable && (
              <button
                onClick={() => setStep(4)}
                className="w-full mt-12 bg-accent text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-accent/20 flex items-center justify-center gap-2 hover:bg-amber-600 transition-all hover:-translate-y-1"
              >
                Review Booking <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep(3)} className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full hover:bg-black/5 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">FINAL <span className="text-accent underline">SUMMARY</span></h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Step 04 / Verify your booking info</p>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setUseWhatsApp(false)}
                className={`flex-1 py-4 font-black uppercase text-[10px] tracking-widest border-2 transition-all rounded-2xl ${!useWhatsApp ? 'bg-ink text-[var(--color-paper)] border-ink' : 'bg-[var(--color-card)] text-slate-500 border-[var(--color-border)] hover:border-slate-300'}`}
              >
                Digital Request
              </button>
              <button 
                onClick={() => setUseWhatsApp(true)}
                className={`flex-1 py-4 font-black uppercase text-[10px] tracking-widest border-2 transition-all rounded-2xl ${useWhatsApp ? 'bg-[#25D366] text-white border-[#25D366]' : 'bg-[var(--color-card)] text-slate-500 border-[var(--color-border)] hover:border-slate-300'}`}
              >
                WhatsApp Direct
              </button>
            </div>

            <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-8 md:p-10 shadow-2xl shadow-black/5 space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 font-black text-[8px] uppercase tracking-[0.3em] text-slate-500 opacity-20">Booking Ticket #BF-{(Math.random() * 1000).toFixed(0)}</div>
               
               {useWhatsApp ? (
                 <div className="text-center space-y-8 py-4">
                    <div className="flex justify-center">
                      <div className="p-6 bg-white border-4 border-[#25D366]/10 rounded-3xl shadow-2xl">
                        <QRCodeCanvas 
                          value={getWhatsAppLink()} 
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">SCAN TO <span className="text-[#25D366]">SCHEDULE</span></h3>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-4 px-8 leading-loose">
                        Scan with your phone or tap the button below to initiate high-speed booking via WhatsApp.
                      </p>
                    </div>
                 </div>
               ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-6">
                      {selectedBarber?.image && selectedBarber.id !== 'any' && (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-700 shadow-xl border-2 border-white/10">
                          <img src={selectedBarber.image} alt={selectedBarber.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">Professional & Service</p>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">{selectedService?.name}</h3>
                        <p className="text-accent font-black text-[10px] uppercase tracking-[0.3em] mt-2">Specialist: {selectedBarber?.name}</p>
                      </div>
                    </div>
                    <Scissors className="w-10 h-10 text-accent opacity-20" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y border-[var(--color-border)]">
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Date & Day</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <span className="font-black text-lg text-ink block">{format(new Date(selectedDate), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{format(new Date(selectedDate), 'EEEE')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Arrival Time</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <span className="font-black text-lg text-ink block">{selectedTime}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmed Slot</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-ink p-8 rounded-3xl">
                    <div className="space-y-1">
                      <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">Service total</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Payment at shop</p>
                    </div>
                    <p className="text-4xl font-display font-black text-white">${selectedService?.price}.00</p>
                  </div>
                </>
               )}
            </div>

            {!selectedSlotIsAvailable && (
              <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black uppercase tracking-widest text-[10px] text-center">
                Please go back and choose an available slot to continue.
              </div>
            )}

            {useWhatsApp ? (
              selectedSlotIsAvailable ? (
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={handleWhatsAppBooking}
                  className="w-full mt-10 bg-[#25D366] text-white py-6 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-[#25D366]/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                >
                  <MessageCircle className="w-6 h-6" /> {bookingLoading ? 'Creating Request...' : 'Open WhatsApp'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full mt-10 bg-[#25D366] text-white py-6 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-[#25D366]/20 flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
                >
                  <MessageCircle className="w-6 h-6" /> Open WhatsApp
                </button>
              )
            ) : (
              <button
                 disabled={bookingLoading || !selectedSlotIsAvailable}
                 onClick={handleBooking}
                 className="w-full mt-10 bg-accent text-white py-6 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-accent/40 transform active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 hover:-translate-y-1"
              >
                {bookingLoading ? 'Processing Booking...' : selectedSlotIsAvailable ? 'Confirm Booking' : 'Choose Available Slot'}
              </button>
            )}
            <p className="text-center mt-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">By clicking confirm, we will notify the master barber immediately.</p>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-black mb-4">Request Sent!</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-sm mx-auto">
              Your booking request is being reviewed by the shop. You'll receive a confirmation on WhatsApp shortly.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-black text-white px-12 py-5 rounded-full font-bold hover:bg-gray-900 transition-colors shadow-xl"
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
