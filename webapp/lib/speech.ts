/** 음성 입력(브라우저 Web Speech API)용 순수 로직·타입. 브라우저 API 호출은 components/mic-button.tsx에 둔다. */

export const SPEECH_LANG = "ko-KR";

// lib.dom에 안정적인 타입이 없어 쓰는 부분만 직접 정의한다.
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 입력창에 이미 있던 글(base) 뒤에 인식된 글(transcript)을 이어 붙인다. */
export function joinDictation(base: string, transcript: string): string {
  const spoken = transcript.trim();
  if (!spoken) return base;
  if (!base) return spoken;
  return /\s$/.test(base) ? base + spoken : `${base} ${spoken}`;
}

/** 인식 오류 코드를 사용자에게 보여줄 문구로 바꾼다. 조용히 무시할 오류는 null. */
export function speechErrorMessage(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 필요합니다. 브라우저 주소창의 사이트 설정에서 마이크를 허용해 주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없습니다. 마이크 연결을 확인해 주세요.";
    case "network":
      return "음성 인식 서비스에 연결하지 못했습니다. 네트워크를 확인해 주세요.";
    case "no-speech":
      return "음성이 들리지 않았습니다. 다시 시도해 주세요.";
    case "aborted":
      return null;
    default:
      return "음성 인식 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
}
