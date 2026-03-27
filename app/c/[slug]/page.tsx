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

type CardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ExistingMessage = {
  audio_url: string;
  sender_name: string | null;
  note: string | null;
};

export default function CardPage({ params }: CardPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [step, setStep] = useState<Step>("loading");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");

  const [savedSenderName, setSavedSenderName] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const checkForExistingMessage = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("audio_url, sender_name, note")
        .eq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingMessage>();

      if (error) {
        console.error("Error checking message:", error);
        setStep("intro");
        return;
      }

      if (data?.audio_url) {
        setAudioUrl(data.audio_url);
        setSavedSenderName(data.sender_name ?? null);
        setSavedNote(data.note ?? null);
        setStep("playback");
      } else {
        setStep("intro");
      }
    };

    checkForExistingMessage();
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
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      alert("Microphone access was denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveMessage = async () => {
    if (!audioBlob || !slug) return;

    setIsSaving(true);

    try {
      const fileName = `${slug}-${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("messages").getPublicUrl(fileName);

      const cleanedName = senderName.trim();
      const cleanedNote = note.trim();

      const { error: insertError } = await supabase.from("messages").insert({
        slug,
        audio_url: data.publicUrl,
        sender_name: cleanedName || null,
        note: cleanedNote || null,
      });

      if (insertError) throw insertError;

      setSavedSenderName(cleanedName || null);
      setSavedNote(cleanedNote || null);
      setAudioUrl(data.publicUrl);
      setStep("success");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving message");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-gray-300" />
          <p className="text-gray-700">Loading your message...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center">
          <p className="text-xs tracking-widest text-gray-500">EchoNote</p>
        </div>

        <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Code: {slug}
            </p>
          </div>

          {step === "intro" && (
            <>
              <h1 className="text-center text-2xl font-semibold text-gray-900">
                Leave a message
              </h1>

              <input
                placeholder="Your name (optional)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 p-3 text-gray-900 placeholder:text-gray-500"
              />

              <input
                placeholder="Add a short note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 p-3 text-gray-900 placeholder:text-gray-500"
              />

              <button
                onClick={() => setStep("recording")}
                className="w-full rounded-2xl bg-black p-3 text-white"
              >
                Record message
              </button>
            </>
          )}

          {step === "recording" && (
            <>
              <h1 className="text-center text-2xl font-semibold text-gray-900">
                Recording
              </h1>

              {senderName && (
                <p className="text-center text-xl font-semibold text-gray-900">
                  From {senderName}
                </p>
              )}

              {note && (
                <p className="text-center italic text-gray-700">
                  “{note}”
                </p>
              )}

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full rounded-2xl bg-black p-3 text-white"
              >
                {isRecording ? "Stop" : "Start"}
              </button>

              <button
                disabled={!audioUrl}
                onClick={() => setStep("review")}
                className={`w-full rounded-2xl p-3 ${
                  audioUrl
                    ? "bg-black text-white"
                    : "border border-gray-300 text-gray-500"
                }`}
              >
                Continue
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <h1 className="text-center text-2xl font-semibold text-gray-900">
                Review your message
              </h1>

              {senderName && (
                <p className="text-center text-xl font-semibold text-gray-900">
                  From {senderName}
                </p>
              )}

              {note && (
                <p className="text-center italic text-gray-700">
                  “{note}”
                </p>
              )}

              {audioUrl && <audio controls src={audioUrl} className="w-full" />}

              <button
                onClick={saveMessage}
                disabled={isSaving}
                className="w-full rounded-2xl bg-black p-3 text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}

          {step === "success" && (
            <>
              <h1 className="text-center text-2xl font-semibold text-gray-900">
                Saved
              </h1>

              {savedSenderName && (
                <p className="text-center text-xl font-semibold text-gray-900">
                  From {savedSenderName}
                </p>
              )}

              {savedNote && (
                <p className="text-center italic text-gray-700">
                  “{savedNote}”
                </p>
              )}

              <button
                onClick={() => setStep("playback")}
                className="w-full rounded-2xl bg-black p-3 text-white"
              >
                Preview
              </button>
            </>
          )}

          {step === "playback" && (
            <>
              <h1 className="text-center text-2xl font-semibold text-gray-900">
                You received a message
              </h1>

              {savedSenderName && (
                <p className="text-center text-xl font-semibold text-gray-900">
                  From {savedSenderName}
                </p>
              )}

              {savedNote && (
                <p className="text-center italic text-gray-700">
                  “{savedNote}”
                </p>
              )}

              {audioUrl && <audio controls src={audioUrl} className="w-full" />}
            </>
          )}
        </div>
      </div>
    </main>
  );
}