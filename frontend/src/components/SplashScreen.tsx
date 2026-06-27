"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per session so it's not annoying on every refresh
    const hasShown = sessionStorage.getItem("splash_shown");
    if (!hasShown) {
      setShow(true);
      sessionStorage.setItem("splash_shown", "true");
      
      // Hide the splash screen after 2.2 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Animated Lightning Bolt */}
              <motion.svg
                viewBox="0 0 24 24"
                className="h-16 w-auto fill-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1
                }}
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </motion.svg>
              
              {/* Animated Text */}
              <motion.div
                className="font-black text-6xl tracking-tighter text-white flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span className="lowercase">hirecue</span>
              </motion.div>
            </div>
            
            {/* Loading Bar */}
            <motion.div 
              className="h-1 w-48 bg-slate-800 rounded-full mt-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.8, ease: "circOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
