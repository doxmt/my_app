import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/category.dart';
import '../domain/category_repository.dart';

class SupabaseCategoryRepository implements CategoryRepository {
  SupabaseCategoryRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<List<Category>> fetchTopLevelCategories() async {
    final rows = await _client
        .from('categories')
        .select()
        .filter('parent_id', 'is', null)
        .order('sort_order');

    return rows.map((row) => Category.fromJson(row)).toList();
  }
}
