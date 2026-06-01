"use client";

import { useSearchParams } from "next/navigation";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId") || "";

  return (
    <div className="py-6 bg-main-bg  min-h-screen flex z-99 items-center justify-center">
      <ChatWindow fileId={fileId} />
    </div>
  );
}