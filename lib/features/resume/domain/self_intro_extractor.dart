/// 자기소개 최대 길이. 입력 제한과 추출 결과 자르기에 같이 쓴다.
/// 웹(`webapp/lib/resume/self-intro.ts`)과 규칙·상수를 맞춘다.
const maxSelfIntroductionLength = 1500;

const _selfIntroTitles = {
  '자기소개',
  '자기소개서',
  '소개',
  'self introduction',
  'about',
  'about me',
  'summary',
  'profile',
};

const _sectionTitles = {
  '경력',
  '경력사항',
  '학력',
  '학력사항',
  '프로젝트',
  '기술',
  '기술 스택',
  '기술스택',
  '스킬',
  '자격증',
  '수상',
  '교육',
  '활동',
  '연락처',
  'experience',
  'work experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'awards',
  'contact',
};

final _leadingDecoration = RegExp(r'^[\s#■●▶◆▪•\-*\[\(【]+');
final _trailingDecoration = RegExp(r'[\s:：\]\)】]+$');

/// 줄에서 장식(공백, `#`, 글머리 기호, 괄호, 끝의 `:`)을 벗기고 소문자로 바꾼 제목 후보.
String _normalizeHeading(String line) {
  return line
      .replaceFirst(_leadingDecoration, '')
      .replaceFirst(_trailingDecoration, '')
      .replaceAll(RegExp(r'\s+'), ' ')
      .toLowerCase();
}

/// 이력서 텍스트에서 "자기소개" 항목 본문을 뽑는다. 제목 줄이 없거나 본문이 비면 빈 문자열.
///
/// 제목 줄 다음부터 다음 섹션 제목 줄 직전까지를 가져오고 [maxSelfIntroductionLength]자에서 자른다.
String extractSelfIntroduction(String resumeText) {
  final lines = resumeText.split(RegExp(r'\r?\n'));
  final titleIndex = lines.indexWhere((line) => _selfIntroTitles.contains(_normalizeHeading(line)));
  if (titleIndex == -1) {
    return '';
  }

  final body = <String>[];
  for (final line in lines.skip(titleIndex + 1)) {
    if (_sectionTitles.contains(_normalizeHeading(line))) {
      break;
    }
    body.add(line);
  }

  final text = body.join('\n').trim();
  return text.length > maxSelfIntroductionLength ? text.substring(0, maxSelfIntroductionLength) : text;
}
