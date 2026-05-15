import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Appointment, BarberService, BookingStatus } from '../../types';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  Bell, 
  User, 
  LayoutDashboard, 
  Plus,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const LOCAL_APPOINTMENTS_KEY = 'barberflow_local_appointments';

const getLocalAppointments = (customerId: string) => {
  try {
    return (JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || '[]') as Appointment[])
      .filter(app => app.customerId === customerId);
  } catch {
    return [];
  }
};

const mergeAppointments = (remoteAppointments: Appointment[], customerId: string) => {
  const byId = new Map<string, Appointment>();
  [...getLocalAppointments(customerId), ...remoteAppointments].forEach(app => byId.set(app.id, app));
  return Array.from(byId.values()).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
};

export default function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REJECTED];

  const statusTone = (status: BookingStatus) => {
    if (status === BookingStatus.CONFIRMED) return 'bg-green-500/10 text-green-500';
    if (status === BookingStatus.REJECTED) return 'bg-red-500/10 text-red-500';
    if (status === BookingStatus.CANCELLED) return 'bg-slate-500/10 text-slate-500';
    if (status === BookingStatus.COMPLETED) return 'bg-blue-500/10 text-blue-500';
    return 'bg-amber-500/10 text-accent';
  };

  const statusHint = (status: BookingStatus) => {
    if (status === BookingStatus.REJECTED) return 'Slot unavailable. Pick a new time and send it for review.';
    if (status === BookingStatus.PENDING) return 'Waiting for admin approval. You can still change this slot.';
    if (status === BookingStatus.CONFIRMED) return 'Approved by admin. Move time if your plan changed.';
    if (status === BookingStatus.COMPLETED) return 'Service completed.';
    return 'Booking closed.';
  };

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'appointments'),
      where('customerId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
      setAppointments(mergeAppointments(apps, profile.uid));
      setLoading(false);
    }, (err) => {
      console.warn('Could not load remote appointments. Showing local demo bookings.', err);
      setAppointments(getLocalAppointments(profile.uid));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const SidebarContent = () => (
    <>
      <div className="p-8 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-full">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">BARBERFLOW</span>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {[
          { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
          { label: 'Find Shop', icon: <Calendar className="w-5 h-5" />, path: '#', action: () => alert('Browse Shops Feature') },
          { label: 'Support', icon: <Bell className="w-5 h-5" />, path: '/support' },
        ].map((item) => (
          item.path === '#' ? (
            <button 
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              {item.icon} {item.label}
            </button>
          ) : (
            <Link 
              key={item.label}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${
                location.pathname === item.path ? 'bg-accent/20 text-accent border border-accent/20' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          )
        ))}
      </nav>

      <div className="p-8 mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white shrink-0">
            {profile?.displayName?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black truncate text-white uppercase tracking-tighter">{profile?.displayName || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate font-bold">{profile?.phoneNumber}</p>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors px-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--color-paper)] overflow-hidden font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-sidebar)] border-b border-[var(--color-border)] z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-accent" />
          <span className="font-display font-black text-xs tracking-tighter">BARBERFLOW</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[280px] bg-[#111111] flex-col border-r border-white/5 shrink-0">
        <SidebarContent />
      </aside>

       {/* Mobile Sidebar Overlay */}
       {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.nav 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="w-[80%] h-full bg-[#111111] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </motion.nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden mt-16 lg:mt-0">
        <header className="bg-[var(--color-sidebar)] border-b border-[var(--color-border)] p-4 lg:p-8 flex justify-between items-center sticky top-0 z-10 transition-colors">
          <div>
            <h1 className="text-3xl lg:text-5xl">MY<br />BOOKINGS</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 opacity-50">Active & History</p>
          </div>
          <Link to="/book/default-shop" className="bg-accent hover:bg-amber-600 text-white px-6 py-4 lg:px-8 lg:py-5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-accent/20 flex items-center gap-2 transition-all transform hover:scale-105">
            <Plus className="w-5 h-5" /> Reserve Slot
          </Link>
        </header>

        <div className="p-4 lg:p-8 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-8">
              {/* Upcoming Appointments */}
              <section className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 lg:p-10 space-y-8 transition-colors">
                <h2 className="text-2xl font-black tracking-tighter border-b-2 border-accent inline-block pb-2">UPCOMING</h2>
                <div className="space-y-4">
                  {appointments.filter(a => activeStatuses.includes(a.status)).length === 0 ? (
                    <div className="py-20 text-center bg-black/5 dark:bg-white/5 rounded-3xl border-2 border-dashed border-[var(--color-border)]">
                      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-6 opacity-50">No active sessions</p>
                      <Link to="/book/default-shop" className="text-accent font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-4">Book your next style</Link>
                    </div>
                  ) : (
                    appointments.filter(a => activeStatuses.includes(a.status)).map(app => (
                      <motion.div 
                        key={app.id} 
                        layoutId={app.id}
                        className="p-6 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-2xl hover:border-accent transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-[var(--color-card)] p-4 border border-[var(--color-border)] rounded-xl shadow-sm">
                            <Clock className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm uppercase tracking-tight">{app.serviceName || 'Grooming Session'}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{format(new Date(app.date), 'EEE, MMM dd')} @ {app.time}</p>
                            {app.changeRequested && (
                              <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-2">Change request sent</p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-2 max-w-sm leading-relaxed">{statusHint(app.status)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end gap-3 w-full lg:w-auto">
                          <span className={`badge-status w-fit ${statusTone(app.status)}`}>
                            {app.status}
                          </span>
                          <div className="flex flex-wrap gap-3">
                          {app.status === BookingStatus.CONFIRMED && (
                            <Link 
                              to={`/tracking/${app.id}`}
                              className="px-4 py-3 rounded-xl bg-green-500/10 text-[10px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/20 transition-colors"
                            >
                              Track Slot
                            </Link>
                          )}
                          {app.status !== BookingStatus.CONFIRMED && (
                            <Link 
                              to={`/reschedule/${app.id}`}
                              className="px-4 py-3 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-amber-600 transition-colors"
                            >
                              Change Slot
                            </Link>
                          )}
                          {app.status === BookingStatus.CONFIRMED && (
                            <Link 
                              to={`/reschedule/${app.id}`}
                              className="px-4 py-3 rounded-xl bg-accent/10 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-colors"
                            >
                              Move Time
                            </Link>
                          )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>

              {/* History Section */}
              <section className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 lg:p-10 space-y-8 transition-colors">
                <h2 className="text-2xl font-black tracking-tighter opacity-30">HISTORY</h2>
                <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                  {appointments.map((app) => (
                    <div key={app.id} className="py-6 flex items-center justify-between group">
                      <div>
                        <p className="font-black text-[10px] uppercase tracking-widest text-slate-600 group-hover:text-ink transition-colors">{app.serviceName || 'Barber Visit'}</p>
                        <p className="text-xs font-black uppercase tracking-tight mt-1">{format(new Date(app.date), 'MMM dd, yyyy')} @ {app.time}</p>
                        {app.status === BookingStatus.REJECTED && (
                          <Link
                            to={`/reschedule/${app.id}`}
                            className="inline-block mt-3 text-[10px] font-black uppercase tracking-widest text-accent hover:underline decoration-2 underline-offset-4"
                          >
                            Choose new slot
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-black uppercase tracking-widest text-[8px] px-2 py-1 rounded ${statusTone(app.status)}`}>{app.status}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                     <div className="py-12 text-center text-slate-500 font-black uppercase tracking-widest text-[10px] opacity-30">
                      Queue history empty
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
