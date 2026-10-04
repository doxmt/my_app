import 'category.dart';
import 'field_stats.dart';

/// 카테고리 조회 리포지토리 인터페이스.
abstract class CategoryRepository {
  /// 최상위 분야(`parent_id is null`)를 `sort_order` 순으로 가져온다.
  Future<List<Category>> fetchTopLevelCategories();

  /// 하위 주제(`parent_id = parentId`)를 `sort_order` 순으로 가져온다.
  Future<List<Category>> fetchChildCategories(String parentId);

  /// slug로 카테고리 하나를 가져온다. 라우트 파라미터를 카테고리로 바꿀 때 쓴다.
  Future<Category> fetchCategoryBySlug(String slug);

  /// 분야 id별 주제 수·게시된 문제 수.
  Future<Map<String, FieldStats>> fetchFieldStats();
}
