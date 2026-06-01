"use client"; // Agar pehle se laga hai toh theek hai

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function NexusPreview() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="aspect-video bg-linear-to-br from-border-ui/50 to-transparent rounded-2xl border border-border-ui/50 animate-pulse" />
    );
  }

  return (
    <div className="aspect-video bg-linear-to-br from-border-ui/50 to-transparent rounded-2xl flex items-center justify-center text-subtext border border-border-ui/50 overflow-hidden">
      {resolvedTheme === "dark" ? (
      
        <video
          src="/nexus-preview-dashboard.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl transition-all ease-in duration-300"
        />
      ) : (
        <video
          src="/nexus-preview-dashboard-light.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl transition-all ease-in duration-300 "
        />
      )}
    </div>
  );
}