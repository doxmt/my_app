import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/categories/presentation/categories_page.dart';
import '../features/interview/presentation/interview_page.dart';
import '../features/me/presentation/me_page.dart';
import '../features/wrong_notes/presentation/wrong_notes_page.dart';
import 'widgets/app_shell.dart';

/// 앱 전체 라우터. 하단 탭 3개(홈/모의면접/내 정보)를 `StatefulShellRoute`로 구성한다.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (context, state) => const CategoriesPage()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/interview', builder: (context, state) => const InterviewPage()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/me',
                builder: (context, state) => const MePage(),
                routes: [
                  GoRoute(
                    path: 'wrong-notes',
                    builder: (context, state) => const WrongNotesPage(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
