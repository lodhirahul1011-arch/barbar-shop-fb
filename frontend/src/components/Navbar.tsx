import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/pricing' },
  { label: 'Team', path: '/team' },
  { label: 'Contact', path: '/contact' },
];

const routeForRole = (role?: UserRole) => {
  if (role === UserRole.ADMIN) return '/admin';
  if (role === UserRole.OWNER) return '/owner';
  return '/dashboard';
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 left-0 w-full z-50 px-4 py-4 sm:px-6 md:px-12 md:py-6 flex justify-between items-center bg-black/80 backdrop-blur-xl border-b border-white/5 text-white">
      <Link to="/" className="group relative">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-black shadow-[0_0_15px_rgba(217,119,6,0.4)]"
              animate={{
                rotateY: [0, 360],
                z: [0, 20, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              B
            </motion.div>
            <div className="absolute inset-0 bg-accent/20 blur-xl group-hover:bg-accent/40 transition-all rounded-full" />
          </div>
          <span className="font-display font-black text-base sm:text-xl tracking-tighter">BARBERFLOW</span>
        </motion.div>
      </Link>

      <div className="flex items-center gap-3 md:gap-10">
        <div className="hidden lg:flex gap-10 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={routeForRole(profile?.role)}
                className="border border-white/15 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-sm font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:border-accent hover:text-accent transition-all"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="bg-accent text-white px-3 py-2 sm:px-5 sm:py-3 rounded-sm font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-accent/40 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="border border-white/15 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-sm font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:border-accent hover:text-accent transition-all"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-accent text-white px-3 py-2 sm:px-5 sm:py-3 rounded-sm font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-accent/40 transition-all"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
