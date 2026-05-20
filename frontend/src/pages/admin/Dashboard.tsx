import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  notifyCustomerSlotChanged,
  notifyCustomerStatusUpdate,
} from '../../services/notificationService';
import { Appointment, BookingStatus, ShopSettings, UserProfile } from '../../types';
import { isSlotAvailable } from '../../lib/booking';
import {
  BarChart3,
  CalendarClock,
  Check,
  Clock,
  ShieldAlert,
  Store,
  Users,
  X,
  RefreshCcw,
} from 'lucide-react';
import { format } from 'date-fns';

const LOCAL_APPOINTMENTS_KEY = 'barberflow_local_appointments';
const FIRESTORE_TIMEOUT_MS = 1500;
const SERVER_SYNC_TIMEOUT_MS = 1200;
const SERVER_REFRESH_INTERVAL_MS = 5000;

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

const getLocalAppointments = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || '[]') as Appointment[];
  } catch {
    return [];
  }
};

const saveLocalAppointments = (appointments: Appointment[]) => {
  localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(appointments));
};

const mergeAppointments = (remoteAppointments: Appointment[]) => {
  const byId = new Map<string, Appointment>();
  [...remoteAppointments, ...getLocalAppointments()].forEach(app => {
    const existing = byId.get(app.id);
    const existingTime = existing?.updatedAt || existing?.createdAt || 0;
    const nextTime = app.updatedAt || app.createdAt || 0;

    if (!existing || nextTime >= existingTime) {
      byId.set(app.id, app);
    }
  });
  return Array.from(byId.values()).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
};

const fetchServerAppointments = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERVER_SYNC_TIMEOUT_MS);

  try {
    const response = await fetch('/api/local-appointments', { signal: controller.signal });
    if (!response.ok) return [];
    return await response.json() as Appointment[];
  } catch (err) {
    console.warn('Could not load server appointment mirror.', err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
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
    console.warn('Could not update server appointment mirror.', err);
  } finally {
    clearTimeout(timeoutId);
  }
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => mergeAppointments([]));
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [editingSlot, setEditingSlot] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [editSlotLoading, setEditSlotLoading] = useState(false);
  const [editSlotError, setEditSlotError] = useState('');
  const [queueSource, setQueueSource] = useState({ remote: 0, local: 0, server: 0, error: '' });

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
    blockedDates: [],
  };

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(userDoc => userDoc.data() as UserProfile));
    }, (err) => {
      console.warn('Could not load user directory.', err);
      setUsers([]);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let latestRemoteAppointments: Appointment[] = [];
    let latestServerAppointments: Appointment[] = [];
    let serverRefreshInFlight = false;

    const refreshAppointments = () => {
      setAppointments(mergeAppointments([...latestRemoteAppointments, ...latestServerAppointments]));
      setQueueSource({
        remote: latestRemoteAppointments.length,
        local: getLocalAppointments().length,
        server: latestServerAppointments.length,
        error: localStorage.getItem('barberflow_last_booking_error') || '',
      });
      setLoadingAppointments(false);
    };

    const refreshServerAppointments = async () => {
      if (serverRefreshInFlight) return;
      serverRefreshInFlight = true;
      try {
        latestServerAppointments = await fetchServerAppointments();
        refreshAppointments();
      } finally {
        serverRefreshInFlight = false;
      }
    };

    const unsubscribe = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const remoteAppointments = snapshot.docs.map(appDoc => ({
        ...appDoc.data(),
        id: appDoc.id,
      } as Appointment));
      latestRemoteAppointments = remoteAppointments;
      refreshAppointments();
    }, (err) => {
      console.warn('Could not load remote appointments. Showing local demo queue.', err);
      latestRemoteAppointments = [];
      localStorage.setItem('barberflow_last_admin_error', err instanceof Error ? err.message : String(err));
      refreshAppointments();
    });

    refreshServerAppointments();
    const interval = window.setInterval(refreshServerAppointments, SERVER_REFRESH_INTERVAL_MS);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const updateLocalAppointment = (appointment: Appointment, changes: Partial<Appointment>) => {
    const existing = getLocalAppointments();
    const nextAppointment = { ...appointment, ...changes, updatedAt: Date.now() };
    const exists = existing.some(app => app.id === appointment.id);
    const updated = exists
      ? existing.map(app => app.id === appointment.id ? nextAppointment : app)
      : [nextAppointment, ...existing];

    saveLocalAppointments(updated);
    setAppointments(current => mergeAppointments([nextAppointment, ...current]));
    void syncServerAppointment(nextAppointment);
    return nextAppointment;
  };

  const updateLocalAppointmentStatus = (appointment: Appointment, status: BookingStatus) => {
    return updateLocalAppointment(appointment, { status, changeRequested: false });
  };

  const refreshQueueNow = async () => {
    const serverAppointments = await fetchServerAppointments();
    setAppointments(mergeAppointments(serverAppointments));
    setLoadingAppointments(false);
  };

  const handleStatusUpdate = async (appointment: Appointment, status: BookingStatus) => {
    setActionLoading(`${appointment.id}-${status}`);
    const nextAppointment = updateLocalAppointmentStatus(appointment, status);
    void notifyCustomerStatusUpdate({
      appointment: nextAppointment,
      customer: {
        name: nextAppointment.notes,
        email: nextAppointment.customerEmail,
      },
      actorName: 'Admin',
    }, status).catch(err => {
      console.warn('Could not send customer status email.', err);
    });
    setActionLoading('');

    if (appointment.id.startsWith('local-')) return;

    try {
      await withTimeout(updateDoc(doc(db, 'appointments', appointment.id), {
        status,
        changeRequested: false,
        updatedAt: nextAppointment.updatedAt,
      }), 'Updating appointment status');
    } catch (err) {
      console.warn('Could not update remote appointment. Local queue is already updated.', err);
    }
  };

  const startSlotEdit = (appointment: Appointment) => {
    setEditingSlot(appointment);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setEditSlots([]);
    setEditSlotError('');
  };

  const buildAvailableSlots = (
    appointment: Appointment,
    date: string,
    settings: ShopSettings,
    existingApps: Appointment[]
  ) => {
    const dayName = format(new Date(date), 'EEE').toLowerCase();
    const daySettings = settings.workingHours[dayName];
    const slots: string[] = [];

    if (!daySettings || daySettings.isClosed) return slots;

    let current = new Date(`${date}T${daySettings.open}`);
    const end = new Date(`${date}T${daySettings.close}`);
    const duration = appointment.serviceDuration || settings.slotDuration;

    while (current < end) {
      const timeStr = format(current, 'HH:mm');
      if (current > new Date() && isSlotAvailable(date, timeStr, duration, existingApps, settings)) {
        slots.push(timeStr);
      }
      current = new Date(current.getTime() + settings.slotDuration * 60000);
    }

    return slots;
  };

  useEffect(() => {
    if (!editingSlot || !editDate) return;

    let ignore = false;

    const loadSlots = async () => {
      setEditSlotLoading(true);
      setEditSlotError('');

      let settings = defaultSettings;
      let usedFallbackData = false;

      try {
        try {
          const shopSnap = await withTimeout(
            getDoc(doc(db, 'shops', editingSlot.shopId)),
            'Loading shop settings for slot edit'
          );
        if (shopSnap.exists()) {
          settings = shopSnap.data().settings || defaultSettings;
        }
        } catch (err) {
          usedFallbackData = true;
          console.warn('Could not load shop settings for slot edit. Using defaults.', err);
        }

        let existingApps = appointments
          .filter(app => app.shopId === editingSlot.shopId && app.date === editDate && app.id !== editingSlot.id);

        try {
          const snap = await withTimeout(getDocs(query(
            collection(db, 'appointments'),
            where('shopId', '==', editingSlot.shopId),
            where('date', '==', editDate)
          )), 'Loading appointments for slot edit');
          existingApps = snap.docs
            .map(appDoc => ({ id: appDoc.id, ...appDoc.data() } as Appointment))
            .filter(app => app.id !== editingSlot.id);
        } catch (err) {
          usedFallbackData = true;
          console.warn('Could not load remote appointments for slot edit. Using current queue data.', err);
        }

        const slots = buildAvailableSlots(editingSlot, editDate, settings, existingApps);

        if (!ignore) {
          setEditSlots(slots);
          if (!slots.includes(editTime) && slots.length > 0) {
            setEditTime(slots[0]);
          }
          setEditSlotError(usedFallbackData ? 'Using fallback availability. You can enter time manually.' : '');
        }
      } catch (err) {
        console.warn('Could not load alternate slots.', err);
        if (!ignore) {
          setEditSlots([]);
          setEditSlotError('Enter a time manually or try another date.');
        }
      } finally {
        if (!ignore) setEditSlotLoading(false);
      }
    };

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [editingSlot?.id, editDate]);

  const handleSlotChange = async () => {
    if (!editingSlot || !editDate || !editTime) return;

    setActionLoading(`${editingSlot.id}-slot`);
    const previousDate = editingSlot.date;
    const previousTime = editingSlot.time;
    const changes: Partial<Appointment> = {
      date: editDate,
      time: editTime,
      status: BookingStatus.PENDING,
      changeRequested: true,
      changeRequestedAt: Date.now(),
    };

    const nextAppointment = updateLocalAppointment(editingSlot, changes);
    void notifyCustomerSlotChanged({
      appointment: nextAppointment,
      customer: {
        name: nextAppointment.notes,
        email: nextAppointment.customerEmail,
      },
      actorName: 'Admin',
      previousDate,
      previousTime,
    }).catch(err => {
      console.warn('Could not send slot change email.', err);
    });
    setEditingSlot(null);
    setActionLoading('');

    if (editingSlot.id.startsWith('local-')) return;

    try {
      await withTimeout(updateDoc(doc(db, 'appointments', editingSlot.id), {
        ...changes,
        updatedAt: nextAppointment.updatedAt,
      }), 'Updating appointment slot');
    } catch (err) {
      console.warn('Could not change remote slot. Local queue is already updated.', err);
    }
  };

  const pendingAppointments = appointments.filter(app => app.status === BookingStatus.PENDING);
  const verifiedAppointments = appointments.filter(app => app.status !== BookingStatus.PENDING);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 text-slate-950 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">PLATFORM ADMIN</h1>
          <p className="text-slate-500 font-medium">Verify customer slot requests and monitor platform activity.</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Queue source: Firestore {queueSource.remote} / Local {queueSource.local} / Server {queueSource.server}
          </p>
          {queueSource.error && (
            <p className="mt-2 max-w-xl text-[10px] font-bold text-red-500">
              Last booking error: {queueSource.error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={refreshQueueNow}
          className="h-14 px-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent hover:border-accent/30 transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh Queue
        </button>
        <div className="flex flex-wrap bg-white rounded-3xl border border-slate-200 p-2 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-2 border-r border-slate-100">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
              <p className="font-black text-xl">{pendingAppointments.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-2">
            <Store className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bookings</p>
              <p className="font-black text-xl">{appointments.length}</p>
            </div>
          </div>
        </div>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Users', value: String(users.length), color: 'bg-blue-100 text-blue-700' },
          { label: 'Pending Requests', value: String(pendingAppointments.length), color: 'bg-amber-100 text-amber-700' },
          { label: 'Confirmed', value: String(appointments.filter(app => app.status === BookingStatus.CONFIRMED).length), color: 'bg-green-100 text-green-700' },
          { label: 'Rejected', value: String(appointments.filter(app => app.status === BookingStatus.REJECTED).length), color: 'bg-red-100 text-red-700' },
        ].map(item => (
          <div key={item.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
            <p className="text-3xl font-black tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_360px] gap-8">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3">
                <CalendarClock className="w-6 h-6 text-accent" />
                Booking Verification Queue
              </h2>
              <p className="text-sm text-slate-500 mt-1">Approve or reject requested slot bookings.</p>
            </div>
            {loadingAppointments && (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Slot</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-sm uppercase tracking-tight">{app.notes || 'Guest Client'}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">{app.customerId.slice(0, 18)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-sm">{app.serviceName || 'Grooming Service'}</p>
                      {app.changeRequested && (
                        <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-1">Change request</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{app.serviceDuration} min</p>
                    </td>
                    <td className="px-6 py-5">
                      {editingSlot?.id === app.id ? (
                        <div className="space-y-2 min-w-48">
                          <input
                            type="date"
                            value={editDate}
                            onChange={event => setEditDate(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"
                          />
                          <input
                            type="time"
                            list={`slot-options-${app.id}`}
                            value={editTime}
                            onChange={event => setEditTime(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"
                          />
                          <datalist id={`slot-options-${app.id}`}>
                            {editSlots.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </datalist>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {editSlotLoading ? 'Checking slots...' : editSlotError || `${editSlots.length} suggested slots`}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-accent" />
                          <div>
                            <p className="font-black text-sm">{format(new Date(app.date), 'MMM dd, yyyy')}</p>
                            <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">{app.time}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        app.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                        app.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        {editingSlot?.id === app.id ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading !== '' || !editTime}
                              onClick={handleSlotChange}
                              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                              title="Save slot change"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading !== ''}
                              onClick={() => setEditingSlot(null)}
                              className="px-3 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                              title="Cancel slot change"
                            >
                              Cancel
                            </button>
                          </>
                        ) : app.status === BookingStatus.PENDING ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading !== ''}
                              onClick={() => startSlotEdit(app)}
                              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                              title="Change slot"
                            >
                              Slot
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading !== ''}
                              onClick={() => handleStatusUpdate(app, BookingStatus.CONFIRMED)}
                              className="p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                              title="Confirm booking"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading !== ''}
                              onClick={() => handleStatusUpdate(app, BookingStatus.REJECTED)}
                              className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Reject booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoading !== ''}
                            onClick={() => startSlotEdit(app)}
                            className="px-3 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                            title="Change slot"
                          >
                            Change Slot
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loadingAppointments && appointments.length === 0 && (
            <div className="p-16 text-center">
              <CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No booking requests yet.</p>
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <section className="bg-black text-white rounded-3xl p-8 overflow-hidden relative shadow-2xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-accent" />
              Verification Flow
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 1</p>
                <p className="font-black mt-1 text-white">Review pending booking request.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 2</p>
                <p className="font-black mt-1 text-white">Confirm valid slots or reject conflicts.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-accent" />
              Recent Users
            </h3>
            <div className="space-y-4">
              {users.slice(0, 5).map(user => (
                <div key={user.uid} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-black">{user.displayName || user.phoneNumber}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.role}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{format(new Date(user.createdAt), 'MMM dd')}</span>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">User directory unavailable.</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black mb-5">Verified History</h3>
            <div className="space-y-3">
              {verifiedAppointments.slice(0, 5).map(app => (
                <div key={app.id} className="flex justify-between gap-4 text-sm">
                  <span className="font-bold truncate">{app.serviceName || 'Booking'}</span>
                  <span className={`font-black text-[10px] uppercase ${
                    app.status === BookingStatus.CONFIRMED ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
              {verifiedAppointments.length === 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No verified bookings yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
