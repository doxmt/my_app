/// 음성 입력(받아쓰기)용 순수 로직. 플랫폼 음성인식 호출은 `dictation_button.dart`에 둔다.
library;

/// 음성 인식 언어.
const dictationLocaleId = 'ko_KR';

/// 입력창에 이미 있던 글([base]) 뒤에 인식된 글([transcript])을 이어 붙인다.
String joinDictation(String base, String transcript) {
  final spoken = transcript.trim();
  if (spoken.isEmpty) return base;
  if (base.isEmpty) return spoken;
  return RegExp(r'\s$').hasMatch(base) ? '$base$spoken' : '$base $spoken';
}

/// speech_to_text의 오류 코드를 사용자에게 보여줄 문구로 바꾼다. 조용히 넘길 오류는 null.
String? dictationErrorMessage(String code) {
  if (code.contains('permission')) {
    return '마이크 또는 음성 인식 권한이 필요합니다. 설정에서 허용해 주세요.';
  }
  if (code.contains('language')) {
    return '이 기기는 한국어 음성 인식을 지원하지 않습니다.';
  }
  if (code.contains('network')) {
    return '음성 인식 서비스에 연결하지 못했습니다. 네트워크를 확인해 주세요.';
  }
  if (code.contains('no_match') || code.contains('speech_timeout')) {
    return '음성이 들리지 않았습니다. 다시 시도해 주세요.';
  }
  if (code.contains('audio')) {
    return '마이크를 사용할 수 없습니다. 다른 앱이 사용 중인지 확인해 주세요.';
  }
  return '음성 인식 중 오류가 발생했습니다. 다시 시도해 주세요.';
}
