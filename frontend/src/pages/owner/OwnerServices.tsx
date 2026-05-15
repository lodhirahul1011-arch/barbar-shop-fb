import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarberService } from '../../types';
import { Plus, Trash2, Edit3, Scissors, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OwnerServices() {
  const [services, setServices] = useState<BarberService[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<Partial<BarberService>>({
    name: '',
    description: '',
    duration: 30,
    price: 25
  });
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [loading, setLoading] = useState(true);

  const shopId = 'default-shop'; // Should be dynamic in real app

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    const snap = await getDocs(collection(db, 'shops', shopId, 'services'));
    setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BarberService)));
    setLoading(false);
  }

  async function handleAdd() {
    if (!newService.name || !newService.price) return;
    await addDoc(collection(db, 'shops', shopId, 'services'), newService);
    setNewService({ name: '', description: '', duration: 30, price: 25 });
    setIsAdding(false);
    fetchServices();
  }

  async function handleUpdate() {
    if (!editingService || !editingService.name || !editingService.price) return;
    const { id, ...data } = editingService;
    await updateDoc(doc(db, 'shops', shopId, 'services', id), data);
    setEditingService(null);
    fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;
    await deleteDoc(doc(db, 'shops', shopId, 'services', id));
    fetchServices();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight underline decoration-accent/30 underline-offset-8">Services</h2>
          <p className="text-slate-500 mt-2">Manage what you offer to your clients.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-accent text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-amber-600 transition-all shadow-xl shadow-accent/20"
        >
          <Plus className="w-5 h-5" /> Add Service
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || editingService) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-lg transition-colors"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Name</label>
                <input 
                  type="text" 
                  value={editingService ? editingService.name : newService.name}
                  onChange={e => editingService ? setEditingService({...editingService, name: e.target.value}) : setNewService({...newService, name: e.target.value})}
                  className="w-full p-4 bg-black/5 rounded-xl focus:ring-2 focus:ring-accent outline-none text-ink font-bold"
                  placeholder="e.g. Master Haircut"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Price ($)</label>
                <input 
                  type="number" 
                  value={editingService ? editingService.price : newService.price}
                  onChange={e => editingService ? setEditingService({...editingService, price: Number(e.target.value)}) : setNewService({...newService, price: Number(e.target.value)})}
                  className="w-full p-4 bg-black/5 rounded-xl focus:ring-2 focus:ring-accent outline-none text-ink font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL</label>
                <input 
                  type="text" 
                  value={editingService ? (editingService.image || '') : (newService.image || '')}
                  onChange={e => editingService ? setEditingService({...editingService, image: e.target.value}) : setNewService({...newService, image: e.target.value})}
                  className="w-full p-4 bg-black/5 rounded-xl focus:ring-2 focus:ring-accent outline-none text-ink font-bold"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration (mins)</label>
                <input 
                  type="number" 
                  value={editingService ? editingService.duration : newService.duration}
                  onChange={e => editingService ? setEditingService({...editingService, duration: Number(e.target.value)}) : setNewService({...newService, duration: Number(e.target.value)})}
                  className="w-full p-4 bg-black/5 rounded-xl focus:ring-2 focus:ring-accent outline-none text-ink font-bold"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                <textarea 
                  value={editingService ? editingService.description : newService.description}
                  onChange={e => editingService ? setEditingService({...editingService, description: e.target.value}) : setNewService({...newService, description: e.target.value})}
                  className="w-full p-4 bg-black/5 rounded-xl focus:ring-2 focus:ring-accent outline-none h-24 text-ink font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-8 pt-6 border-t border-[var(--color-border)]">
              <button 
                onClick={() => { setIsAdding(false); setEditingService(null); }} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={editingService ? handleUpdate : handleAdd} 
                className="bg-accent text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20 hover:bg-amber-600"
              >
                {editingService ? 'Update Service' : 'Save Service'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            {service.image ? (
              <div className="h-48 w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            ) : (
              <div className="h-48 w-full bg-accent/10 flex items-center justify-center">
                <Scissors className="w-12 h-12 text-accent opacity-20" />
              </div>
            )}
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black uppercase tracking-tighter">{service.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setEditingService(service)} className="p-2 text-slate-300 hover:text-accent transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 line-clamp-2 leading-loose">{service.description}</p>
              <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
                <span className="text-3xl font-black">${service.price}</span>
                <span className="text-[8px] font-black uppercase text-white bg-accent px-3 py-1 rounded-full tracking-[0.2em]">{service.duration} mins</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
