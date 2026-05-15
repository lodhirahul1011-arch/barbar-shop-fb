import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Scissors, Calendar, Bell, MessageSquare, ShieldCheck, ArrowRight, Star, ChevronRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICES = [
  { name: 'Master Haircut', price: '$35', icon: '✂️' },
  { name: 'Signature Shave', price: '$25', icon: '🪒', featured: true },
  { name: 'Oxygen Facial', price: '$45', icon: '💆‍♂️' },
  { name: 'Deep Cleanse', price: '$40', icon: '🧖‍♂️' },
  { name: 'Beard Sculpting', price: '$20', icon: '🧔' },
  { name: 'Scalp Massage', price: '$15', icon: '🧼' },
];

const HAIR_PATTERNS = [
  { name: 'Protective', icon: '🧶' },
  { name: 'Coily', icon: '➰' },
  { name: 'Curly', icon: '🌀' },
  { name: 'Wavy', icon: '〰️' },
  { name: 'Straight', icon: '➖' },
  { name: 'Bald/Shaved', icon: '👨‍🦲' },
];

const GALLERY = [
  { before: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80', after: 'https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&w=300&q=80' },
  { before: 'https://images.unsplash.com/photo-1581404917879-53e19259fdda?auto=format&fit=crop&w=300&q=80', after: 'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=300&q=80' },
];

const BARBERS = [
  { name: 'Antonio V.', specialty: 'Master Barber', exp: '12 Yrs', image: 'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=300&q=80' },
  { name: 'Luca S.', specialty: 'Beard Architect', exp: '8 Yrs', image: 'https://images.unsplash.com/photo-1521446704128-444439775330?auto=format&fit=crop&w=300&q=80' },
  { name: 'Matteo G.', specialty: 'Fade Specialist', exp: '10 Yrs', image: 'https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&w=300&q=80' },
];

const TESTIMONIALS = [
  { name: 'James Wilson', text: 'The best fade I have ever had. The attention to detail is unmatched.', rating: 5 },
  { name: 'Sarah Miller', text: 'Brought my son here and Antonio was amazing. Very professional and clean.', rating: 5 },
  { name: 'David Chen', text: 'Love the WhatsApp booking. So convenient and the coffee is actually good!', rating: 5 },
];

const BOOK_SLOT_PATH = '/book/default-shop';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-white">
      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.3] contrast-125 scale-110 grayscale-[0.5]"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2674)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        
        {/* Decorative Floating Brush/Scissors Placeholder */}
        <motion.div 
          className="absolute top-1/4 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <motion.div
           style={{ y: heroY, opacity: heroOpacity }}
           className="relative z-10 max-w-5xl space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-7xl md:text-9xl leading-none">
              SLICK <span className="text-white">STYLE</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="h-[2px] w-12 bg-accent" />
              <p className="font-mono text-accent font-bold tracking-[0.4em] uppercase text-xs md:text-sm">Mastering the art of grooming</p>
              <span className="h-[2px] w-12 bg-accent" />
            </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-slate-400 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Experience the pinnacle of barbering excellence. We blend traditional techniques with modern precision to redefine your look.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6 pt-8"
          >
            <Link to={BOOK_SLOT_PATH} className="bg-white text-black px-12 py-6 rounded-sm font-black uppercase tracking-widest text-sm hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1 flex items-center gap-3">
              Book Slot Now <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border border-white/20 hover:border-accent text-white px-12 py-6 rounded-sm font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3">
              Play Intro <PlayCircle className="w-5 h-5 text-accent" />
            </button>
          </motion.div>
        </motion.div>
      </header>

      {/* Services Grid Section */}
      <section className="py-32 px-6 bg-[#0a0a0a] border-t border-white/5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-accent font-black uppercase tracking-[0.5em] text-[10px]"
            >
              Our Specialties
            </motion.p>
            <h2 className="text-6xl text-white">MAN'S <span className="text-h-glow">GROOMING</span> SERVICES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/5 border border-white/5 shadow-2xl">
            {SERVICES.map((s, idx) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`p-12 group hover:bg-accent/5 transition-all relative overflow-hidden ${s.featured ? 'bg-accent/10 border-2 border-accent/20' : 'bg-black'}`}
              >
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">{s.icon}</div>
                <h3 className="text-2xl font-display font-black uppercase tracking-tighter mb-4">{s.name}</h3>
                <p className="text-slate-500 text-sm leading-loose mb-10">Whether you're looking for a traditional cut or something modern, our experts ensure you leave looking your best.</p>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-accent font-bold text-sm uppercase tracking-widest">Starting at</span>
                  <span className="text-3xl font-display font-black text-white">{s.price}</span>
                </div>
                {s.featured && <div className="absolute top-4 right-4 bg-accent text-[8px] font-black uppercase px-2 py-1 tracking-widest text-white">Most Popular</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
          <div className="md:w-1/2 space-y-12">
            <div className="space-y-4">
              <p className="text-accent font-black uppercase tracking-[0.5em] text-[10px]">Excellence</p>
              <h2 className="text-6xl md:text-7xl leading-none">WHY <br /><span className="text-h-glow">CHOOSE</span> US?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: 'Surgical Precision', desc: 'Every cut is executed with mathematical accuracy.' },
                { title: 'Premium Products', desc: 'We only use top-tier organic oils and clays.' },
                { title: 'Hygiene First', desc: 'Surgical grade sterilization after every session.' },
                { title: 'Digital Flow', desc: 'Seamless booking and tracking via WhatsApp.' },
              ].map(f => (
                <div key={f.title} className="space-y-4 p-8 bg-white/5 border border-white/5 rounded-2xl group hover:border-accent/40 transition-all">
                  <div className="w-12 h-1 bg-accent group-hover:w-full transition-all duration-500" />
                  <h4 className="font-display font-black text-sm uppercase tracking-tighter">{f.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-widest">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="md:w-1/2 relative">
             <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&q=80" alt="Mastery" className="w-full h-full object-cover grayscale brightness-75" />
             </div>
             <div className="absolute -bottom-10 -right-10 bg-accent p-12 rounded-3xl shadow-2xl hidden lg:block">
                <Scissors className="w-12 h-12 text-white" />
                <p className="mt-4 font-display font-black text-2xl">EST. 2014</p>
             </div>
          </div>
        </div>
      </section>

      {/* Meet The Team */}
      <section className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <p className="text-accent font-black uppercase tracking-[0.5em] text-[10px]">The Artists</p>
              <h2 className="text-6xl">MEET THE <span className="text-h-glow">TEAM</span></h2>
            </div>
             <Link to="/team" className="text-accent font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">View all 15 barbers</Link>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {BARBERS.map((barber, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-white/5 relative z-10">
                  <img src={barber.image} alt={barber.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                </div>
                <div className="absolute -bottom-6 left-6 right-6 bg-[#111111] p-8 rounded-2xl border border-white/5 shadow-2xl z-20 group-hover:border-accent transition-colors">
                  <div className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-2">{barber.specialty}</div>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tighter">{barber.name}</h3>
                  <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span>Experience: {barber.exp}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search by Hair Pattern Section */}
      <section className="py-24 bg-white/5 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="flex items-center justify-center gap-3 mb-12">
            <h3 className="text-xl font-bold font-sans">Search by hair pattern</h3>
            <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold">i</div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {HAIR_PATTERNS.map((p, idx) => (
              <motion.button
                key={p.name}
                whileHover={{ y: -5, scale: 1.05 }}
                className="w-28 p-6 bg-white/10 hover:bg-accent transition-all flex flex-col items-center gap-3 rounded-2xl group shadow-xl"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{p.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{p.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Gallery */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          <div className="text-center space-y-4">
             <h2 className="text-5xl border-b-2 border-accent inline-block pb-4">TRANSFORMATION GALLERY</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Real Results from Real Gentlemen</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {GALLERY.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative group p-1 bg-gradient-to-br from-accent/20 to-transparent"
              >
                <div className="grid grid-cols-2 gap-1 bg-black">
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <img src={item.before} alt="Before" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-700 hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 font-black text-[10px] uppercase tracking-widest text-white/50">Before</div>
                  </div>
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <img src={item.after} alt="After" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute top-4 right-4 bg-accent px-3 py-1 font-black text-[10px] uppercase tracking-widest">After</div>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl group-hover:bg-accent group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 duration-500">
                  View Case Study
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
             <h2 className="text-6xl"><span className="text-h-glow">TRUE</span> STORIES</h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">What Our Gentlemen Say</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="p-10 bg-white/5 border border-white/5 rounded-3xl relative">
                  <div className="text-accent text-6xl font-serif absolute -top-4 left-6 opacity-20">"</div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-accent fill-accent" />)}
                  </div>
                  <p className="text-white text-lg font-medium leading-relaxed mb-8 italic">{t.text}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-black text-accent text-xs">
                      {t.name[0]}
                    </div>
                    <span className="font-display font-black uppercase tracking-tighter text-sm">{t.name}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-24 bg-accent/5">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid md:grid-cols-4 gap-12">
              {[
                { val: '2.5k+', label: 'Gentlemen served' },
                { val: '15+', label: 'Master Barbers' },
                { val: '99%', label: 'Joy Rate' },
                { val: '5/5', label: 'Safety score' },
              ].map(stat => (
                <div key={stat.label} className="text-center space-y-2">
                  <div className="text-5xl font-display font-black text-white">{stat.val}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-accent">{stat.label}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-48 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-accent grayscale-[0.8] opacity-10 blur-3xl rounded-full scale-150 rotate-12" />
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-7xl md:text-8xl leading-[0.8]">READY FOR THE<br /><span className="text-h-glow">UPGRADE?</span></h2>
          <p className="text-xl text-slate-400 font-medium max-w-xl mx-auto">Your seat is waiting. Join the modern gentleman's grooming movement today.</p>
          <div className="pt-8">
            <Link to={BOOK_SLOT_PATH} className="bg-accent text-white px-16 py-8 rounded-sm font-black uppercase tracking-widest text-lg shadow-2xl hover:bg-blue-600 transition-all inline-block hover:-translate-y-2">
              Book Your Session
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="py-24 px-6 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center font-black text-white text-xs">B</div>
              <span className="font-display font-black text-sm tracking-tighter">BARBERFLOW</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Redefining the modern grooming experience through technology and artistry.</p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Platform</h4>
            <div className="grid gap-4">
              <Link to="/about" className="text-sm text-slate-500 hover:text-white transition-colors">About Us</Link>
              <Link to="/team" className="text-sm text-slate-500 hover:text-white transition-colors">Barbers Team</Link>
              <Link to="/pricing" className="text-sm text-slate-500 hover:text-white transition-colors">Services & Pricing</Link>
              <Link to={BOOK_SLOT_PATH} className="text-sm text-slate-500 hover:text-white transition-colors">Book Session</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Support</h4>
            <div className="grid gap-4">
              <Link to="/contact" className="text-sm text-slate-500 hover:text-white transition-colors">Contact</Link>
              <Link to="/support" className="text-sm text-slate-500 hover:text-white transition-colors">Help Center</Link>
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>

          <div className="space-y-8">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Stay Tuned</h4>
             <div className="flex bg-white/5 border border-white/10 p-1">
                <input type="text" placeholder="GENTLEMAN EMAIL" className="bg-transparent px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none w-full" />
                <button className="bg-accent text-white px-4 py-3 font-black uppercase text-[10px]">Go</button>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">© 2026 BARBERFLOW ENGINE V1.0 • ALL DESIGN PROTECTED</p>
           <div className="flex gap-8 text-slate-600">
              <Star className="w-4 h-4 hover:text-accent cursor-pointer" />
              <Star className="w-4 h-4 hover:text-accent cursor-pointer" />
              <Star className="w-4 h-4 hover:text-accent cursor-pointer" />
           </div>
        </div>
      </footer>
    </div>
  );
}
