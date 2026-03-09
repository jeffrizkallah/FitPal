"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";

// ─── Types ─────────────────────────────────────────────────

type Phase =
  | "booting"          // initial mount, typing greeting
  | "awaiting_bio"     // waiting for height/weight/goal
  | "processing_bio"   // parsing biometrics
  | "bio_retry"        // parse failed, retry
  | "awaiting_equip"   // waiting for gym photo or skip
  | "processing_equip" // scanning equipment image
  | "generating"       // generating weekly plan
  | "handoff";         // plan ready, slide animation

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  typing?: boolean; // true while AI is still printing
}

interface DayPlan {
  day_index: number;
  label: string;
  exercises: { name: string }[];
}

// ─── Script ────────────────────────────────────────────────

const MSG_GREETING =
  "Forma is online. I'll build your first week in about 60 seconds. Give me a bit of info so the plan is actually tailored to you: \n\n1. Age, height, weight\n2. Your main goal; lose fat, build muscle, maintain, endurance, or something specific like recovering from an injury or training for a race\n3. How many days per week you want to train; be honest, there's no wrong answer\n4. Your current activity level; sedentary, lightly active, moderately active, or very active\n5. Anything else I should know; injuries, areas you want to focus on, things you want to avoid\n\nThrow it all in one message, however you want to write it.";

const MSG_EQUIPMENT =
  "Logged. Now, the environment scan. Send a photo of your gym and I'll identify the equipment so you don't have to manually check boxes for every cable machine and dumbbell rack in the building. This is optional, most useful if you have limited equipment or train at home. Skip it if you're at a fully-equipped commercial gym.";

const MSG_COMPLETE_PHOTO =
  "Inventory synced. I've mapped your first week based on exactly what's on your gym floor. I'll handle the volume calculations and calorie math; you just focus on the movement. I'm moving your first session to the next tab now. We're done here.";

const MSG_COMPLETE_SKIP =
  "Working with a standard setup. I've mapped your first week with a full-equipment split. I'll handle the volume calculations and calorie math; you just focus on the movement. I'm moving your first session to the next tab now. We're done here.";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Component ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("booting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<string>("");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number | null>(null);
  // Accumulate all bio attempts so retries always send full context
  const bioHistory = useRef<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTyping = useRef<(() => void) | null>(null);

  // ── Scroll to bottom on new messages ──────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Type an AI message character by character ──────────────
  const typeMessage = useCallback((content: string): Promise<void> => {
    // Cancel any in-progress typing first
    cancelTyping.current?.();

    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      let cancelled = false;

      cancelTyping.current = () => {
        cancelled = true;
        if (typingTimer.current) clearTimeout(typingTimer.current);
        // Remove the incomplete bubble so it doesn't stay stuck
        setMessages((prev) => prev.filter((m) => m.id !== id));
        resolve();
      };

      // Add empty bubble immediately (shows typing cursor)
      setMessages((prev) => [
        ...prev,
        { id, role: "ai", content: "", typing: true },
      ]);

      let i = 0;

      const tick = () => {
        if (cancelled) return;
        i++;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, content: content.slice(0, i), typing: i < content.length }
              : m
          )
        );

        if (i < content.length) {
          typingTimer.current = setTimeout(tick, 10);
        } else {
          cancelTyping.current = null;
          resolve();
        }
      };

      // Short thinking pause before first character
      typingTimer.current = setTimeout(tick, 350);
    });
  }, []);

  // ── Add instant user message ───────────────────────────────
  const addUser = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
  };

  // ── Boot: show greeting ────────────────────────────────────
  useEffect(() => {
    typeMessage(MSG_GREETING).then(() => setPhase("awaiting_bio"));
    return () => {
      cancelTyping.current?.();
    };
  }, [typeMessage]);

  // ── Submit biometrics ──────────────────────────────────────
  const handleBioSubmit = async () => {
    const text = inputText.trim();
    if (!text || phase !== "awaiting_bio") return;

    setInputText("");
    addUser(text);
    setPhase("processing_bio");

    // Accumulate all attempts so the model always has full context on retries
    bioHistory.current.push(text);
    const combinedMessage = bioHistory.current.join("\n");

    try {
      const res = await fetch("/api/onboarding/parse-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: combinedMessage }),
      });
      const data = await res.json();

      if (!data.success) {
        await typeMessage(
          data.error ?? "Couldn't read that. Try something like: '28 years old, 175cm, 80kg, recovering from knee injury, light activity'"
        );
        setPhase("awaiting_bio");
      } else {
        if (data.userContext) setUserContext(data.userContext);
        if (data.workoutsPerWeek) setWorkoutsPerWeek(data.workoutsPerWeek);
        await typeMessage(MSG_EQUIPMENT);
        setPhase("awaiting_equip");
      }
    } catch {
      await typeMessage("Something went wrong. Please try again.");
      setPhase("awaiting_bio");
    }
  };

  // ── Image selection ────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit gym photo ───────────────────────────────────────
  const handleEquipSubmit = async () => {
    if (!imageFile || !imagePreview) return;

    addUser("Gym photo uploaded.");
    setImageFile(null);
    setImagePreview(null);
    setPhase("processing_equip");

    const base64 = imagePreview.split(",")[1];
    const mediaType = (imageFile.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    // Scan equipment
    const scanRes = await fetch("/api/advisor/equipment/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mediaType }),
    }).catch(() => null);

    if (scanRes?.ok) {
      const items: { name: string; category: string }[] = await scanRes.json().catch(() => []);
      // Save each identified piece of equipment
      await Promise.allSettled(
        items.map((item) =>
          fetch("/api/advisor/equipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
        )
      );
    }

    await runGeneratePlan(true);
  };

  // ── Skip equipment scan ────────────────────────────────────
  const handleSkipEquip = async () => {
    addUser("Skip. Using standard gym setup.");
    setPhase("generating");
    await runGeneratePlan(false);
  };

  // ── Generate plan & trigger handoff ───────────────────────
  const runGeneratePlan = async (hadPhoto: boolean) => {
    setPhase("generating");

    const res = await fetch("/api/onboarding/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userContext, workoutsPerWeek }),
    });
    const data = await res.json();

    if (!data.success) {
      // Fallback: just complete onboarding and go to dashboard
      router.push("/");
      return;
    }

    setWeekPlan(data.plan.days as DayPlan[]);

    await typeMessage(hadPhoto ? MSG_COMPLETE_PHOTO : MSG_COMPLETE_SKIP);

    // Short pause, then haptic + slide
    await new Promise<void>((r) => setTimeout(r, 900));
    haptic.handoff();
    setPhase("handoff");
  };

  // ── Auto-redirect after handoff ────────────────────────────
  useEffect(() => {
    if (phase !== "handoff") return;
    const t = setTimeout(() => router.push("/workout"), 4500);
    return () => clearTimeout(t);
  }, [phase, router]);

  // ── Textarea auto-height ───────────────────────────────────
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const isInputPhase = phase === "awaiting_bio" || phase === "bio_retry";
  const isEquipPhase = phase === "awaiting_equip";
  const isProcessing =
    phase === "processing_bio" ||
    phase === "processing_equip" ||
    phase === "generating";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{ backgroundColor: "var(--neuo-bg)" }}
    >
      <AnimatePresence mode="wait">
        {phase !== "handoff" ? (
          /* ─── Chat View ─────────────────────────────── */
          <motion.div
            key="chat"
            className="absolute inset-0 flex flex-col"
            exit={{
              x: "-100%",
              transition: { duration: 0.48, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            {/* Header */}
            <div className="pt-safe px-6 pt-10 pb-3 flex items-center">
              <p
                className="section-label"
                style={{ letterSpacing: "0.12em", fontSize: "11px" }}
              >
                Setup
              </p>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 no-scrollbar">
              <div className="flex flex-col gap-4 py-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Processing dots */}
                {isProcessing && (
                  <div className="flex items-center gap-3 px-1">
                    <div
                      className="flex gap-1.5 items-center px-4 py-3 rounded-2xl"
                      style={{
                        backgroundColor: "var(--neuo-bg)",
                        boxShadow:
                          "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="dot-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-text-secondary"
                      style={{ fontSize: "13px", letterSpacing: "0.01em" }}
                    >
                      {phase === "generating"
                        ? "Building your plan..."
                        : "Analyzing..."}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input zone */}
            <div
              className="px-4 pb-safe"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            >
              {/* Equipment step UI */}
              {isEquipPhase && (
                <div className="flex flex-col gap-3 pb-1">
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative rounded-3xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Gym preview"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3.5 rounded-3xl font-medium text-text-primary"
                      style={{
                        fontSize: "14px",
                        backgroundColor: "var(--neuo-bg)",
                        boxShadow:
                          "6px 6px 12px var(--neuo-mid), -6px -6px 12px var(--neuo-light)",
                      }}
                    >
                      {imagePreview ? "Retake" : "Take Photo"}
                    </button>

                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 py-3.5 rounded-3xl font-medium text-text-primary"
                      style={{
                        fontSize: "14px",
                        backgroundColor: "var(--neuo-bg)",
                        boxShadow:
                          "6px 6px 12px var(--neuo-mid), -6px -6px 12px var(--neuo-light)",
                      }}
                    >
                      Upload
                    </button>

                    <button
                      onClick={handleSkipEquip}
                      className="py-3.5 px-4 rounded-3xl font-medium text-text-secondary"
                      style={{
                        fontSize: "14px",
                        backgroundColor: "var(--neuo-bg)",
                        boxShadow:
                          "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
                      }}
                    >
                      Skip
                    </button>
                  </div>

                  {imagePreview && (
                    <button
                      onClick={handleEquipSubmit}
                      className="btn-primary w-full"
                    >
                      Use this photo
                    </button>
                  )}

                  {/* Camera input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {/* Gallery input (no capture) */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              )}

              {/* Biometrics text input */}
              {isInputPhase && (
                <div className="flex gap-2 items-center">
                  <textarea
                    ref={textareaRef}
                    className="flex-1 input-field resize-none"
                    style={{
                      minHeight: "52px",
                      maxHeight: "120px",
                      lineHeight: "1.5",
                    }}
                    placeholder="28yo, 175cm, 80kg, build muscle..."
                    value={inputText}
                    onChange={handleTextareaInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleBioSubmit();
                      }
                    }}
                    rows={1}
                    autoFocus
                  />

                  <button
                    onClick={handleBioSubmit}
                    disabled={!inputText.trim()}
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-35 flex-shrink-0"
                    style={{
                      backgroundColor: "#007AFF",
                      boxShadow:
                        "6px 6px 14px rgba(0,0,0,0.18), -3px -3px 10px rgba(255,255,255,0.35)",
                    }}
                  >
                    <SendIcon />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ─── Handoff / Week Plan View ──────────────── */
          <motion.div
            key="handoff"
            className="absolute inset-0 flex flex-col px-5"
            initial={{ x: "100%" }}
            animate={{
              x: 0,
              transition: { duration: 0.48, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            {/* Header */}
            <div className="pt-safe pt-14 pb-6">
              <p
                className="section-label mb-2"
                style={{ letterSpacing: "0.12em", fontSize: "11px" }}
              >
                Week 1
              </p>
              <h1
                className="font-bold text-text-primary"
                style={{
                  fontSize: "clamp(28px, 8vw, 38px)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Your plan is ready.
              </h1>
            </div>

            {/* Day cards */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col gap-3 pb-6">
                {weekPlan?.map((day) => (
                  <DayCard key={day.day_index} day={day} />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              className="pt-4 pb-safe"
              style={{
                paddingBottom: "max(32px, env(safe-area-inset-bottom))",
              }}
            >
              <button
                onClick={() => router.push("/workout")}
                className="btn-primary w-full"
              >
                Start training
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAI = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isAI ? "justify-start" : "justify-end"} px-1`}
    >
      <div
        className="max-w-[84%] px-4 py-3 text-body leading-relaxed"
        style={{
          backgroundColor: isAI ? "var(--neuo-bg)" : "#007AFF",
          color: isAI ? "#2c2c2c" : "#ffffff",
          boxShadow: isAI
            ? "5px 5px 12px var(--neuo-mid), -5px -5px 12px var(--neuo-light)"
            : "none",
          letterSpacing: "0.005em",
          borderRadius: isAI ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
        {/* Blinking cursor while typing */}
        {message.typing && message.content.length > 0 && (
          <span
            className="inline-block w-0.5 ml-0.5 align-middle animate-pulse"
            style={{
              height: "1em",
              backgroundColor: isAI ? "#2c2c2c" : "#ffffff",
              opacity: 0.6,
            }}
          />
        )}
        {/* Bounce dots for empty bubble at start */}
        {message.typing && message.content.length === 0 && (
          <span className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dot-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Day Card ──────────────────────────────────────────────

function DayCard({ day }: { day: DayPlan }) {
  const isRest = day.exercises.length === 0;
  const dayName = DAY_NAMES[day.day_index] ?? `Day ${day.day_index + 1}`;

  return (
    <div
      className="flex items-center px-5 py-4 rounded-3xl"
      style={{
        backgroundColor: "var(--neuo-bg)",
        boxShadow: isRest
          ? "inset 5px 5px 10px var(--neuo-dark), inset -5px -5px 10px var(--neuo-light)"
          : "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
      }}
    >
      {/* Day label */}
      <div className="w-10 flex-shrink-0">
        <p
          className="text-text-secondary uppercase"
          style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {dayName}
        </p>
      </div>

      {/* Divider */}
      <div
        className="w-px h-6 mx-4 flex-shrink-0"
        style={{ backgroundColor: "var(--neuo-mid)" }}
      />

      {/* Workout info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold truncate ${
            isRest ? "text-text-secondary" : "text-text-primary"
          }`}
          style={{ fontSize: "15px" }}
        >
          {day.label}
        </p>
        {!isRest && (
          <p
            className="text-text-secondary mt-0.5"
            style={{ fontSize: "12px" }}
          >
            {day.exercises.length} exercise
            {day.exercises.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Active indicator */}
      {!isRest && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#007AFF" }}
        />
      )}
    </div>
  );
}

// ─── Send Icon ─────────────────────────────────────────────

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
