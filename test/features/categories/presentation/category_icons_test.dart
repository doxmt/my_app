import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/presentation/category_icons.dart';

void main() {
  test('알려진 slug는 각각 구분되는 아이콘을 반환한다', () {
    expect(iconForSlug('cs'), Icons.memory);
    expect(iconForSlug('frontend'), Icons.web);
    expect(iconForSlug('backend'), Icons.dns);
    expect(iconForSlug('ai'), Icons.smart_toy);
    expect(iconForSlug('mobile'), Icons.smartphone);
    expect(iconForSlug('devops'), Icons.cloud);
  });

  test('알려지지 않은 slug는 기본 아이콘을 반환한다', () {
    expect(iconForSlug('unknown-field'), Icons.category_outlined);
    expect(iconForSlug(''), Icons.category_outlined);
  });
}
