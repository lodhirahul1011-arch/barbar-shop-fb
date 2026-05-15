import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Trash2, Scissors, Star, Phone, Mail, ToggleLeft, ToggleRight, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface Staff {
  id: string;
  name: string;
  specialty: string;
  exp: string;
  image: string;
  active: boolean;
}

export default function OwnerBarbers() {
  const shopId = 'default-shop'; // Using default for demo, in real app this comes from shop owner's profile
  const [barbers, setBarbers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Staff | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newBarber, setNewBarber] = useState({ name: '', specialty: '', exp: '', image: '' });

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const snap = await getDocs(collection(db, 'shops', shopId, 'barbers'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      
      if (list.length === 0) {
        // Initial seed data if collection is empty
        const initial = [
          { name: 'Antonio Vaccaro', specialty: 'Master Barber', exp: '12 Yrs', active: true, image: 'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=300&q=80' },
          { name: 'Luca Moretti', specialty: 'Beard Architect', exp: '8 Yrs', active: true, image: 'https://images.unsplash.com/photo-1521446704128-444439775330?auto=format&fit=crop&w=300&q=80' },
        ];
        
        for (const b of initial) {
          await addDoc(collection(db, 'shops', shopId, 'barbers'), b);
        }
        fetchBarbers();
        return;
      }
      
      setBarbers(list);
    } catch (err) {
      console.error('Error fetching barbers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newBarber.name) return;
    try {
      const staffData = {
        ...newBarber,
        active: true
      };
      await addDoc(collection(db, 'shops', shopId, 'barbers'), staffData);
      setIsAdding(false);
      setNewBarber({ name: '', specialty: '', exp: '', image: '' });
      fetchBarbers();
    } catch (err) {
      console.error('Error adding barber:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingBarber || !editingBarber.name) return;
    try {
      const barberRef = doc(db, 'shops', shopId, 'barbers', editingBarber.id);
      await updateDoc(barberRef, {
        name: editingBarber.name,
        specialty: editingBarber.specialty,
        exp: editingBarber.exp,
        image: editingBarber.image
      });
      setEditingBarber(null);
      fetchBarbers();
    } catch (err) {
      console.error('Error updating barber:', err);
    }
  };

  const toggleActive = async (barber: Staff) => {
    try {
      const barberRef = doc(db, 'shops', shopId, 'barbers', barber.id);
      await updateDoc(barberRef, { active: !barber.active });
      setBarbers(barbers.map(b => b.id === barber.id ? { ...b, active: !b.active } : b));
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  const deleteBarber = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'shops', shopId, 'barbers', deletingId));
      setBarbers(barbers.filter(b => b.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting barber:', err);
    }
  };

  if (loading) return <div className="p-8 text-center font-black uppercase tracking-widest text-[10px] text-slate-500">Loading artisans...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight underline decoration-accent/30 underline-offset-8">STAFF<br />DIRECTORY</h2>
          <p className="text-slate-500 mt-2">Manage your master artisans and their schedules.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-accent text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-accent/20 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || editingBarber) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-xl"
          >
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{editingBarber ? 'Edit' : 'Artist'} Name</label>
                   <input 
                     type="text" 
                     value={editingBarber ? editingBarber.name : newBarber.name} 
                     onChange={e => editingBarber ? setEditingBarber({...editingBarber, name: e.target.value}) : setNewBarber({...newBarber, name: e.target.value})}
                     className="w-full p-4 bg-black/5 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-white/5 text-sm font-bold" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Specialty</label>
                   <input 
                     type="text" 
                     value={editingBarber ? editingBarber.specialty : newBarber.specialty} 
                     onChange={e => editingBarber ? setEditingBarber({...editingBarber, specialty: e.target.value}) : setNewBarber({...newBarber, specialty: e.target.value})}
                     className="w-full p-4 bg-black/5 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-white/5 text-sm font-bold" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exp (e.g. 10 Yrs)</label>
                   <input 
                     type="text" 
                     value={editingBarber ? editingBarber.exp : newBarber.exp} 
                     onChange={e => editingBarber ? setEditingBarber({...editingBarber, exp: e.target.value}) : setNewBarber({...newBarber, exp: e.target.value})}
                     className="w-full p-4 bg-black/5 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-white/5 text-sm font-bold" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL</label>
                   <input 
                     type="text" 
                     value={editingBarber ? editingBarber.image : newBarber.image} 
                     onChange={e => editingBarber ? setEditingBarber({...editingBarber, image: e.target.value}) : setNewBarber({...newBarber, image: e.target.value})}
                     className="w-full p-4 bg-black/5 rounded-xl outline-none focus:ring-2 focus:ring-accent border border-white/5 text-sm font-bold" 
                   />
                </div>
             </div>
             <div className="flex justify-end gap-6 mt-8 pt-6 border-t border-[var(--color-border)]">
                <button 
                  onClick={() => { setIsAdding(false); setEditingBarber(null); }} 
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={editingBarber ? handleUpdate : handleAdd} 
                  className="bg-accent text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-colors shadow-lg shadow-accent/20"
                >
                  {editingBarber ? 'Update Profile' : 'Save Member'}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--color-card)] p-10 rounded-[2.5rem] border border-[var(--color-border)] max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500/20" />
              <div className="mb-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-ink">REMOVE <span className="text-red-500 underline">ARTISAN</span>?</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-loose">This action is irreversible. All profile data and schedules for this staff member will be permanently removed from the directory.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 transition-all hover:border-accent/40 group overflow-hidden">
             <div className="flex gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                   <div>
                     <h3 className="font-black text-sm uppercase tracking-tighter">{barber.name}</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-1">{barber.specialty}</p>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setEditingBarber(barber)} title="Edit Details" className="text-slate-500 hover:text-accent transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteBarber(barber.id)} title="Delete Staff" className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      <button className="text-slate-500 hover:text-accent transition-colors"><Phone className="w-4 h-4" /></button>
                   </div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
                <div className="flex items-center gap-1 text-accent">
                   <Star className="w-3 h-3 fill-current" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Master Status</span>
                </div>
                 <button 
                   onClick={() => toggleActive(barber)}
                   className="flex items-center gap-3 group/toggle"
                 >
                   <div className="text-right mr-2 hidden sm:block">
                     <p className={`text-[8px] font-black uppercase tracking-widest ${barber.active ? 'text-green-500' : 'text-slate-400'}`}>
                       {barber.active ? 'Online' : 'Offline'}
                     </p>
                     <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Availability Status</p>
                   </div>
                   <div className={`w-10 h-5 rounded-full transition-all duration-300 relative ${barber.active ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-200'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${barber.active ? 'left-6' : 'left-1'}`} />
                   </div>
                 </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
