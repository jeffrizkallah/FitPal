"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

const ADVISOR_HINTS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 4V20M18 4V20M3 12H6M18 12H21M6 7H18M6 17H18" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
    label: "Adjust my plan",
    description: "Change exercises, sets, reps, or swap a muscle group",
    prompt: "Can you adjust my current workout plan? I want to ",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#007AFF" strokeWidth="1.75"/>
        <path d="M12 8v4l3 3" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
    label: "Nutrition guidance",
    description: "Macro targets, meal timing, protein intake",
    prompt: "Can you help me with my nutrition? I want to ",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "How to do an exercise",
    description: "Proper form, technique cues, common mistakes",
    prompt: "Can you explain how to properly do ",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" stroke="#007AFF" strokeWidth="1.75"/>
        <path d="M12 8v4M12 16h.01" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
    label: "Work around an injury",
    description: "Safe alternatives and modifications",
    prompt: "I have an injury and need to modify my training. My issue is ",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="16 7 22 7 22 13" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Progress & recovery",
    description: "Plateau advice, rest days, sleep, and recovery",
    prompt: "I feel like I'm not making progress. Can you look at my recent logs and tell me ",
  },
];

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load message history on mount
  useEffect(() => {
    fetch("/api/advisor/messages")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => {
        console.error("Failed to load advisor history:", err);
      })
      .finally(() => setIsLoadingHistory(false));
  }, []);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    // Placeholder for streaming assistant reply
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [input, isSending]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const canSend = input.trim().length > 0 && !isSending;
  const isStreaming = isSending && messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--neuo-bg)",
        zIndex: 10,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "24px 20px 12px",
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#2c2c2c",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Advisor
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(44,44,44,0.55)",
              marginTop: 4,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            AI fitness coach
          </p>
        </div>
        <Link
          href="/advisor/equipment"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 20,
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
            background: "var(--neuo-bg)",
            textDecoration: "none",
            marginTop: 4,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="rgba(44,44,44,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: 12,
              color: "rgba(44,44,44,0.6)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Equipment
          </span>
        </Link>
      </div>

      {/* ── Messages ── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: "auto", padding: "4px 16px 8px" }}
      >
        {/* Empty state */}
        {!isLoadingHistory && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12, marginTop: 20 }}>
            <div
              style={{
                padding: "20px 22px",
                borderRadius: 24,
                boxShadow: "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
                background: "var(--neuo-bg)",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(44,44,44,0.5)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 14px 0",
                }}
              >
                What I can help with
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ADVISOR_HINTS.map((hint) => (
                  <button
                    key={hint.label}
                    onClick={() => setInput(hint.prompt)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "var(--neuo-bg)",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "inset 3px 3px 7px var(--neuo-mid), inset -3px -3px 7px var(--neuo-light)";
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)";
                    }}
                  >
                    <span style={{ lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                      {hint.icon}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2c2c2c", letterSpacing: "-0.01em" }}>
                        {hint.label}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(44,44,44,0.5)", letterSpacing: "0.005em" }}>
                        {hint.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading history skeleton */}
        {isLoadingHistory && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
            {[70, 50, 85].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 42,
                  borderRadius: 20,
                  background: "var(--neuo-mid)",
                  opacity: 0.5,
                  width: `${w}%`,
                  alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
                }}
              />
            ))}
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const showTyping = isLast && msg.role === "assistant" && isStreaming && msg.content.length === 0;
          return (
            <MessageBubble
              key={i}
              message={msg}
              showTypingIndicator={showTyping}
            />
          );
        })}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ── Input area ── */}
      <div style={{ padding: "8px 16px calc(88px + env(safe-area-inset-bottom))", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            padding: "10px 12px 10px 16px",
            borderRadius: 28,
            boxShadow:
              "inset 5px 5px 10px var(--neuo-mid), inset -5px -5px 10px var(--neuo-light)",
            background: "var(--neuo-bg)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 16,
              color: "#2c2c2c",
              letterSpacing: "0.005em",
              lineHeight: 1.5,
              fontFamily: "inherit",
              paddingTop: 5,
              paddingBottom: 5,
              overflowY: "hidden",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: canSend ? "#007AFF" : "var(--neuo-bg)",
              border: "none",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: canSend
                ? "4px 4px 10px rgba(0,122,255,0.3), -2px -2px 8px rgba(255,255,255,0.8)"
                : "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
              transition: "all 0.2s",
              marginBottom: 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20V4M5 11l7-7 7 7"
                stroke={canSend ? "white" : "rgba(44,44,44,0.3)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline markdown renderer ─────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index} style={{ fontWeight: 700 }}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table block — collect consecutive | lines (skip separator rows)
    if (line.trimStart().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter((l) => !/^\s*\|[\s\-:|]+\|\s*$/.test(l));
      if (rows.length > 0) {
        const header = rows[0].split("|").map((c) => c.trim()).filter(Boolean);
        const body = rows.slice(1);
        nodes.push(
          <div key={`table-${i}`} style={{ overflowX: "auto", marginTop: 8, marginBottom: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {header.map((cell, ci) => (
                    <th
                      key={ci}
                      style={{
                        padding: "6px 8px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#2c2c2c",
                        borderBottom: "1px solid var(--neuo-mid)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => {
                  const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}>
                      {cells.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            padding: "5px 8px",
                            color: "#2c2c2c",
                            borderBottom: "1px solid rgba(208,208,208,0.4)",
                          }}
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet list — collect consecutive - lines
    if (/^[\-\*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*] /, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0", paddingLeft: 18 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 3, color: "#2c2c2c", lineHeight: 1.55, fontSize: 15 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      nodes.push(<div key={`br-${i}`} style={{ height: 8 }} />);
      i++;
      continue;
    }

    // Normal paragraph line
    nodes.push(
      <p key={`p-${i}`} style={{ margin: 0, fontSize: 15, color: "#2c2c2c", lineHeight: 1.65, letterSpacing: "0.005em" }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{nodes}</>;
}

function MessageBubble({
  message,
  showTypingIndicator,
}: {
  message: Message;
  showTypingIndicator: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "11px 15px",
          borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
          boxShadow: isUser
            ? "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)"
            : "6px 6px 12px var(--neuo-dark), -6px -6px 12px var(--neuo-light)",
          background: "var(--neuo-bg)",
        }}
      >
        {showTypingIndicator ? (
          <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="dot-bounce"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        ) : isUser ? (
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: "#2c2c2c",
              lineHeight: 1.65,
              letterSpacing: "0.005em",
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
          </p>
        ) : (
          <div style={{ fontSize: 15, color: "#2c2c2c" }}>
            {renderMarkdown(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}
