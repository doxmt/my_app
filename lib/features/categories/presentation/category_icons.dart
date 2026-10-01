import 'package:flutter/material.dart';

/// 분야 slug에 대응하는 아이콘. 알려지지 않은 slug는 기본 아이콘을 반환한다.
IconData iconForSlug(String slug) {
  switch (slug) {
    case 'cs':
      return Icons.memory;
    case 'frontend':
      return Icons.web;
    case 'backend':
      return Icons.dns;
    case 'ai':
      return Icons.smart_toy;
    case 'ml':
      return Icons.model_training;
    case 'mobile':
      return Icons.smartphone;
    case 'devops':
      return Icons.cloud;
    default:
      return Icons.category_outlined;
  }
}
