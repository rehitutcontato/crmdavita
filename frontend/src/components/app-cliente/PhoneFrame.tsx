"use client";

import React, { useEffect, useState } from "react";
import { Wifi, Battery, Signal } from "lucide-react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState("14:28");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[380px] sm:w-[400px] h-[820px] rounded-[52px] bg-zinc-950 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_12px_#18181b,0_0_0_14px_#27272a] border border-zinc-800/80 flex flex-col select-none">
      {/* Side buttons simulation */}
      <div className="absolute -left-[14px] top-28 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -left-[14px] top-44 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -right-[14px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />

      {/* Screen container */}
      <div className="relative flex-1 w-full h-full bg-zinc-900 rounded-[38px] overflow-hidden flex flex-col border border-zinc-800/50 shadow-inner">
        {/* Status bar */}
        <div className="h-11 px-7 flex items-center justify-between z-30 bg-zinc-900/90 backdrop-blur-md text-zinc-300 text-xs font-semibold">
          <span>{time}</span>

          {/* Dynamic Island / Notch */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-2 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-500/80" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-zinc-200" />
          </div>
        </div>

        {/* Inner Phone Content */}
        <div className="relative flex-1 overflow-y-auto pb-6 scrollbar-none">
          {children}
        </div>

        {/* Bottom Home Indicator */}
        <div className="h-5 w-full bg-zinc-900/90 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-1 bg-zinc-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}
