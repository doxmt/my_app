import 'category.dart';

/// 카테고리 조회 리포지토리 인터페이스.
abstract class CategoryRepository {
  /// 최상위 분야(`parent_id is null`)를 `sort_order` 순으로 가져온다.
  Future<List<Category>> fetchTopLevelCategories();
}
