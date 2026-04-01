"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step =
  | "loading"
  | "intro"
  | "recording"
  | "review"
  | "success"
  | "preplay"
  | "playing"
  | "ended";

type ExistingMessage = {
  audio_url: string;
  sender_name: string | null;
  note: string | null;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSupportedRecordingConfig() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return {
      mimeType: "",
      extension: "webm",
    };
  }

  const candidates = [
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/mp4", extension: "mp4" },
    { mimeType: "audio/mpeg", extension: "mp3" },
  ];

  const supported = candidates.find((item) =>
    typeof MediaRecorder.isTypeSupported === "function"
      ? MediaRecorder.isTypeSupported(item.mimeType)
      : false,
  );

  return supported || { mimeType: "", extension: "webm" };
}

export default function MessagePage() {
  const params = useParams<{ slug: string | string[] }>();
  const router = useRouter();

  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "";

  const [step, setStep] = useState<Step>("loading");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [existingMessage, setExistingMessage] =
    useState<ExistingMessage | null>(null);

  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");

  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState(0);

  const [reviewAudioReady, setReviewAudioReady] = useState(false);
  const [reviewIsPlaying, setReviewIsPlaying] = useState(false);
  const [reviewCurrentTime, setReviewCurrentTime] = useState(0);
  const [reviewDuration, setReviewDuration] = useState(0);

  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewPlaybackError, setReviewPlaybackError] = useState<string | null>(
    null,
  );

  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const recordingConfigRef = useRef(getSupportedRecordingConfig());

  const clearRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const cleanupRecordingStream = () => {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
  };

  const revokeLocalAudioUrl = (url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const resetPlaybackState = () => {
    setAudioReady(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackError(null);
  };

  const resetReviewState = () => {
    setReviewAudioReady(false);
    setReviewIsPlaying(false);
    setReviewCurrentTime(0);
    setReviewDuration(0);
    setReviewPlaybackError(null);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  };

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const checkExisting = async () => {
      setStep("loading");

      const { data, error } = await supabase
        .from("messages")
        .select("audio_url, sender_name, note")
        .eq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingMessage>();

      if (!isMounted) return;

      if (error) {
        console.error("Error checking existing message:", error);
        setStep("intro");
        return;
      }

      if (data) {
        setExistingMessage(data);
        setAudioUrl(data.audio_url);
        resetPlaybackState();
        resetReviewState();
        setStep("preplay");
      } else {
        setExistingMessage(null);
        setStep("intro");
      }
    };

    checkExisting();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    const audio = playbackAudioRef.current;
    if (!audio || !existingMessage?.audio_url) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setAudioReady(true);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setStep("ended");
      setCurrentTime(audio.duration || 0);
    };

    const onPlay = () => {
      setIsPlaying(true);
      setStep("playing");
      setPlaybackError(null);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onError = () => {
      setPlaybackError("This audio couldn’t be played.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [existingMessage?.audio_url]);

  useEffect(() => {
    const audio = reviewAudioRef.current;
    if (!audio || !audioUrl || step !== "review") return;

    const onLoadedMetadata = () => {
      setReviewDuration(audio.duration || 0);
      setReviewAudioReady(true);
    };

    const onTimeUpdate = () => {
      setReviewCurrentTime(audio.currentTime || 0);
    };

    const onEnded = () => {
      setReviewIsPlaying(false);
      setReviewCurrentTime(audio.duration || 0);
    };

    const onPlay = () => {
      setReviewIsPlaying(true);
      setReviewPlaybackError(null);
    };

    const onPause = () => {
      setReviewIsPlaying(false);
    };

    const onError = () => {
      setReviewPlaybackError("This preview couldn’t be played.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl, step]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      cleanupRecordingStream();
      revokeLocalAudioUrl(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (isPreparingMic || isSaving) return;

    try {
      setIsPreparingMic(true);
      setRecordingError(null);
      setSaveError(null);
      setPlaybackError(null);
      setReviewPlaybackError(null);

      clearRecordingTimer();
      cleanupRecordingStream();

      reviewAudioRef.current?.pause();
      resetReviewState();

      if (!existingMessage) {
        revokeLocalAudioUrl(audioUrl);
        setAudioUrl(null);
      }

      setAudioBlob(null);
      setRecordingElapsed(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      recordingStreamRef.current = stream;
      chunksRef.current = [];

      const { mimeType } = recordingConfigRef.current;

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("Recorder error:", event);
        clearRecordingTimer();
        cleanupRecordingStream();
        setRecordingError("Recording ran into a problem. Please try again.");
        setStep("intro");
      };

      mediaRecorder.onstop = () => {
        clearRecordingTimer();

        const resolvedMimeType =
          mediaRecorder.mimeType ||
          recordingConfigRef.current.mimeType ||
          "audio/webm";

        const blob = new Blob(chunksRef.current, { type: resolvedMimeType });

        if (!blob.size) {
          cleanupRecordingStream();
          setRecordingError(
            "We couldn’t capture that recording. Please try again.",
          );
          setStep("intro");
          return;
        }

        const localUrl = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(localUrl);
        resetReviewState();
        setStep("review");

        cleanupRecordingStream();
      };

      mediaRecorder.start(250);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingElapsed((prev) => prev + 1);
      }, 1000);

      setStep("recording");
    } catch (error) {
      console.error("Mic error:", error);
      setRecordingError(
        "Could not access your microphone. Check your browser permissions and try again.",
      );
      cleanupRecordingStream();
      clearRecordingTimer();
      setStep("intro");
    } finally {
      setIsPreparingMic(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;

    try {
      recorder.stop();
    } catch (error) {
      console.error("Stop recording error:", error);
      clearRecordingTimer();
      cleanupRecordingStream();
      setRecordingError("Could not stop the recording cleanly. Please try again.");
      setStep("intro");
    }
  };

  const saveMessage = async () => {
    if (!audioBlob || !slug || isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setRecordingError(null);

      const { mimeType, extension } = recordingConfigRef.current;
      const blobExtension =
        audioBlob.type.includes("mp4")
          ? "mp4"
          : audioBlob.type.includes("mpeg")
            ? "mp3"
            : extension;

      const filePath = `${slug}-${Date.now()}.${blobExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type || mimeType || "audio/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("messages")
        .getPublicUrl(filePath);

      const payload = {
        slug,
        audio_url: publicUrlData.publicUrl,
        sender_name: senderName.trim() || null,
        note: note.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("messages")
        .insert(payload);

      if (insertError) throw insertError;

      const saved: ExistingMessage = {
        audio_url: publicUrlData.publicUrl,
        sender_name: payload.sender_name,
        note: payload.note,
      };

      reviewAudioRef.current?.pause();
      setExistingMessage(saved);
      setAudioUrl(saved.audio_url);
      resetPlaybackState();
      resetReviewState();
      setStep("success");
    } catch (error) {
      console.error("Save error:", error);
      setSaveError("There was a problem saving your message. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlay = async () => {
    const audio = playbackAudioRef.current;
    if (!audio || !existingMessage?.audio_url) return;

    triggerHaptic();
    setPlaybackError(null);

    try {
      if (step === "ended") {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      await audio.play();
    } catch (error) {
      console.error("Playback failed:", error);
      setPlaybackError("Playback was blocked. Tap again to try.");
    }
  };

  const handlePause = () => {
    triggerHaptic();
    playbackAudioRef.current?.pause();
  };

  const handleResume = async () => {
    const audio = playbackAudioRef.current;
    if (!audio) return;

    triggerHaptic();
    setPlaybackError(null);

    try {
      await audio.play();
    } catch (error) {
      console.error("Resume failed:", error);
      setPlaybackError("Playback was blocked. Tap again to try.");
    }
  };

  const handleReplay = () => {
    const audio = playbackAudioRef.current;
    if (!audio) return;

    triggerHaptic();
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setStep("preplay");
    setIsPlaying(false);
    setPlaybackError(null);
  };

  const handleReviewToggle = async () => {
    const audio = reviewAudioRef.current;
    if (!audio) return;

    triggerHaptic();
    setReviewPlaybackError(null);

    try {
      if (audio.paused) {
        if (audio.ended) {
          audio.currentTime = 0;
          setReviewCurrentTime(0);
        }
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Review playback failed:", error);
      setReviewPlaybackError("Playback was blocked. Tap again to try.");
    }
  };

  const handleCreateEchoNote = () => {
    triggerHaptic();
    router.push("/create");
  };

  const handleOrderStickers = () => {
    triggerHaptic();
    router.push("/shop");
  };

  const senderLabel = useMemo(() => {
    return existingMessage?.sender_name?.trim() || "Someone special";
  }, [existingMessage?.sender_name]);

  const noteLabel = existingMessage?.note?.trim();
  const progress =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const reviewProgress =
    reviewDuration > 0
      ? Math.min((reviewCurrentTime / reviewDuration) * 100, 100)
      : 0;

  const activeError =
    recordingError || saveError || playbackError || reviewPlaybackError;

  if (step === "loading") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(221,198,173,0.35),transparent_28%),linear-gradient(180deg,#f8f5f0_0%,#f2ece4_100%)] px-6 py-10 text-[#181411]">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="space-y-5 text-center">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/70 shadow-[0_12px_30px_rgba(58,42,27,0.08)]" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#181411]/45">
                Opening your message
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                A moment is waiting for you
              </h1>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(221,198,173,0.35),transparent_28%),linear-gradient(180deg,#f8f5f0_0%,#f2ece4_100%)] px-4 py-6 text-[#181411] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[36px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(58,42,27,0.14)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.8),transparent_24%),radial-gradient(circle_at_50%_120%,rgba(223,196,169,0.18),transparent_35%)]" />
          <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-[18px] bg-[#181411]" />

          <section className="relative z-10 flex min-h-[780px] flex-col px-6 pb-7 pt-14 sm:px-7">
            {existingMessage?.audio_url ? (
              <audio
                ref={playbackAudioRef}
                src={existingMessage.audio_url}
                preload="metadata"
              />
            ) : null}

            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#181411]/55">
              <span className="h-2 w-2 rounded-full bg-gradient-to-b from-[#2f2520] to-[#8d786a] shadow-[0_0_0_4px_rgba(141,120,106,0.08)]" />
              EchoNote
            </div>

            {activeError ? (
              <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-[13px] leading-5 text-red-700 shadow-[0_8px_18px_rgba(239,68,68,0.08)]">
                {activeError}
              </div>
            ) : null}

            {(step === "preplay" || step === "playing" || step === "ended") &&
              existingMessage && (
                <>
                  {step === "preplay" && (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#181411]/45">
                        A moment is waiting
                      </p>

                      <h1 className="max-w-[290px] text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[34px]">
                        A voice note is waiting for you
                      </h1>

                      <p className="mt-3 text-[15px] tracking-[-0.01em] text-[#6f655e]">
                        From {senderLabel}
                      </p>

                      {noteLabel ? (
                        <div className="mt-5 max-w-[300px] rounded-[22px] border border-white/80 bg-white/60 px-5 py-4 text-[14px] italic leading-[1.5] text-[#5f564f] shadow-[0_12px_30px_rgba(58,42,27,0.08)] backdrop-blur-md">
                          “{noteLabel}”
                        </div>
                      ) : null}

                      <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="relative grid h-[154px] w-[154px] place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.94),rgba(255,255,255,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_24px_50px_rgba(90,66,45,0.12)] motion-safe:animate-[pulse_3s_ease-in-out_infinite]">
                          <div className="absolute inset-[10px] rounded-full border border-[#181411]/5" />
                          <button
                            type="button"
                            onClick={handlePlay}
                            disabled={!existingMessage.audio_url}
                            className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-b from-[#26201b] to-[#15110f] text-white shadow-[0_18px_30px_rgba(21,17,15,0.24),inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-150 hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Play message"
                          >
                            <span className="ml-1 inline-block h-0 w-0 border-b-[14px] border-l-[22px] border-t-[14px] border-b-transparent border-l-white border-t-transparent" />
                          </button>
                        </div>

                        <div className="text-[15px] font-semibold tracking-[-0.01em]">
                          {audioReady || !existingMessage.audio_url
                            ? "Play message"
                            : "Preparing audio..."}
                        </div>
                        <div className="text-[12px] text-[#181411]/45">
                          No app required
                        </div>
                      </div>
                    </div>
                  )}

                  {step === "playing" && (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#181411]/45">
                        Now listening
                      </p>

                      <h1 className="max-w-[320px] text-[28px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[30px]">
                        {senderLabel} left you a message
                      </h1>

                      <p className="mt-3 text-[15px] tracking-[-0.01em] text-[#6f655e]">
                        Take this moment in.
                      </p>

                      {noteLabel ? (
                        <p className="mt-3 max-w-[280px] text-[14px] italic text-[#6f655e]">
                          “{noteLabel}”
                        </p>
                      ) : null}

                      <div className="mt-10 w-full rounded-[28px] border border-white/80 bg-white/65 px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.08)] backdrop-blur-md">
                        <div className="mb-5 flex h-[104px] items-end justify-center gap-[6px]">
                          {[26, 46, 70, 50, 82, 58, 34, 76, 42].map(
                            (height, i) => (
                              <span
                                key={i}
                                className="inline-block w-[6px] origin-bottom rounded-full bg-gradient-to-b from-[#181411]/20 to-[#181411]/70 motion-safe:animate-[pulse_1.1s_ease-in-out_infinite]"
                                style={{
                                  height,
                                  animationDelay: `${-0.1 * i}s`,
                                }}
                              />
                            ),
                          )}
                        </div>

                        <div className="mx-auto h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-[#181411]/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2f2520] to-[#8d786a] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-3">
                          {isPlaying ? (
                            <button
                              type="button"
                              onClick={handlePause}
                              className="grid h-[74px] w-[74px] place-items-center rounded-full bg-gradient-to-b from-[#26201b] to-[#15110f] text-white shadow-[0_16px_28px_rgba(21,17,15,0.2)] transition duration-150 hover:brightness-105 active:scale-95"
                              aria-label="Pause message"
                            >
                              <span className="flex gap-2">
                                <span className="block h-6 w-[6px] rounded-full bg-white" />
                                <span className="block h-6 w-[6px] rounded-full bg-white" />
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResume}
                              className="grid h-[74px] w-[74px] place-items-center rounded-full bg-gradient-to-b from-[#26201b] to-[#15110f] text-white shadow-[0_16px_28px_rgba(21,17,15,0.2)] transition duration-150 hover:brightness-105 active:scale-95"
                              aria-label="Resume message"
                            >
                              <span className="ml-1 inline-block h-0 w-0 border-b-[12px] border-l-[18px] border-t-[12px] border-b-transparent border-l-white border-t-transparent" />
                            </button>
                          )}
                        </div>

                        <div className="mt-4 text-center text-[13px] tracking-[0.01em] text-[#181411]/55">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === "ended" && (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <div className="mb-6 grid h-[78px] w-[78px] place-items-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.5))] text-[34px] shadow-[0_12px_30px_rgba(58,42,27,0.08)]">
                        ✓
                      </div>

                      <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#181411]/45">
                        A small moment kept
                      </p>

                      <h1 className="max-w-[290px] text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[34px]">
                        That was special
                      </h1>

                      <p className="mt-3 max-w-[300px] text-[15px] tracking-[-0.01em] text-[#6f655e]">
                        Send a moment like this to someone you care about.
                      </p>

                      <div className="mt-8 grid w-full gap-3">
                        <button
                          type="button"
                          onClick={handleCreateEchoNote}
                          className="min-h-[56px] rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-5 text-[16px] font-semibold tracking-[-0.02em] text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98]"
                        >
                          Send your own EchoNote
                        </button>

                        <button
                          type="button"
                          onClick={handleReplay}
                          className="min-h-[56px] rounded-[18px] border border-[#181411]/8 bg-white/65 px-5 text-[16px] font-semibold tracking-[-0.02em] text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/80 active:scale-[0.98]"
                        >
                          Replay message
                        </button>
                      </div>

                      <div className="mt-3 text-center text-[13px] text-[#181411]/55">
                        Your first one is free
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {[
                          "No signup required",
                          "Takes seconds",
                          "Order stickers later",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-full border border-[#181411]/6 bg-white/55 px-3 py-2 text-[12px] text-[#181411]/58 backdrop-blur-md"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

            {(step === "intro" ||
              step === "recording" ||
              step === "review" ||
              step === "success") && (
              <>
                {step === "intro" && (
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="space-y-6 text-center">
                      <div className="mx-auto grid h-[84px] w-[84px] place-items-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(255,255,255,0.58))] text-[30px] shadow-[0_18px_40px_rgba(58,42,27,0.10)]">
                        💛
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#181411]/45">
                          Leave something meaningful
                        </p>
                        <h1 className="mx-auto max-w-[320px] text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#181411]">
                          Leave a voice message they can keep
                        </h1>
                        <p className="mx-auto max-w-[295px] text-[15px] leading-7 text-[#6f655e]">
                          Record a private moment they can hear the instant they
                          scan this EchoNote.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[28px] border border-white/80 bg-white/65 px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.08)] backdrop-blur-md">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
                        <span className="h-2 w-2 rounded-full bg-gradient-to-b from-[#2f2520] to-[#8d786a] shadow-[0_0_0_4px_rgba(141,120,106,0.08)]" />
                        No app required
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          { label: "Record", value: "Your voice" },
                          { label: "Save", value: "In seconds" },
                          { label: "Open", value: "With one scan" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[18px] border border-[#181411]/6 bg-white/60 px-3 py-3 text-center"
                          >
                            <div className="text-[11px] uppercase tracking-[0.12em] text-[#181411]/40">
                              {item.label}
                            </div>
                            <div className="mt-1 text-[13px] font-semibold leading-5 tracking-[-0.02em] text-[#181411]">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        <input
                          placeholder="Your name (optional)"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full rounded-[18px] border border-[#181411]/10 bg-white/70 px-4 py-3.5 text-[#181411] placeholder:text-[#181411]/35 outline-none transition focus:border-[#181411]/30"
                        />

                        <input
                          placeholder="Add a short note (optional)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full rounded-[18px] border border-[#181411]/10 bg-white/70 px-4 py-3.5 text-[#181411] placeholder:text-[#181411]/35 outline-none transition focus:border-[#181411]/30"
                        />
                      </div>
                    </div>

                    <div className="mt-8 grid gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          startRecording();
                        }}
                        disabled={isPreparingMic}
                        className="min-h-[56px] w-full rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPreparingMic ? "Preparing microphone..." : "Start recording"}
                      </button>

                      <p className="text-center text-[13px] text-[#181411]/55">
                        A private message, opened in one tap
                      </p>
                    </div>
                  </div>
                )}

                {step === "recording" && (
                  <div className="flex flex-1 flex-col justify-center space-y-8 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-3xl shadow-[0_12px_30px_rgba(58,42,27,0.08)] motion-safe:animate-[pulse_1.8s_ease-in-out_infinite]">
                        🎙️
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#181411]/45">
                          Recording now
                        </p>
                        <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#181411]">
                          Recording…
                        </h1>
                        <p className="text-[15px] text-[#6f655e]">
                          Tap below when you’re ready to stop.
                        </p>
                        <p className="text-[13px] font-medium text-red-500">
                          {formatTime(recordingElapsed)} recording
                        </p>
                      </div>

                      {senderName ? (
                        <p className="text-lg font-semibold text-[#181411]">
                          From {senderName}
                        </p>
                      ) : null}

                      {note ? (
                        <p className="mx-auto max-w-[260px] text-base italic text-[#6f655e]">
                          “{note}”
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        stopRecording();
                      }}
                      className="min-h-[56px] w-full rounded-[18px] bg-red-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(239,68,68,0.22)] transition duration-150 hover:bg-red-600 active:scale-[0.98]"
                    >
                      Stop recording
                    </button>
                  </div>
                )}

                {step === "review" && audioUrl && (
                  <div className="flex flex-1 flex-col justify-center space-y-8 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/70 text-2xl shadow-[0_12px_30px_rgba(58,42,27,0.08)]">
                        🎧
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#181411]/45">
                          Take one last listen
                        </p>
                        <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#181411]">
                          This is what they’ll hear
                        </h1>
                        <p className="mx-auto max-w-[280px] text-[15px] text-[#6f655e]">
                          Play it back, then save it when it feels right.
                        </p>
                      </div>

                      {senderName ? (
                        <p className="text-lg font-semibold text-[#181411]">
                          From {senderName}
                        </p>
                      ) : null}

                      {note ? (
                        <p className="mx-auto max-w-[260px] text-base italic text-[#6f655e]">
                          “{note}”
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-[28px] border border-white/80 bg-white/65 px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.08)] backdrop-blur-md">
                      <audio
                        ref={reviewAudioRef}
                        key={audioUrl}
                        src={audioUrl}
                        preload="metadata"
                        className="hidden"
                      />

                      <div className="mb-5 flex h-[104px] items-end justify-center gap-[6px]">
                        {[26, 46, 70, 50, 82, 58, 34, 76, 42].map(
                          (height, i) => (
                            <span
                              key={i}
                              className="inline-block w-[6px] origin-bottom rounded-full bg-gradient-to-b from-[#181411]/20 to-[#181411]/70 motion-safe:animate-[pulse_1.1s_ease-in-out_infinite]"
                              style={{
                                height,
                                animationDelay: `${-0.1 * i}s`,
                                opacity: reviewIsPlaying ? 1 : 0.55,
                              }}
                            />
                          ),
                        )}
                      </div>

                      <div className="mx-auto h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-[#181411]/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2f2520] to-[#8d786a] transition-all duration-300"
                          style={{ width: `${reviewProgress}%` }}
                        />
                      </div>

                      <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleReviewToggle}
                          className="grid h-[74px] w-[74px] place-items-center rounded-full bg-gradient-to-b from-[#26201b] to-[#15110f] text-white shadow-[0_16px_28px_rgba(21,17,15,0.2)] transition duration-150 hover:brightness-105 active:scale-95"
                          aria-label={
                            reviewIsPlaying
                              ? "Pause review message"
                              : "Play review message"
                          }
                        >
                          {reviewIsPlaying ? (
                            <span className="flex gap-2">
                              <span className="block h-6 w-[6px] rounded-full bg-white" />
                              <span className="block h-6 w-[6px] rounded-full bg-white" />
                            </span>
                          ) : (
                            <span className="ml-1 inline-block h-0 w-0 border-b-[12px] border-l-[18px] border-t-[12px] border-b-transparent border-l-white border-t-transparent" />
                          )}
                        </button>
                      </div>

                      <div className="mt-4 text-center text-[13px] tracking-[0.01em] text-[#181411]/55">
                        {reviewAudioReady
                          ? `${formatTime(reviewCurrentTime)} / ${formatTime(reviewDuration)}`
                          : "Preparing preview..."}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          reviewAudioRef.current?.pause();
                          saveMessage();
                        }}
                        disabled={isSaving}
                        className="min-h-[56px] w-full rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save message"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          reviewAudioRef.current?.pause();
                          startRecording();
                        }}
                        disabled={isSaving || isPreparingMic}
                        className="min-h-[56px] w-full rounded-[18px] border border-[#181411]/10 bg-white/65 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Re-record
                      </button>
                    </div>
                  </div>
                )}

                {step === "success" && existingMessage && (
                  <div className="flex flex-1 flex-col justify-center text-center">
                    <div className="space-y-5">
                      <div className="mx-auto grid h-[84px] w-[84px] place-items-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(255,255,255,0.58))] text-[34px] shadow-[0_18px_40px_rgba(58,42,27,0.10)]">
                        ✨
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#181411]/45">
                          Your EchoNote is live
                        </p>
                        <h1 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#181411]">
                          It’s ready
                        </h1>
                        <p className="mx-auto max-w-[290px] text-[15px] leading-7 text-[#6f655e]">
                          They’ll hear your voice the moment they scan it.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[28px] border border-white/80 bg-white/65 px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.08)] backdrop-blur-md">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
                        Saved successfully
                      </div>

                      {(existingMessage.sender_name || existingMessage.note) && (
                        <div className="mt-5 space-y-3">
                          {existingMessage.sender_name ? (
                            <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#181411]">
                              From {existingMessage.sender_name}
                            </p>
                          ) : null}

                          {existingMessage.note ? (
                            <p className="mx-auto max-w-[260px] text-[15px] italic leading-7 text-[#6f655e]">
                              “{existingMessage.note}”
                            </p>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-6 grid grid-cols-3 gap-2 text-left">
                        {[
                          { label: "Recorded", value: "Done" },
                          { label: "Saved", value: "Secure" },
                          { label: "Ready", value: "To scan" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[18px] border border-[#181411]/6 bg-white/60 px-3 py-3 text-center"
                          >
                            <div className="text-[11px] uppercase tracking-[0.12em] text-[#181411]/40">
                              {item.label}
                            </div>
                            <div className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-[#181411]">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          setStep("preplay");
                        }}
                        className="min-h-[56px] rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98]"
                      >
                        Preview message
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateEchoNote}
                        className="min-h-[56px] rounded-[18px] border border-[#181411]/10 bg-white/65 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/80 active:scale-[0.98]"
                      >
                        Create another EchoNote
                      </button>
                    </div>

                    <div className="mt-4 text-center text-[13px] text-[#181411]/55">
                      Made to be opened in one tap
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-auto flex flex-col items-center gap-2 pb-1 text-center">
              {step === "ended" ? (
                <>
                  <button
                    type="button"
                    onClick={handleOrderStickers}
                    className="text-[13px] font-medium text-[#181411]/60 underline underline-offset-4"
                  >
                    Order EchoNote Stickers
                  </button>
                  <p className="text-[12px] text-[#181411]/38">
                    Made to be kept
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-[#181411]/55">
                    Made to be kept
                  </p>
                  <p className="text-[12px] text-[#181411]/38">
                    A private message, opened in one tap
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}