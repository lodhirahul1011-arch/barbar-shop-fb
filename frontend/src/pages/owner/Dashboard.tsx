import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Scissors, 
  Calendar, 
  Settings, 
  List, 
  MessageSquare, 
  Bell, 
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Users,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Appointment } from '../../types';
import { motion } from 'motion/react';
import OwnerAppointments from './OwnerAppointments';
import OwnerServices from './OwnerServices';
import OwnerSettings from './OwnerSettings';
import OwnerBarbers from './OwnerBarbers';
import OwnerClients from './OwnerClients';

export default function OwnerDashboard() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ todayCount: 0, revenue: 0 });

  const shopId = 'default-shop';

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'appointments'),
      where('shopId', '==', shopId),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map(doc => doc.data() as Appointment);
      const paidApps = apps.filter(a => a.paymentStatus === 'paid');
      
      // Calculate revenue
      // We need prices for services
      const servicesSnap = await getDocs(collection(db, 'shops', shopId, 'services'));
      const servicePrices: Record<string, number> = {};
      servicesSnap.forEach(d => { servicePrices[d.id] = d.data().price; });

      const totalRevenue = paidApps.reduce((acc, app) => acc + (servicePrices[app.serviceId] || 0), 0);
      
      setStats({
        todayCount: apps.length,
        revenue: totalRevenue
      });
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', path: '/owner' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Appointments', path: '/owner/appointments' },
    { icon: <List className="w-5 h-5" />, label: 'Services', path: '/owner/services' },
    { icon: <User className="w-5 h-5" />, label: 'Barbers', path: '/owner/barbers' },
    { icon: <Users className="w-5 h-5" />, label: 'Clients', path: '/owner/clients' },
    { icon: <Settings className="w-5 h-5" />, label: 'Shop Settings', path: '/owner/settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-8 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-full shadow-lg shadow-accent/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-[var(--color-ink)]">BARBERFLOW</span>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[var(--color-border)] group"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-slate-500 group-hover:text-accent transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
          )}
        </button>
      </div>

      <div className="flex-1 px-6 space-y-2">
         {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-4 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              location.pathname === item.path 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'text-slate-500 hover:text-[var(--color-ink)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-8 mt-auto">
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl mb-6 border border-[var(--color-border)]">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-black">Active Shop</div>
          <div className="font-black text-[var(--color-ink)] truncate text-sm uppercase tracking-tight">The Razor's Edge</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Downtown LA Branch</div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-500/5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
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

      {/* Side Navigation - Desktop Sidebar */}
      <nav className="hidden lg:flex w-[320px] bg-[var(--color-sidebar)] flex-col border-r border-[var(--color-border)] shrink-0 transition-colors">
        <SidebarContent />
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.nav 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="w-[85%] max-w-[320px] h-full bg-[var(--color-sidebar)] flex flex-col transition-colors shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </motion.nav>
        </div>
      )}

      {/* Main Panel - Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden mt-16 lg:mt-0">
        {/* Header - Desktop Only title header */}
        <header className="hidden lg:flex bg-[var(--color-sidebar)] border-b border-[var(--color-border)] p-8 justify-between items-start sticky top-0 z-10 transition-colors">
           <div className="h-16 flex items-center">
             <Routes>
              <Route path="/" element={<h1 className="text-4xl">LIVE<br/>QUEUE</h1>} />
              <Route path="/appointments" element={<h1 className="text-4xl">BOOKING<br/>LOGS</h1>} />
              <Route path="/services" element={<h1 className="text-4xl">SERVICE<br/>DECK</h1>} />
              <Route path="/barbers" element={<h1 className="text-4xl">STAFF<br/>ROSTER</h1>} />
              <Route path="/clients" element={<h1 className="text-4xl">CLIENT<br/>BASE</h1>} />
              <Route path="/settings" element={<h1 className="text-4xl">SHOP<br/>CONFIG</h1>} />
            </Routes>
           </div>
          
          <div className="flex gap-4">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-sm text-center min-w-[140px] shadow-sm transition-colors">
               <div className="text-[10px] uppercase text-muted font-black mb-1 tracking-widest">Today</div>
               <div className="text-3xl font-black text-[var(--color-ink)]">{stats.todayCount}</div>
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-sm text-center min-w-[140px] shadow-sm transition-colors">
               <div className="text-[10px] uppercase text-muted font-black mb-1 tracking-widest">Revenue</div>
               <div className="text-3xl font-black text-accent">${stats.revenue}</div>
            </div>
          </div>
        </header>

        {/* Mobile Stat Bar */}
        <div className="lg:hidden flex gap-2 px-6 py-4 bg-[var(--color-sidebar)] border-b border-[var(--color-border)] transition-colors">
           <div className="flex-1 bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] text-center">
              <div className="text-[8px] font-black uppercase text-muted tracking-widest">Today</div>
              <div className="text-xl font-black text-[var(--color-ink)]">{stats.todayCount}</div>
           </div>
           <div className="flex-1 bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] text-center">
              <div className="text-[8px] font-black uppercase text-muted tracking-widest">Revenue</div>
              <div className="text-xl font-black text-accent">${stats.revenue}</div>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<OwnerOverview />} />
            <Route path="/appointments" element={<OwnerAppointments />} />
            <Route path="/services" element={<OwnerServices />} />
            <Route path="/barbers" element={<OwnerBarbers />} />
            <Route path="/clients" element={<OwnerClients />} />
            <Route path="/settings" element={<OwnerSettings />} />
          </Routes>
        </div>
      </main>

      {/* Right Panel - Hidden on small screens */}
      <aside className="hidden xl:flex w-[320px] bg-[var(--color-sidebar)] border-l border-[var(--color-border)] p-8 flex-col shrink-0 transition-colors">
        <div className="flex-1">
          <h2 className="mb-10 text-2xl font-black tracking-tight">Availability</h2>
          
          <div className="space-y-12">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-widest">
                <span>Capacity Today</span>
                <span className="text-accent">84%</span>
              </div>
              <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: '84%' }}></div>
              </div>
            </div>

            <div className="pt-10 border-t border-[var(--color-border)]">
               <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-6">System Logs</div>
               <div className="space-y-6">
                 {[
                   { type: 'template', msg: 'booking_confirm_v2 ready.' },
                   { type: 'wa', msg: 'Auto-Suggest: Sent 11:30 slot to +1 (555) 0928.' }
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4">
                     <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${log.type === 'wa' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                       <MessageSquare className="w-4 h-4" />
                     </div>
                     <p className="text-[10px] leading-relaxed font-bold uppercase tracking-tight text-muted"><strong>{log.type === 'wa' ? 'Notice:' : 'System:'}</strong> {log.msg}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-[var(--color-border)]">
          <button className="w-full bg-accent text-white font-black py-4 rounded-lg uppercase tracking-widest hover:bg-amber-600 transition-all text-[10px] shadow-xl shadow-accent/20">
            Manual Booking
          </button>
          <p className="text-[8px] text-center mt-6 text-slate-500 font-black uppercase tracking-widest leading-relaxed opacity-50">
            Admin Engine v1.0.4<br />Stable Production
          </p>
        </div>
      </aside>
    </div>
  );
}

function OwnerOverview() {
  const [todayApps, setTodayApps] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const shopId = 'default-shop';

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'appointments'),
      where('shopId', '==', shopId),
      where('date', '==', today),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setTodayApps(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex gap-8 overflow-x-auto no-scrollbar text-[10px] font-black uppercase tracking-widest border-b border-[var(--color-border)] pb-0">
        <button className="border-b-2 border-accent pb-4 text-[var(--color-ink)] whitespace-nowrap">Today's Schedule</button>
        <button className="text-muted pb-4 whitespace-nowrap hover:text-accent transition-colors">Waitlist</button>
        <button className="text-muted pb-4 whitespace-nowrap hover:text-accent transition-colors">History</button>
      </div>

      <div className="space-y-0 divide-y divide-[var(--color-border)]">
        {loading ? (
          <div className="py-20 text-center font-black uppercase tracking-widest text-[10px] text-muted">Synchronizing pipeline...</div>
        ) : todayApps.map((app, i) => (
          <div key={app.id} className={`flex flex-col md:grid md:grid-cols-[100px_1fr_120px_100px] items-start md:items-center py-8 gap-4 group hover:bg-black-[0.02] dark:hover:bg-white/[0.02] transition-all px-4 -mx-4 rounded-xl`}>
             <div className="font-black text-3xl group-hover:text-accent transition-colors tracking-tighter text-[var(--color-ink)]">{app.time}</div>
             <div>
                <div className="font-black text-sm uppercase tracking-tight text-[var(--color-ink)]">{app.notes || 'Guest Client'}</div>
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Ref: {app.id.slice(-6)}</div>
             </div>
             <div className="flex flex-col gap-1">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest w-fit ${app.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-accent'}`}>
                  {app.status}
                </span>
                {app.paymentStatus === 'paid' && <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest ml-1">Processed</span>}
             </div>
             <div className="md:text-right w-full">
                <Link 
                  to="/owner/appointments" 
                  className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent transition-colors flex items-center justify-end gap-2"
                >
                  Details <Scissors className="w-3 h-3" />
                </Link>
             </div>
          </div>
        ))}
        {!loading && todayApps.length === 0 && (
          <div className="py-32 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No appointments scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
