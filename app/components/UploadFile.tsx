"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiFile, FiCheckCircle } from "react-icons/fi";
import { useUploadThing } from "@/lib/uploadthing";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function UploadFile({ onUploadSuccess }: { onUploadSuccess: (id: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const { startUpload } = useUploadThing("pdfUploader", {
    onClientUploadComplete: async (res) => {
      const fileUrl = res?.[0]?.ufsUrl; 

      if (!fileUrl) {
        toast.error("Cloud upload failed or URL not found.");
        return;
      }

      try {
        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: JSON.stringify({ fileUrl }),
          headers: { "Content-Type": "application/json" },
        });

        const parseData = await response.json();
        
        if (!response.ok || !parseData.text) {
          throw new Error(parseData.error || "Parsing failed");
        }

        const fileId = `file-${crypto.randomUUID()}`;

        const vectorResponse = await fetch("/api/vectorize", {
          method: "POST",
          body: JSON.stringify({
            text: parseData.text,
            fileId: fileId,
            fileName: file?.name || "Document.pdf",
            fileUrl: fileUrl,
            userId: (session?.user as any)?.id,
          }),
          headers: { "Content-Type": "application/json" },
        });

        const vectorData = await vectorResponse.json();

        if (vectorResponse.ok) {
          toast.success("Memory Saved! Opening chat window...");
          onUploadSuccess(fileId);
          // Redirect to our clean global path
          router.push(`/chat?fileId=${fileId}`);
        } else {
          throw new Error(vectorData.error || "Vector storage failed");
        }

      } catch (err: any) {
        console.error(" Process failed:", err);
        toast.error(err.message || "Something went wrong during processing.");
      }
    },
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      await startUpload([file]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative overflow-hidden shadow bg-main-bg border-2 border-border-ui rounded-3xl p-1 transition-all duration-300 ${isDragging ? "border-primary ring-4 ring-primary/10" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-main-bg rounded-[22px] p-8 h-full flex flex-col items-center justify-center border border-border-ui">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30">
                <FiUploadCloud size={30} />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Upload Document</h3>
              <p className="text-subtext text-sm mb-6">Drag & drop your PDF here</p>

              <label className="bg-primary text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-[10px] text-subtext mt-4 uppercase tracking-widest font-bold">Max size: 64MB</p>
            </motion.div>
          ) : (
            <motion.div
              key="file-state"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-full bg-border-ui/30 p-4 rounded-2xl flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                  <FiFile size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-text-main font-bold truncate text-sm">{file.name}</p>
                  <p className="text-subtext text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <FiCheckCircle className="text-primary" size={20} />
              </div>

              <button
                disabled={isLoading}
                className={`w-full ${isLoading ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 cursor-pointer active:scale-95"} text-white py-3 rounded-xl font-bold transition-all`}
                onClick={() => handleAnalyze()}
              >
                {isLoading ? "Analyzing..." : "Start AI Analysis"}
              </button>

              <button
                onClick={() => setFile(null)}
                className="mt-4 text-subtext text-sm font-semibold hover:text-text-main cursor-pointer"
              >
                Remove file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}