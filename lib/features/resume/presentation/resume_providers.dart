import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_config.dart';
import '../../../core/storage/local_json_store.dart';
import '../../../core/supabase/supabase_client_provider.dart';
import '../../auth/presentation/auth_providers.dart';
import '../data/local_resume_repository.dart';
import '../data/supabase_resume_repository.dart';
import '../data/vercel_pdf_extraction_client.dart';
import '../domain/pdf_extraction_client.dart';
import '../domain/resume.dart';
import '../domain/resume_repository.dart';

final resumeRepositoryProvider = Provider<ResumeRepository>((ref) {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) {
    return LocalResumeRepository(ref.watch(localJsonStoreProvider));
  }
  return SupabaseResumeRepository(ref.watch(supabaseClientProvider), userId);
});

final resumeProvider = FutureProvider<Resume?>((ref) {
  return ref.watch(resumeRepositoryProvider).fetch();
});

final pdfExtractionClientProvider = Provider<PdfExtractionClient>((ref) {
  final config = ref.watch(appConfigProvider);
  return VercelPdfExtractionClient(http.Client(), config.pdfParseBaseUrl);
});
