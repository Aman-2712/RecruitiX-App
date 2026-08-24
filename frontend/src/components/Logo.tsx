import React from 'react';
import Image from 'next/image';

export default function Logo({ className = "h-9" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative h-full aspect-square flex items-center justify-center overflow-hidden rounded-xl">
        <Image
          src="/logo.png"
          alt="HireCue Logo"
          width={36}
          height={36}
          className="object-contain h-full w-auto"
          priority
        />
      </div>
      <div className="font-black text-xl md:text-2xl tracking-tighter text-slate-900 flex items-center">
        <span>Hire</span><span className="text-blue-600">Cue</span>
      </div>
    </div>
  );
}
