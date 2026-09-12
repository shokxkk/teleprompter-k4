"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Loader2, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  workflowRunId?: string | null;
  createdAt: string;
}

interface JobStatus {
  id: string;
  type: string;
  status: string;
  resultId?: string | null;
  errorMessage?: string | null;
}

export default function ProducerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeJob, setActiveJob] = useState<JobStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversation();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversation() {
    try {
      const res = await fetch("/api/producer/messages");
      const data = await res.json();
      if (data.conversation) {
        setConversationId(data.conversation.id);
        setMessages(data.conversation.messages ?? []);
      }
    } catch {
      // New conversation
    }
  }

  async function pollJobStatus(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        const job = data.job as JobStatus;

        setActiveJob(job);

        if (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled") {
          clearInterval(pollRef.current!);

          if (job.status === "succeeded" && job.resultId) {
            setMessages((prev) => [
              ...prev,
              {
                id: `result-${job.resultId}`,
                role: "assistant",
                content: `✅ Сценарий готов! [Открыть редактор](/content/${job.resultId})`,
                createdAt: new Date().toISOString(),
              },
            ]);
          } else if (job.status === "failed") {
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${job.id}`,
                role: "assistant",
                content: `❌ Ошибка генерации: ${job.errorMessage ?? "Неизвестная ошибка"}. Попробуйте ещё раз.`,
                createdAt: new Date().toISOString(),
              },
            ]);
          }

          setActiveJob(null);
        }
      } catch {
        // Keep polling
      }
    }, 2000);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/producer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });

      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);
      if (data.isDemoMode !== undefined) setIsDemoMode(data.isDemoMode);

      if (data.message) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          { ...userMsg, id: data.message.id ?? userMsg.id },
          data.message,
        ]);
      }

      if (data.workflowRunId) {
        setActiveJob({ id: data.workflowRunId, type: "generate_reel", status: "queued" });
        pollJobStatus(data.workflowRunId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Произошла ошибка. Попробуйте ещё раз.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Demo banner */}
      {isDemoMode && (
        <div className="demo-banner">
          🎭 DEMO-режим — ответы от MockProvider
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.1rem", margin: 0 }}>AI-Продюсер</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", margin: 0 }}>
            Задайте вопрос, поделитесь наблюдением или запросите сценарий
          </p>
        </div>
        <button onClick={loadConversation} className="btn btn-ghost btn-icon" title="Обновить">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: "2.5rem" }}>👋</div>
            <h2 style={{ fontSize: "1.1rem", color: "var(--color-text-primary)" }}>Привет! Я ваш AI-продюсер</h2>
            <p style={{ maxWidth: 360, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
              Расскажите о рабочем наблюдении, попросите написать сценарий или задайте вопрос о контент-стратегии.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {[
                "Сегодня увидел: менеджеры не договариваются о следующем звонке",
                "Помоги придумать идеи для Reels на неделю",
                "Что важно для шапки профиля в Instagram?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.8rem" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginRight: "0.5rem",
                marginTop: "0.25rem",
              }}>
                <span style={{ fontSize: "0.7rem" }}>AI</span>
              </div>
            )}
            <div
              className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:inherit;text-decoration:underline">$1</a>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'),
              }}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "white" }}>AI</span>
            </div>
            <div className="chat-bubble chat-bubble-assistant" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.75rem 1rem" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-tertiary)", animation: "pulse-dot 1.4s infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Active job status */}
        {activeJob && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="chat-bubble chat-bubble-assistant" style={{ background: "var(--color-brand-50)", borderColor: "var(--color-brand-200)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-brand-700)" }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                {activeJob.status === "queued" ? "В очереди..." : "Генерирую сценарий..."}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", maxWidth: 800, margin: "0 auto" }}>
          <textarea
            className="input textarea"
            placeholder="Напишите сообщение... (Enter для отправки, Shift+Enter — новая строка)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, minHeight: 44, maxHeight: 120, resize: "none" }}
            rows={1}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ height: 44, flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
