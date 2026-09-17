/// 카테고리(분야) 모델.
class Category {
  const Category({
    required this.id,
    required this.parentId,
    required this.slug,
    required this.name,
    required this.description,
    required this.sortOrder,
  });

  final String id;
  final String? parentId;
  final String slug;
  final String name;
  final String? description;
  final int sortOrder;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      parentId: json['parent_id'] as String?,
      slug: json['slug'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      sortOrder: json['sort_order'] as int,
    );
  }
}
