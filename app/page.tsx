"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import NexusPreview from "./components/NexusPreview";
import Navbar from "./components/Navbar";

export default function Home() {
  const { data: session, status } = useSession();


  return (
    <main className="bg-main-bg text-text-main min-h-screen flex flex-col items-center overflow-x-hidden">
      <Navbar />


      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-primary opacity-20 blur-[120px] pointer-events-none" />

      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 rounded-full border border-border-ui text-subtext text-sm font-medium mb-6 inline-block bg-main-bg/50 backdrop-blur-sm">
            Revolutionize your PDF reading experience
          </span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">
            Chat with any <span className="text-primary">PDF</span> <br />
            using Nexus AI.
          </h1>

          <p className="text-subtext text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Nexus allows you to extract information, summarize documents, and get
            instant answers from your PDF files using advanced AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {
              status !== "loading" && (
                session ? (
                  <Link href={'/dashboard'}
                    className="bg-primary hover:opacity-90 cursor-pointer text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
                  >
                    Dashboard
                  </Link>
                ) : (

                  <button
                    onClick={() => signIn("google")}
                    className="bg-primary hover:opacity-90 cursor-pointer text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
                  >
                    Get Started for Free
                  </button>
                )
              )
            }
            <Link
              href="#features"
              className="px-10 py-4 rounded-full border border-border-ui font-bold hover:bg-border-ui/30 transition-all text-text-main"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 relative rounded-3xl border border-border-ui bg-main-bg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] max-w-5xl mx-auto overflow-hidden group "
        >
          <NexusPreview />

          <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
      </section>

      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Instant Search",
              desc: "No more scrolling. Ask your PDF where a specific detail is and get it instantly."
            },
            {
              title: "AI Summaries",
              desc: "Get a concise summary of 50+ page documents in seconds with key takeaways."
            },
            {
              title: "Cited Answers",
              desc: "Every answer comes with specific references and page numbers from the original document."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-3xl border-2 border-border-ui bg-main-bg/50 hover:bg-main-bg hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <div className="w-5 h-5 bg-primary rounded-sm" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-subtext leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-10 text-subtext text-sm opacity-50">
        © 2026 Nexus AI Automation. Built for Muhammad Hassan Kamran.
      </footer>
    </main>
  );
}