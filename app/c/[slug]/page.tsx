"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Step =
  | "loading"
  | "intro"
  | "recording"
  | "review"
  | "success"
  | "playback";

type ExistingMessage = {
  audio_url: string;
  sender_name: string | null;
  note: string | null;
};

export default function MessagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState("");
  const [step, setStep] = useState<Step>("loading");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [existingMessage, setExistingMessage] =
    useState<ExistingMessage | null>(null);

  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const load = async () => {
      const resolved = await params;
      setSlug(resolved.slug);
    };
    load();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const checkExisting = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("audio_url, sender_name, note")
        .eq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingMessage>();

      if (error) {
        console.error("Error checking existing message:", error);
        setStep("intro");
        return;
      }

      if (data) {
        setExistingMessage(data);
        setAudioUrl(data.audio_url);
        setStep("playback");
      } else {
        setStep("intro");
      }
    };

    checkExisting();
  }, [slug]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const localUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(localUrl);
        setStep("review");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStep("recording");
    } catch (error) {
      console.error("Mic error:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const saveMessage = async () => {
    if (!audioBlob || !slug) return;

    try {
      const filePath = `${slug}-${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(filePath, audioBlob, {
          contentType: "audio/webm",
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("messages")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("messages").insert({
        slug,
        audio_url: publicUrlData.publicUrl,
        sender_name: senderName.trim() || null,
        note: note.trim() || null,
      });

      if (insertError) throw insertError;

      const saved: ExistingMessage = {
        audio_url: publicUrlData.publicUrl,
        sender_name: senderName.trim() || null,
        note: note.trim() || null,
      };

      setExistingMessage(saved);
      setAudioUrl(saved.audio_url);
      setStep("success");
    } catch (error) {
      console.error("Save error:", error);
      alert("There was a problem saving your message.");
    }
  };

  if (step === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-stone-200" />
          <p className="text-sm text-stone-500">Loading your message...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-stone-400">
            EchoNote
          </p>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl">
                  💛
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                  Leave a message
                </h1>
                <p className="text-sm leading-6 text-stone-500">
                  Record something they can hear when they scan this.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Your name (optional)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-900"
                />

                <input
                  placeholder="Add a short note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-900"
                />
              </div>

              <button
                onClick={startRecording}
                className="w-full rounded-2xl bg-stone-900 px-6 py-3.5 text-base font-medium text-white transition hover:opacity-95"
              >
                Start recording
              </button>
            </div>
          )}

          {step === "recording" && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
                  🎙️
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                    Recording…
                  </h1>
                  <p className="text-sm text-stone-500">
                    Tap below when you’re ready to stop.
                  </p>
                </div>

                {senderName && (
                  <p className="text-lg font-semibold text-stone-900">
                    From {senderName}
                  </p>
                )}

                {note && (
                  <p className="text-base italic text-stone-600">
                    “{note}”
                  </p>
                )}
              </div>

              <button
                onClick={stopRecording}
                className="w-full rounded-2xl bg-red-500 px-6 py-3.5 text-base font-medium text-white transition hover:bg-red-600"
              >
                Stop recording
              </button>
            </div>
          )}

          {step === "review" && audioUrl && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-2xl">
                  🎧
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                    Review your message
                  </h1>
                  <p className="text-sm text-stone-500">
                    Give it one last listen before saving.
                  </p>
                </div>

                {senderName && (
                  <p className="text-lg font-semibold text-stone-900">
                    From {senderName}
                  </p>
                )}

                {note && (
                  <p className="text-base italic text-stone-600">
                    “{note}”
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <audio controls src={audioUrl} className="w-full" />
              </div>

              <div className="space-y-3">
                <button
                  onClick={saveMessage}
                  className="w-full rounded-2xl bg-stone-900 px-6 py-3.5 text-base font-medium text-white transition hover:opacity-95"
                >
                  Save message
                </button>

                <button
                  onClick={startRecording}
                  className="w-full rounded-2xl border border-stone-300 px-6 py-3.5 text-base font-medium text-stone-900 transition hover:bg-stone-50"
                >
                  Re-record
                </button>
              </div>
            </div>
          )}

          {step === "success" && existingMessage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-2xl">
                  ✨
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                    It’s ready
                  </h1>
                  <p className="text-sm text-stone-500">
                    They’ll hear your voice when they scan it.
                  </p>
                </div>

                {existingMessage.sender_name && (
                  <p className="text-xl font-semibold text-stone-900">
                    From {existingMessage.sender_name}
                  </p>
                )}

                {existingMessage.note && (
                  <p className="text-base italic text-stone-600">
                    “{existingMessage.note}”
                  </p>
                )}
              </div>

              <button
                onClick={() => setStep("playback")}
                className="w-full rounded-2xl bg-stone-900 px-6 py-3.5 text-base font-medium text-white transition hover:opacity-95"
              >
                Preview message
              </button>
            </div>
          )}

          {step === "playback" && existingMessage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-2xl">
                  💌
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-400">
                    You received a voice message
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                    A message is waiting for you
                  </h1>
                </div>

                {existingMessage.sender_name && (
                  <p className="text-xl font-semibold text-stone-900">
                    From {existingMessage.sender_name}
                  </p>
                )}

                {existingMessage.note && (
                  <p className="text-base italic text-stone-600">
                    “{existingMessage.note}”
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <audio
                  controls
                  src={existingMessage.audio_url}
                  className="w-full"
                />
              </div>

              <p className="text-center text-xs uppercase tracking-[0.22em] text-stone-400">
                EchoNote
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}