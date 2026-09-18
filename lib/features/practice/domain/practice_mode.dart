/// 학습 방식. 라우트의 `:mode` 파라미터 값과 1:1로 대응한다.
enum PracticeMode {
  study('study'),
  practice('practice');

  const PracticeMode(this.pathValue);

  final String pathValue;

  static PracticeMode? fromPathValue(String value) {
    for (final mode in PracticeMode.values) {
      if (mode.pathValue == value) {
        return mode;
      }
    }
    return null;
  }
}
