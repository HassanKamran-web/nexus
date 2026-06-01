"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare, Pencil, Trash2, Check, Plus, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Message { id: string; role: "user" | "assistant"; content: string; }
interface ChatSession { id: string; fileId: string; title: string; }
interface ChatWindowProps { fileId: string; }

export default function ChatWindow({ fileId: initialFileId }: ChatWindowProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>(initialFileId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [savedrename, setSavedrename] = useState(false)
  const [deletesession, setDeletesession] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        setIsSessionsLoading(true);
        const pageTitle = "PDF Discussion";
        
        const url = initialFileId 
          ? `/api/chat/sessions?fileId=${initialFileId}&title=${encodeURIComponent(pageTitle)}`
          : `/api/chat/sessions`;

        const res = await fetch(url);
        if(!res.ok) throw new Error("Server responsed with an error status.");
        const data = await res.json();
        if (res.ok && data.sessions) {
          setSessions(data.sessions);
          
          if (initialFileId) {
            const currentFileSession = data.sessions.find((s: ChatSession) => s.fileId === initialFileId);
            if (currentFileSession) {
              setCurrentSessionId(currentFileSession.id);
              setActiveFileId(currentFileSession.fileId);
            }
          } else if (data.sessions.length > 0 && !currentSessionId) {
            setCurrentSessionId(data.sessions[0].id);
            setActiveFileId(data.sessions[0].fileId);
          }
        }
      } catch (err: any) {
        console.error("Failed to load sessions:", err);
        toast.error(err.message || "Something went wrong while loading sessions.");
      } finally { 
        setIsSessionsLoading(false);
       }
    };
    fetchAllSessions();
  }, [initialFileId]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentSessionId) return;
      try {
        setIsHistoryLoading(true);
        const res = await fetch(`/api/chat?sessionId=${currentSessionId}`);
        if(!res.ok) throw new Error("Server responsed with an error status.");
        const data = await res.json();
        if (res.ok && data.history) {
          setMessages(data.history.length > 0 ? data.history : [{
            id: "welcome", role: "assistant", content: "I've reviewed your PDF. Feel free to ask any questions you have!.",
          }]);
        }
      } catch (err: any) {
         console.error("Failed to load chat history:", err); 
         toast.error(err.message || "Something went wrong while loading chat history.");
        } finally { setIsHistoryLoading(false); }
    };
    fetchChatHistory();
  }, [currentSessionId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) return setEditingSessionId(null);
    try {
      setSavedrename(true)
      const res = await fetch("/api/chat/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, title: editTitle.trim() }),
      });
      if(!res.ok) throw new Error("Server responsed with an error status.");
      if (res.ok) {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim() } : s)));
      }
    } catch (err: any) { 
      console.error("Failed to save session title:", err); 
      toast.error(err.message || "Something went wrong while saving the session title.");
    }finally {
      setSavedrename(false);
    }
    setEditingSessionId(null);
  }

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletesession(true);
    try {
      const res = await fetch(`/api/chat/sessions?sessionId=${id}`, { method: "DELETE" });
      if(!res.ok) throw new Error("Server responsed with an error status.");
      if (res.ok) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (currentSessionId === id) {
          if (remaining.length > 0) {
            setCurrentSessionId(remaining[0].id);
            setActiveFileId(remaining[0].fileId);
          } else {
            setCurrentSessionId(null);
            setMessages([]);
          }
        }
      }
    } catch (err: any) { 
      console.error("Failed to delete session:", err); 
      toast.error(err.message || "Something went wrong while deleting the session.");
    }finally{
      setDeletesession(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, fileId: activeFileId, sessionId: currentSessionId }),
      });
      if(!response.ok) throw new Error("Server responsed with an error status.");
      const data = await response.json();
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: data.text || "No response generated." }]);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error(error.message || "Something went wrong while sending the message.");
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "⚠️ Error, try again." }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-150 w-full max-w-5xl mx-auto border-2 border-border-ui bg-main-bg rounded-3xl overflow-hidden shadow-2xl relative">
      
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-main-bg border-r-2 border-border-ui flex flex-col p-4 transition-transform duration-300 transform 
        md:relative md:transform-none md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        <div className="flex items-center justify-between md:hidden mb-4">
          <span className="text-xs font-bold uppercase text-subtext tracking-wider">Navigation</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full border border-border-ui text-text-main">
            <X size={16} />
          </button>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center cursor-pointer justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 mb-4 shrink-0"
        >
          <Plus size={16} />
          <span>Add New PDF</span>
        </button>

        <div className="text-[11px] font-bold text-subtext uppercase tracking-widest px-1 mb-2">Recent PDF Chats</div>
        
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {isSessionsLoading ? (
            <div className="text-xs text-subtext text-center py-4 animate-pulse">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-xs text-subtext text-center py-4 px-2">No active sessions found. Upload a PDF to start!</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => { 
                  if(editingSessionId !== session.id) { 
                    setCurrentSessionId(session.id); 
                    setActiveFileId(session.fileId);
                    setIsSidebarOpen(false); 
                  } 
                }}
                className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                  currentSessionId === session.id 
                    ? "bg-primary/10 text-primary border-primary/30" 
                    : "text-text-main hover:bg-border-ui/30 border-transparent"
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={(e)=>e.stopPropagation()}>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={(e)=>setEditTitle(e.target.value)}
                      className="bg-main-bg text-text-main text-xs px-2 py-1 rounded-lg border-2 border-border-ui w-full focus:outline-none focus:border-primary"
                    />{
                      savedrename ? (
                        <Loader2 size={14} className="animate-spin text-primary" />
                      ) : (
                        <button onClick={() => saveRename(session.id)} className="text-primary cursor-pointer hover:text-primary/70 transition-all ease-in duration-150 p-0.5"><Check size={14}/></button>
                      )
                    }
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare size={14} className="shrink-0 text-primary" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditTitle(session.title); }} className="p-1 text-subtext hover:text-text-main"><Pencil size={12} /></button>
                      {
                        deletesession ? (
                          <Loader2 size={14} className="animate-spin text-primary" />
                        ) : (
                          <button onClick={(e) => {handleDeleteSession(e, session.id)}} className="p-1 text-subtext hover:text-red-500 cursor-pointer transition-all ease-in duration-150"><Trash2 size={12} /></button>
                        )
                      }
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col bg-main-bg">
        
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b-2 border-border-ui backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 border-2 border-border-ui rounded-xl text-text-main md:hidden hover:bg-border-ui/40"
            >
              <Menu size={18} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-text-main text-sm uppercase tracking-wider">Nexus Core Engine</h3>
              <p className="text-[10px] font-bold text-subtext uppercase tracking-widest">{currentSessionId ? "Sync Active" : "Standby Mode"}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {!currentSessionId ? (
            <div className="text-subtext text-center text-xs font-bold md:text-sm py-20 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
              Please select a discussion thread from the sidebar or link a new document to execute AI processing.
            </div>
          ) : isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-subtext text-xs font-bold uppercase tracking-widest">
              <Loader2 className="animate-spin text-primary" size={20} />
              <span>Fetching Core Logs...</span>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2.5 max-w-[90%] md:max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`p-2 rounded-xl shrink-0 border border-border-ui ${msg.role === "user" ? "bg-primary text-white" : "bg-border-ui/40 text-text-main"}`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm font-medium whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-border-ui/20 text-text-main border border-border-ui rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-2.5 max-w-[80%] mr-auto">
              <div className="p-2 border border-border-ui rounded-xl bg-border-ui/40 text-text-main shrink-0">
                <Bot size={14} />
              </div>
              <div className="px-4 py-2.5 bg-border-ui/20 border border-border-ui text-text-main rounded-2xl rounded-tl-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Loader2 size={12} className="animate-spin text-primary" /> 
                <span>Nexus is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t-2 border-border-ui bg-main-bg/50 flex gap-2 items-center">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask anything about the system document..." 
            disabled={isLoading || isHistoryLoading || !currentSessionId} 
            className="flex-1 bg-main-bg border-2 border-border-ui text-text-main rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-50" 
          />
          <button 
            type="submit" 
            disabled={isLoading || isHistoryLoading || !input.trim() || !currentSessionId} 
            className="p-3 bg-primary text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer shrink-0 shadow-md shadow-primary/10"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}