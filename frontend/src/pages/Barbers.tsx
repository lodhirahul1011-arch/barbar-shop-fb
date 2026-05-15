import React from 'react';
import { motion } from 'motion/react';
import { Scissors, Check, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BARBERS = [
  { 
    name: 'Antonio Vaccaro', 
    specialty: 'Master Barber & Afro Specialist', 
    exp: '15 Years', 
    bio: 'Lead stylist with an obsession for sharp edges and traditional wet shaves.',
    image: 'https://images.unsplash.com/photo-1503910368127-b459c724add3?auto=format&fit=crop&w=400&q=80',
    tags: ['Skin Fade', 'Hot Towel', 'Line-up']
  },
  { 
    name: 'Luca Moretti', 
    specialty: 'Beard Architect', 
    exp: '10 Years', 
    bio: 'Specialist in beard sculpting and structural styling. Trained in Italy.',
    image: 'https://images.unsplash.com/photo-1521446704128-444439775330?auto=format&fit=crop&w=400&q=80',
    tags: ['Beard Shape', 'Goatee Specialist', 'Modern Cut']
  },
  { 
    name: 'Matteo Gallo', 
    specialty: 'Contemporary Fade specialist', 
    exp: '8 Years', 
    bio: 'The king of modern textures and creative patterns. Always pushing boundaries.',
    image: 'https://images.unsplash.com/photo-1593702295094-172c5231952e?auto=format&fit=crop&w=400&q=80',
    tags: ['Crop Top', 'Burst Fade', 'Design']
  },
  { 
    name: 'Domenico S.', 
    specialty: 'Classic Scissor Specialist', 
    exp: '20 Years', 
    bio: 'Preserving the old-school techniques with a zero-clipper philosophy.',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
    tags: ['Long Hair', 'Taper', 'Scissor Only']
  },
];

export default function Barbers() {
  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-accent/10 border border-accent/20 rounded-full mb-8"
          >
            <Scissors className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Master Artisans</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl">THE <span className="text-h-glow">TEAM</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-xl mx-auto leading-relaxed">
            Every barber at BarberFlow is a hand-picked specialist committed to the highest standards of the craft.
          </p>
        </div>

        {/* Barbers Grid */}
        <div className="grid md:grid-cols-2 gap-12">
          {BARBERS.map((barber, idx) => (
            <motion.div 
              key={barber.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group flex flex-col lg:flex-row gap-8 bg-white/5 border border-white/5 p-8 rounded-3xl hover:border-accent/40 transition-all"
            >
              <div className="lg:w-48 h-64 lg:h-auto shrink-0 overflow-hidden rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-700">
                <img src={barber.image} alt={barber.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-3xl font-display font-black uppercase tracking-tighter">{barber.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      <span className="text-xs font-black">5.0</span>
                    </div>
                  </div>
                  <div className="text-accent font-black uppercase tracking-widest text-[10px] mb-4">{barber.specialty} • {barber.exp}</div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-loose mb-6">{barber.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {barber.tags.map(tag => (
                      <span key={tag} className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 border border-white/5">{tag}</span>
                    ))}
                  </div>
                </div>

                <Link to="/login" className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white group-hover:text-accent transition-colors">
                  Book Session <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Philosophy Card */}
        <div className="bg-accent p-12 lg:p-24 rounded-[3rem] relative overflow-hidden">
           <Scissors className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 -rotate-12" />
           <div className="max-w-3xl relative z-10 space-y-8">
              <h2 className="text-5xl md:text-7xl font-black uppercase leading-none text-white">THE ART OF <br />PRECISION</h2>
              <p className="text-xl text-white/80 font-medium leading-relaxed">
                We believe that a haircut is more than just service—it's a transformation. Our barbers combine years of heritage with modern style to create a look that is uniquely yours.
              </p>
              <div className="flex flex-wrap gap-8 pt-6">
                {[
                  'Official Industry Certification',
                  '100+ Hours Annual Training',
                  'Customer First Philosophy'
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="font-black uppercase tracking-widest text-[10px]">{item}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
