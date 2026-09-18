import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_client_provider.dart';
import '../data/supabase_category_repository.dart';
import '../domain/category.dart';
import '../domain/category_repository.dart';

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
