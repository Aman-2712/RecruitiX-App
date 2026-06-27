import React from 'react';

export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Lightning Bolt */}
      <svg viewBox="0 0 24 24" className="h-full w-auto fill-blue-600" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {/* Text */}
      <div className="font-black text-2xl tracking-tighter text-slate-900 flex items-center">
        <span className="lowercase">hirecue</span>
      </div>
    </div>
  );
}
