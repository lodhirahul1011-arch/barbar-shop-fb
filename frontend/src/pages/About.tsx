import React from 'react';
import { motion } from 'motion/react';
import { Scissors, Star, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BOOK_SLOT_PATH = '/book/default-shop';

export default function About() {
  return (
    <div className="bg-[#050505] min-h-screen text-white pt-20 pb-20 px-6 font-sans md:pt-24 md:pb-24">
      <div className="max-w-7xl mx-auto space-y-24 md:space-y-28">
        {/* Story Section */}
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-1/2 space-y-12">
            <div className="space-y-4">
              <p className="text-accent font-black uppercase tracking-[0.5em] text-[10px]">Since 2014</p>
              <h1 className="text-6xl md:text-8xl leading-none">THE <br /><span className="text-h-glow">STORY</span></h1>
            </div>
            <div className="space-y-8 text-slate-400 font-medium text-lg leading-relaxed">
              <p>
                BarberFlow started in a small basement in San Francisco with a single chair and a vision: to bring the precision of modern technology to the timeless art of barbering.
              </p>
              <p>
                Founded by master artisans who felt the industry had lost its soul to fast-cuts and generic styles, we built a sanctuary where quality is the only metric of success.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div>
                <p className="text-4xl font-display font-black text-white">5K+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-2">Sessions Yearly</p>
              </div>
              <div>
                <p className="text-4xl font-display font-black text-white">15</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-2">Awarded Barbers</p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border border-white/10 group">
                <img src="https://images.unsplash.com/photo-1512690196252-741ef02ed993?auto=format&fit=crop&q=80" alt="Legacy" className="w-full h-full object-cover grayscale brightness-75 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
             </div>
             <div className="absolute -bottom-10 -left-10 bg-white text-black p-12 rounded-[2rem] shadow-2xl hidden md:block">
                <h3 className="font-display font-black text-xl mb-2">OUR MISSION</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">To redefine grooming as a premium digital and physical experience.</p>
             </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="grid md:grid-cols-3 gap-12 pt-12">
          {[
            { title: 'The Vision', text: 'Connecting artisans and gentlemen through a seamless digital flow.' },
            { title: 'The Value', text: 'Uncompromising quality, total transparency, and surgical precision.' },
            { title: 'The Future', text: 'Expanding our sanctuary to icons in every major city globally.' },
          ].map(item => (
            <div key={item.title} className="p-12 bg-white/5 border border-white/5 rounded-3xl space-y-6">
              <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-accent">{item.title}</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-loose">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Interior Preview */}
        <div className="space-y-12">
           <h2 className="text-5xl border-b-2 border-accent inline-block pb-4">THE SANCTUARY</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1521446704128-444439775330?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&w=600&q=80'
              ].map((img, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={img} alt="Shop" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
        </div>

        {/* CTA */}
        <div className="bg-white px-6 py-14 sm:px-10 lg:px-20 lg:py-20 rounded-[2rem] text-black text-center relative overflow-hidden">
           <div className="relative z-10 mx-auto max-w-3xl space-y-8">
              <h2 className="text-4xl sm:text-5xl md:text-7xl leading-none text-black">JOIN THE<br />MOVEMENT</h2>
              <p className="text-base sm:text-xl font-medium max-w-xl mx-auto text-slate-900">Experience the transformation for yourself. Book your first session with our master artisans.</p>
              <Link to={BOOK_SLOT_PATH} className="bg-accent text-white px-8 py-4 sm:px-12 sm:py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all inline-block hover:-translate-y-2">
                Book Slot Now
              </Link>
           </div>
           <Scissors className="absolute -left-16 -top-16 w-64 h-64 text-black/5 rotate-45" />
        </div>
      </div>
    </div>
  );
}
