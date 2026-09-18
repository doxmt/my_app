import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/resume/domain/resume.dart';

void main() {
  test('Resume.fromJson이 JSON을 모델로 변환한다', () {
    final resume = Resume.fromJson({
      'source_type': 'pdf',
      'text': '3년차 백엔드 개발자',
      'updated_at': '2026-09-18T00:00:00.000Z',
    });

    expect(resume.sourceType, ResumeSourceType.pdf);
    expect(resume.text, '3년차 백엔드 개발자');
    expect(resume.updatedAt, DateTime.utc(2026, 9, 18));
  });

  test('toJson과 fromJson을 왕복해도 값이 유지된다', () {
    final original = Resume(
      sourceType: ResumeSourceType.paste,
      text: '텍스트 붙여넣기',
      updatedAt: DateTime.utc(2026, 9, 18, 12),
    );

    final roundTripped = Resume.fromJson(original.toJson());

    expect(roundTripped.sourceType, original.sourceType);
    expect(roundTripped.text, original.text);
    expect(roundTripped.updatedAt, original.updatedAt);
  });
}
