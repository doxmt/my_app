import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/domain/category.dart';

void main() {
  test('Category.fromJson이 JSON을 모델로 변환한다', () {
    final category = Category.fromJson({
      'id': 'c1',
      'parent_id': null,
      'slug': 'cs',
      'name': 'CS',
      'description': '컴퓨터공학 기초',
      'sort_order': 1,
    });

    expect(category.id, 'c1');
    expect(category.parentId, isNull);
    expect(category.slug, 'cs');
    expect(category.name, 'CS');
    expect(category.description, '컴퓨터공학 기초');
    expect(category.sortOrder, 1);
  });
}
