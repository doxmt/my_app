import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_client_provider.dart';
import '../data/supabase_category_repository.dart';
import '../domain/category.dart';
import '../domain/category_repository.dart';
import '../domain/field_stats.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  return SupabaseCategoryRepository(ref.watch(supabaseClientProvider));
});

final categoriesProvider = FutureProvider<List<Category>>((ref) {
  return ref.watch(categoryRepositoryProvider).fetchTopLevelCategories();
});

final childCategoriesProvider = FutureProvider.family<List<Category>, String>((
  ref,
  parentId,
) {
  return ref.watch(categoryRepositoryProvider).fetchChildCategories(parentId);
});

final categoryBySlugProvider = FutureProvider.family<Category, String>((ref, slug) {
  return ref.watch(categoryRepositoryProvider).fetchCategoryBySlug(slug);
});

/// 홈 분야 카드의 주제 수·문제 수. 실패해도 카드는 그대로 보이고 숫자만 빠진다.
final fieldStatsProvider = FutureProvider<Map<String, FieldStats>>((ref) {
  return ref.watch(categoryRepositoryProvider).fetchFieldStats();
});
