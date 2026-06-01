"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { ToggleButton } from "./ToggleButton";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [session?.user?.image]);

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "N";

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 w-full max-w-[100vw] bg-main-bg/80 backdrop-blur-md border-b-2 border-border-ui z-50 flex items-center justify-between px-3 sm:px-6 md:px-12 overflow-hidden">
      <Link href="/" className="flex items-center gap-1 shrink-0">
        <span className="text-lg sm:text-xl font-bold tracking-tighter text-text-main">
          Nexus<span className="text-primary text-2xl">.</span>
        </span>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {status === "loading" ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse bg-border-ui rounded-full" />
        ) : session ? (
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link 
              href="/chat" 
              className="bg-primary hover:opacity-90 cursor-pointer text-white p-2 sm:px-4 sm:py-1.5 rounded-full font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-1"
            >
              <MessageSquare size={16} className="sm:size-4.5" />
              <span className="hidden sm:inline text-xs sm:text-sm">Chats</span>
            </Link>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-border-ui overflow-hidden shrink-0">
              {session.user?.image && !imgError ? (
                <img 
                  src={session.user.image} 
                  alt="User Avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover rounded-full border-primary border" 
                />
              ) : (
                <span className="text-xs sm:text-base font-bold uppercase tracking-wider">
                  {userInitial}
                </span>
              )}
            </div>

            <div className="hidden lg:flex flex-col items-end leading-tight text-start  max-w-37.5">
              <span className="text-xs font-bold text-text-main uppercase tracking-widest truncate w-full">
                {session.user?.name}
              </span>
              <span className="text-[10px] text-subtext font-medium truncate w-full ">
                {session.user?.email}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="bg-primary/10 hover:bg-primary/20 cursor-pointer text-primary border border-primary/20 p-2 sm:px-4 sm:py-1.5 rounded-full font-bold transition-all duration-300 flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={16} className="sm:hidden" />
              <span className="hidden sm:inline text-xs sm:text-sm">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-1.5 bg-text-main text-main-bg px-3 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <FcGoogle size={15} className="sm:size-4" />
            <span>Join Nexus</span>
          </button>
        )}

        <div className="h-5 w-px bg-border-ui mx-0.5 hidden xs:block" />
        
        <div className="scale-85 sm:scale-100 shrink-0">
          <ToggleButton />
        </div>
      </div>
    </nav>
  );
}