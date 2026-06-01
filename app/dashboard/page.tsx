"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import UploadFile from "../components/UploadFile";
import Navbar from "../components/Navbar";
import ChatWindow from "../components/ChatWindow";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const {data: session} = useSession();

  return (
    <div className="min-h-screen bg-main-bg pt-18  ">
      <Navbar />
      <div className="max-w-6xl mx-auto">

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl text-center font-bold text-text-main tracking-tight">
            Welcome back, <span className="text-primary">{session?.user?.name}</span>
          </h1>
          <p className="text-subtext mt-1 text-center ">Manage your documents and start new conversations.</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:rounded-xl p-2 lg:p-8  lg:grid-cols-2 gap-8 items-start">
          
          <UploadFile onUploadSuccess={(id) => setActiveFileId(id)} />

          <AnimatePresence mode="wait">
            {!activeFileId ? (
              <motion.div
                key="start-chat-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-main-bg border-2 border-dashed border-border-ui rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <HiOutlineChatBubbleLeftRight size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-2">Start a Chat</h3>
                <p className="text-subtext text-sm max-w-62.5 mb-6">
                  Once your PDF is uploaded, click on it to start asking questions.
                </p>
                <button className="px-6 py-2.5 bg-border-ui text-text-main rounded-xl font-semibold opacity-50 cursor-not-allowed">
                  Waiting for PDF...
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="chat-window-active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}