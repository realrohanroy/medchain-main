"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function LeftPanel() {
  const specialists = [
    { id: 1, src: "https://images.unsplash.com/photo-1559839734-2b71f153678f?auto=format&fit=crop&q=80&w=100&h=100", alt: "Specialist 1" },
    { id: 2, src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100", alt: "Specialist 2" },
    { id: 3, src: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=100&h=100", alt: "Specialist 3" },
  ];

  return (
    <aside className="hidden lg:flex w-1/2 clinical-gradient relative overflow-hidden flex-col justify-between p-16 text-white">
      {/* Abstract Decoration Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-white/5 rounded-full blur-2xl" />

      {/* Brand Identity */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <ShieldCheck className="text-med-blue w-6 h-6" />
        </div>
        <span className="font-bold text-2xl tracking-tight">MedChain</span>
      </motion.div>

      {/* Content Shell */}
      <div className="relative z-10 max-w-lg">
        <motion.h1 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-extrabold text-6xl leading-tight mb-6"
        >
          Secure Healthcare Records, Simplified
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-blue-100 text-xl font-medium leading-relaxed opacity-90"
        >
          Access your medical data anytime, anywhere. Experience the future of decentralized patient privacy.
        </motion.p>
      </div>

      {/* Visual Anchor */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-4 px-6 py-4 glass-card rounded-2xl">
          <div className="flex -space-x-3">
            {specialists.map((s) => (
              <img 
                key={s.id}
                className="w-10 h-10 rounded-full border-2 border-med-blue object-cover" 
                src={s.src} 
                alt={s.alt}
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-white">Trusted by 2,000+ Specialists</span>
        </div>
      </motion.div>
    </aside>
  );
}
