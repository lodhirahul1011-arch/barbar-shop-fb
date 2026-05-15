import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCircle2, Scissors, ShieldCheck, Upload, X, Zap } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../services/firebase';

const PLANS = [
  {
    name: 'SILVER',
    price: '$45',
    period: 'monthly',
    tag: 'Casual Gentleman',
    features: ['1 Master Haircut', 'Beard Trim (50% off)', 'Complimentary Beverage', 'Priority Queue (WA)'],
    accent: 'bg-slate-400'
  },
  {
    name: 'GOLD',
    price: '$85',
    period: 'monthly',
    tag: 'Regular VIP',
    featured: true,
    features: ['2 Master Haircuts', 'Unlimited Beard Trims', 'Facial Treatment (1/mo)', 'VIP Event Access', 'Early Slot Access'],
    accent: 'bg-accent'
  },
  {
    name: 'ELITE',
    price: '$150',
    period: 'monthly',
    tag: 'Modern Icon',
    features: ['Unlimited Cuts & Shaves', 'Full Grooming Package', 'Private Grooming Lounge', 'Concierge Service', 'At-Home Service (1/mo)'],
    accent: 'bg-white'
  }
];

const PRICING_LIST = [
  { service: 'Master Haircut', time: '30 min', price: '$35', category: 'Hair' },
  { service: 'Skin Fade', time: '45 min', price: '$40', category: 'Hair' },
  { service: 'Signature Shave', time: '40 min', price: '$30', category: 'Beard' },
  { service: 'Beard Sculpting', time: '20 min', price: '$20', category: 'Beard' },
  { service: 'Oxygen Facial', time: '45 min', price: '$60', category: 'Skin' },
  { service: 'Scalp Detox', time: '20 min', price: '$25', category: 'Skin' },
  { service: 'Full Grooming Package', time: '90 min', price: '$95', category: 'Package' },
];

const CATEGORIES = ['All', 'Hair', 'Beard', 'Skin', 'Package'];
const SCREENSHOT_MAX_BYTES = 750 * 1024;

const getPlanAmount = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;

const createOrderId = (planName: string) =>
  `BF-${planName.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Pricing() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentPlan, setPaymentPlan] = useState<(typeof PLANS)[number] | null>(null);
  const [orderId, setOrderId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    payerName: '',
    contact: '',
    transactionId: '',
    paymentMode: 'UPI',
    notes: '',
  });

  const filteredPricingList = selectedCategory === 'All'
    ? PRICING_LIST
    : PRICING_LIST.filter(item => item.category === selectedCategory);
  const paymentAmount = paymentPlan ? getPlanAmount(paymentPlan.price) : 0;
  const demoQrPayload = paymentPlan
    ? `upi://pay?pa=barberflowdemo@upi&pn=${encodeURIComponent('BarberFlow Demo')}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`${orderId} ${paymentPlan.name} membership`)}`
    : '';

  const openPaymentModal = (plan: (typeof PLANS)[number]) => {
    setPaymentPlan(plan);
    setOrderId(createOrderId(plan.name));
    setScreenshot(null);
    setPaymentStatus('idle');
    setPaymentError('');
    setPaymentForm({
      payerName: '',
      contact: '',
      transactionId: '',
      paymentMode: 'UPI',
      notes: '',
    });
  };

  const closePaymentModal = () => {
    setPaymentPlan(null);
    setPaymentError('');
  };

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentPlan) return;
    if (!screenshot) {
      setPaymentError('Payment screenshot is required.');
      return;
    }
    if (screenshot.size > SCREENSHOT_MAX_BYTES) {
      setPaymentError('Screenshot must be below 750 KB.');
      return;
    }

    setPaymentStatus('submitting');
    setPaymentError('');

    try {
      const screenshotDataUrl = await fileToDataUrl(screenshot);
      const verificationPayload = {
        planName: paymentPlan.name,
        planPrice: paymentPlan.price,
        amount: paymentAmount,
        orderId,
        transactionId: paymentForm.transactionId.trim(),
        payerName: paymentForm.payerName.trim(),
        contact: paymentForm.contact.trim(),
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes.trim(),
        screenshotDataUrl,
        screenshotName: screenshot.name,
        screenshotType: screenshot.type,
        screenshotSize: screenshot.size,
        status: 'pending_verification',
        createdAt: Date.now(),
      };

      try {
        await addDoc(collection(db, 'paymentVerifications'), verificationPayload);
      } catch (err) {
        console.warn('Firestore payment verification save failed; using local demo fallback.', err);
        const existing = JSON.parse(localStorage.getItem('barberflow_payment_verifications') || '[]');
        localStorage.setItem(
          'barberflow_payment_verifications',
          JSON.stringify([{ ...verificationPayload, localOnly: true }, ...existing].slice(0, 10))
        );
      }

      setPaymentStatus('success');
    } catch (err) {
      console.error(err);
      setPaymentError('Could not submit verification. Please try again.');
      setPaymentStatus('idle');
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-32">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl uppercase tracking-tighter">PRICING <span className="text-h-glow">& PLANS</span></h1>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Transparent. Premium. Justified.</p>
        </div>

        {/* Membership Plans */}
        <div className="grid md:grid-cols-3 gap-8">
           {PLANS.map((plan, i) => (
             <motion.div 
               key={plan.name}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className={`p-1 flex flex-col rounded-[2.5rem] relative ${plan.featured ? 'bg-gradient-to-b from-accent to-transparent' : 'bg-white/5'}`}
             >
               <div className="bg-[#0a0a0a] rounded-[2.4rem] p-10 flex-1 flex flex-col">
                  {plan.featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 font-black text-[8px] uppercase tracking-widest rounded-full">Recommended</div>}
                  
                  <div className="mb-10">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{plan.tag}</div>
                    <h3 className="text-5xl font-display font-black text-white">{plan.name}</h3>
                  </div>

                  <div className="mb-12">
                     <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{plan.price}</span>
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">/{plan.period}</span>
                     </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex gap-4 items-start">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openPaymentModal(plan)}
                    className={`w-full mt-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs text-center transition-all ${plan.featured ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Select {plan.name}
                  </button>
               </div>
             </motion.div>
           ))}
        </div>

        {/* Standard Menu */}
        <div className="space-y-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-6">
              <h2 className="text-4xl md:text-5xl uppercase tracking-tighter">THE <span className="text-accent underline">PRICE</span> LIST</h2>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     type="button"
                     aria-pressed={selectedCategory === cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`h-11 min-w-20 px-5 rounded-md border whitespace-nowrap transition-all ${
                       selectedCategory === cat
                         ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                         : 'border-white/10 bg-white/5 text-slate-400 hover:border-accent hover:text-white'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
              {filteredPricingList.map((item, i) => (
                <div key={i} className="flex flex-col group">
                  <div className="flex justify-between items-end mb-2">
                    <h4 className="text-xl font-black uppercase tracking-tighter group-hover:text-accent transition-colors">{item.service}</h4>
                    <div className="flex-1 mx-4 border-b border-dotted border-white/20 mb-2" />
                    <span className="text-2xl font-display font-black">{item.price}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>{item.category} Category</span>
                    <span>{item.time} Execution</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Global Features Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5 border border-white/5">
           {[
             { icon: <Zap />, label: 'Fast Pass', desc: 'Active members skip standard queues' },
             { icon: <ShieldCheck />, label: 'Secure Pay', desc: 'Multiple payment channels supported' },
             { icon: <Scissors />, label: 'Master Kit', desc: 'Premium toolsets used for every session' },
           ].map(f => (
             <div key={f.label} className="p-10 bg-black flex flex-col items-center text-center space-y-4">
                <div className="text-accent">{f.icon}</div>
                <h4 className="font-display font-black text-sm uppercase tracking-tighter">{f.label}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">{f.desc}</p>
             </div>
           ))}
        </div>
      </div>

      {paymentPlan && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-5xl bg-[#080808] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Payment Verification</p>
                  <h3 className="text-3xl font-display font-black uppercase mt-1">{paymentPlan.name} Membership</h3>
                </div>
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-accent transition-colors"
                  aria-label="Close payment form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paymentStatus === 'success' ? (
                <div className="p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-4xl font-display font-black uppercase">Submitted</h4>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-4">
                    Order {orderId} is pending payment verification.
                  </p>
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="mt-8 px-10 py-4 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[360px_1fr] gap-0">
                  <div className="p-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]">
                    <div className="bg-white p-5 rounded-2xl w-fit mx-auto shadow-xl">
                      <QRCodeCanvas value={demoQrPayload} size={230} level="H" includeMargin />
                    </div>
                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between border-b border-white/10 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID</span>
                        <span className="text-xs font-black text-white">{orderId}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</span>
                        <span className="text-xs font-black text-accent">{paymentPlan.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Merchant</span>
                        <span className="text-xs font-black text-white">barberflowdemo@upi</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="p-8 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</span>
                        <input
                          required
                          value={paymentForm.payerName}
                          onChange={e => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                          className="input-ui"
                          placeholder="Customer name"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone / Email</span>
                        <input
                          required
                          value={paymentForm.contact}
                          onChange={e => setPaymentForm({ ...paymentForm, contact: e.target.value })}
                          className="input-ui"
                          placeholder="Contact detail"
                        />
                      </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction ID</span>
                        <input
                          required
                          value={paymentForm.transactionId}
                          onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                          className="input-ui"
                          placeholder="UPI / bank reference"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Mode</span>
                        <select
                          value={paymentForm.paymentMode}
                          onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                          className="input-ui"
                        >
                          <option>UPI</option>
                          <option>Card</option>
                          <option>Net Banking</option>
                          <option>Wallet</option>
                        </select>
                      </label>
                    </div>

                    <label className="space-y-2 block">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Screenshot</span>
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white">
                              {screenshot ? screenshot.name : 'Upload screenshot'}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              JPG / PNG below 750 KB
                            </p>
                          </div>
                        </div>
                        <input
                          required
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={e => {
                            setScreenshot(e.target.files?.[0] || null);
                            setPaymentError('');
                          }}
                          className="text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-3 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:text-white"
                        />
                      </div>
                    </label>

                    <label className="space-y-2 block">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</span>
                      <textarea
                        value={paymentForm.notes}
                        onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="input-ui h-24 py-3 resize-none"
                        placeholder="Optional verification note"
                      />
                    </label>

                    {paymentError && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-[10px] font-black uppercase tracking-widest">
                        {paymentError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={paymentStatus === 'submitting'}
                      className="w-full py-5 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20 disabled:opacity-60"
                    >
                      {paymentStatus === 'submitting' ? 'Submitting...' : 'Submit For Verification'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
