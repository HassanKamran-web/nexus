"use client";

import { useSearchParams } from "next/navigation";
import ChatWindow from "../components/ChatWindow";
import { Suspense } from "react";

function ChatContent() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId") || "";

  return <ChatWindow fileId={fileId} />;
}

export default function ChatPage() {
  return (
    <div className="py-6 bg-main-bg min-h-screen flex z-99 items-center justify-center">
      <Suspense fallback={<div className="text-white text-lg">Loading Chat...</div>}>
        <ChatContent />
      </Suspense>
    </div>
  );
}