import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/speech/dictation.dart';

void main() {
  group('joinDictation', () {
    test('입력창이 비어 있으면 인식된 글만 쓴다', () {
      expect(joinDictation('', '  안녕하세요 '), '안녕하세요');
    });

    test('기존 글 뒤에 공백 하나로 이어 붙인다', () {
      expect(joinDictation('프로세스는', '실행 중인 프로그램입니다'), '프로세스는 실행 중인 프로그램입니다');
    });

    test('기존 글이 공백·줄바꿈으로 끝나면 공백을 더하지 않는다', () {
      expect(joinDictation('첫 문장.\n', '둘째 문장'), '첫 문장.\n둘째 문장');
    });

    test('인식된 글이 없으면 기존 글을 그대로 둔다', () {
      expect(joinDictation('기존', '   '), '기존');
    });
  });

  group('dictationErrorMessage', () {
    test('권한 오류는 권한 안내를 준다', () {
      expect(dictationErrorMessage('error_permission'), contains('권한'));
    });

    test('말이 들리지 않은 경우는 다시 시도 안내를 준다', () {
      expect(dictationErrorMessage('error_no_match'), contains('들리지'));
      expect(dictationErrorMessage('error_speech_timeout'), contains('들리지'));
    });

    test('알 수 없는 오류도 일반 안내를 준다', () {
      expect(dictationErrorMessage('error_unknown'), contains('오류'));
    });
  });
}
