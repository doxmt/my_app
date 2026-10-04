import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/login_page.dart';
import '../features/categories/presentation/categories_page.dart';
import '../features/interview/presentation/interview_page.dart';
import '../features/me/presentation/me_page.dart';
import '../features/me/presentation/settings_page.dart';
import '../features/practice/domain/practice_mode.dart';
import '../features/practice/presentation/field_page.dart';
import '../features/practice/presentation/question_detail_page.dart';
import '../features/practice/presentation/question_list_page.dart';
import '../features/practice/presentation/question_review_page.dart';
import '../features/practice/presentation/topic_list_page.dart';
import '../features/resume/presentation/resume_page.dart';
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
              GoRoute(
                path: '/',
                builder: (context, state) => const CategoriesPage(),
                routes: [
                  GoRoute(
                    path: 'categories/:field',
                    builder: (context, state) {
                      return FieldPage(fieldSlug: state.pathParameters['field']!);
                    },
                    routes: [
                      GoRoute(
                        path: ':mode',
                        redirect: (context, state) {
                          final field = state.pathParameters['field']!;
                          final mode = state.pathParameters['mode']!;
                          if (PracticeMode.fromPathValue(mode) == null) {
                            return '/categories/$field';
                          }
                          return null;
                        },
                        builder: (context, state) {
                          final field = state.pathParameters['field']!;
                          final mode = PracticeMode.fromPathValue(
                            state.pathParameters['mode']!,
                          )!;
                          return TopicListPage(fieldSlug: field, mode: mode);
                        },
                        routes: [
                          GoRoute(
                            path: ':topic',
                            builder: (context, state) {
                              final field = state.pathParameters['field']!;
                              final mode = PracticeMode.fromPathValue(
                                state.pathParameters['mode']!,
                              )!;
                              final topic = state.pathParameters['topic']!;
                              return QuestionListPage(
                                fieldSlug: field,
                                mode: mode,
                                topicSlug: topic,
                              );
                            },
                            routes: [
                              GoRoute(
                                path: ':questionId',
                                builder: (context, state) {
                                  final field = state.pathParameters['field']!;
                                  final mode = PracticeMode.fromPathValue(
                                    state.pathParameters['mode']!,
                                  )!;
                                  final topic = state.pathParameters['topic']!;
                                  final questionId = state.pathParameters['questionId']!;
                                  return QuestionDetailPage(
                                    fieldSlug: field,
                                    mode: mode,
                                    topicSlug: topic,
                                    questionId: questionId,
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
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
                    path: 'login',
                    builder: (context, state) => const LoginPage(),
                  ),
                  GoRoute(
                    path: 'settings',
                    builder: (context, state) => const SettingsPage(),
                  ),
                  GoRoute(
                    path: 'resume',
                    builder: (context, state) => ResumePage(
                      returnToInterview: state.uri.queryParameters['from'] == 'interview',
                    ),
                  ),
                  GoRoute(
                    path: 'wrong-notes',
                    builder: (context, state) => const WrongNotesPage(),
                    routes: [
                      GoRoute(
                        path: ':questionId',
                        builder: (context, state) {
                          return QuestionReviewPage(
                            questionId: state.pathParameters['questionId']!,
                          );
                        },
                      ),
                    ],
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
