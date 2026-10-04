import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/category.dart';
import '../domain/category_repository.dart';
import '../domain/field_stats.dart';

class SupabaseCategoryRepository implements CategoryRepository {
  SupabaseCategoryRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<List<Category>> fetchTopLevelCategories() async {
    final rows = await _client
        .from('categories')
        .select()
        .filter('parent_id', 'is', null)
        .order('sort_order', ascending: true);

    return rows.map((row) => Category.fromJson(row)).toList();
  }

  @override
  Future<List<Category>> fetchChildCategories(String parentId) async {
    final rows = await _client
        .from('categories')
        .select()
        .eq('parent_id', parentId)
        .order('sort_order', ascending: true);

    return rows.map((row) => Category.fromJson(row)).toList();
  }

  @override
  Future<Category> fetchCategoryBySlug(String slug) async {
    final row = await _client.from('categories').select().eq('slug', slug).single();

    return Category.fromJson(row);
  }

  @override
  Future<Map<String, FieldStats>> fetchFieldStats() async {
    // 주제마다 문제 수를 함께 받아 한 번의 요청으로 센다. RLS로 게시된 문제만 세어진다.
    final rows = await _client
        .from('categories')
        .select('parent_id, questions(count)')
        .not('parent_id', 'is', null);

    return summarizeFieldStats(rows);
  }
}
