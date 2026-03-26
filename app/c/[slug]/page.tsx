"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Step = "loading" | "intro" | "recording" | "review" | "success" | "playback";

type CardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default function CardPage({ params }: CardPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [step, setStep] = useState<Step>("loading");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        .select("audio_url")
        .eq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error checking message:", error);
        setStep("intro");
        return;
      }

      if (data?.audio_url) {
        setAudioUrl(data.audio_url);
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

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("messages")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from("messages").insert({
        slug,
        audio_url: publicUrl,
      });

      if (insertError) {
        throw insertError;
      }

      setAudioUrl(publicUrl);
      setStep("success");
    } catch (error) {
      console.error("Save error:", error);
      alert("There was a problem saving your message.");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-sm uppercase tracking-wide text-gray-400">
          Code: {slug}
        </p>

        {step === "intro" && (
          <>
            <h1 className="text-3xl font-semibold">
              Leave a message they can hear 💛
            </h1>

            <p className="text-gray-500">
              Record a voice message for this gift
            </p>

            <button
              onClick={() => setStep("recording")}
              className="w-full rounded-xl bg-black px-6 py-3 text-lg text-white"
            >
              🎙️ Record message
            </button>
          </>
        )}

        {step === "recording" && (
          <>
            <h1 className="text-3xl font-semibold">Record your message</h1>

            <p className="text-gray-500">
              Tap below to start and stop recording
            </p>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="w-full rounded-xl bg-black px-6 py-3 text-lg text-white"
            >
              {isRecording ? "⏹ Stop recording" : "🎙️ Start recording"}
            </button>

            <button
              onClick={() => setStep("review")}
              disabled={!audioUrl}
              className={`w-full rounded-xl px-6 py-3 text-lg transition ${
                audioUrl
                  ? "bg-black text-white"
                  : "border border-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </>
        )}

        {step === "review" && (
          <>
            <h1 className="text-3xl font-semibold">Review your message</h1>

            <p className="text-gray-500">Play it back before saving</p>

            {audioUrl && (
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/webm" />
                Your browser does not support audio playback.
              </audio>
            )}

            <button
              onClick={saveMessage}
              disabled={isSaving}
              className={`w-full rounded-xl px-6 py-3 text-lg text-white transition ${
                isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-black"
              }`}
            >
              {isSaving ? "Saving..." : "Save message"}
            </button>

            <button
              onClick={() => {
                setAudioUrl(null);
                setAudioBlob(null);
                setStep("recording");
              }}
              className="w-full rounded-xl bg-gray-100 px-6 py-3 text-lg text-black transition hover:bg-gray-200"
            >
              Re-record
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <h1 className="text-3xl font-semibold">Your message is ready 💛</h1>

            <p className="text-gray-500">
              They’ll hear it when they scan the code
            </p>

            <button
              onClick={() => setStep("playback")}
              className="w-full rounded-xl bg-black px-6 py-3 text-lg text-white"
            >
              Preview recipient view
            </button>
          </>
        )}

        {step === "playback" && (
          <>
            <h1 className="text-3xl font-semibold">
              Someone left you a message 💛
            </h1>

            <p className="text-gray-500">Tap below to listen</p>

            {audioUrl && (
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/webm" />
                Your browser does not support audio playback.
              </audio>
            )}
          </>
        )}
      </div>
    </main>
  );
}