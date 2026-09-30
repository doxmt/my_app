"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getSpeechRecognitionCtor,
  joinDictation,
  speechErrorMessage,
  SPEECH_LANG,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { cn } from "@/lib/utils";

/**
 * 음성 입력 버튼. 누르면 말하는 동안 인식된 글이 입력창(value) 뒤에 채워지고,
 * 사용자가 확인·수정한 뒤 직접 전송한다. 브라우저 내장 음성인식을 쓰며 서버로 보내는 것은 없다.
 * `disabled`가 되면(전송 중·제출 후 등) 진행 중인 인식을 버린다.
 */
export function MicButton({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  // 서버 렌더에서는 false, 브라우저에서 지원 여부를 읽는다(하이드레이션 후 갱신).
  const supported = useSyncExternalStore(
    () => () => {},
    () => getSpeechRecognitionCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    if (disabled) recognitionRef.current?.abort();
  }, [disabled]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  function start() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    setError(null);
    const recognition = new Ctor();
    recognition.lang = SPEECH_LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    baseRef.current = valueRef.current;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("");
      onChange(joinDictation(baseRef.current, transcript));
    };
    recognition.onerror = (event) => setError(speechErrorMessage(event.error));
    recognition.onend = () => {
      setListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError(speechErrorMessage("unknown"));
    }
  }

  function toggle() {
    if (listening) recognitionRef.current?.stop();
    else start();
  }

  const label = !supported
    ? "이 브라우저는 음성 입력을 지원하지 않습니다"
    : listening
      ? "음성 입력 중지"
      : "음성으로 입력";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || !supported}
        aria-pressed={listening}
        aria-label={label}
        title={label}
        className={cn(
          "grid size-10 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          listening && "animate-pulse border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15",
        )}
      >
        {supported ? <Mic className="size-4" aria-hidden /> : <MicOff className="size-4" aria-hidden />}
      </button>
      {listening && (
        <span role="status" className="sr-only">
          음성을 듣고 있습니다
        </span>
      )}
      {error && (
        <p
          role="alert"
          className="absolute right-0 bottom-full z-30 mb-2 w-60 rounded-md border bg-popover p-2 text-xs text-destructive shadow-lg"
        >
          {error}
        </p>
      )}
    </div>
  );
}
