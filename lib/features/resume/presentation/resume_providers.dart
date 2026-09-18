import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_config.dart';
import '../../../core/storage/local_json_store.dart';
import '../data/local_resume_repository.dart';
import '../data/vercel_pdf_extraction_client.dart';
import '../domain/pdf_extraction_client.dart';
import '../domain/resume.dart';
import '../domain/resume_repository.dart';

final resumeRepositoryProvider = Provider<ResumeRepository>((ref) {
  return LocalResumeRepository(ref.watch(localJsonStoreProvider));
});

final resumeProvider = FutureProvider<Resume?>((ref) {
  return ref.watch(resumeRepositoryProvider).fetch();
});

final pdfExtractionClientProvider = Provider<PdfExtractionClient>((ref) {
  final config = ref.watch(appConfigProvider);
  return VercelPdfExtractionClient(http.Client(), config.pdfParseBaseUrl);
});
