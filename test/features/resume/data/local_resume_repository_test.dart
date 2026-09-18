import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/storage/local_json_store.dart';
import 'package:my_app/features/resume/data/local_resume_repository.dart';
import 'package:my_app/features/resume/domain/resume.dart';

class FakeLocalJsonStore implements LocalJsonStore {
  final Map<String, Map<String, dynamic>> _data = {};

  @override
  Future<Map<String, dynamic>?> read(String key) async => _data[key];

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {
    _data[key] = value;
  }
}

Resume _resume({String text = '텍스트'}) {
  return Resume(
    sourceType: ResumeSourceType.paste,
    text: text,
    updatedAt: DateTime.utc(2026, 9, 18),
  );
}

void main() {
  test('저장하기 전에는 fetch가 null을 돌려준다', () async {
    final repository = LocalResumeRepository(FakeLocalJsonStore());

    final resume = await repository.fetch();

    expect(resume, isNull);
  });

  test('저장한 이력서가 fetch에 나타난다', () async {
    final repository = LocalResumeRepository(FakeLocalJsonStore());

    await repository.save(_resume());
    final resume = await repository.fetch();

    expect(resume?.text, '텍스트');
  });

  test('다시 저장하면 이전 이력서를 덮어쓴다', () async {
    final repository = LocalResumeRepository(FakeLocalJsonStore());

    await repository.save(_resume(text: '첫 번째'));
    await repository.save(_resume(text: '두 번째'));
    final resume = await repository.fetch();

    expect(resume?.text, '두 번째');
  });

  test('새 저장소 인스턴스로 다시 읽어도 데이터가 유지된다 (영속성 시뮬레이션)', () async {
    final store = FakeLocalJsonStore();
    await LocalResumeRepository(store).save(_resume());

    final resume = await LocalResumeRepository(store).fetch();

    expect(resume?.text, '텍스트');
  });
}
