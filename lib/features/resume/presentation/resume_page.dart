import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/pdf_extraction_client.dart';
import '../domain/resume.dart';
import 'resume_providers.dart';

/// 이력서 입력 화면. 텍스트 붙여넣기 또는 PDF 업로드로 이력서를 채우고 저장한다.
class ResumePage extends ConsumerWidget {
  const ResumePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resumeAsync = ref.watch(resumeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('이력서')),
      body: resumeAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('이력서를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(resumeProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (resume) => _ResumeForm(initial: resume),
      ),
    );
  }
}

class _ResumeForm extends ConsumerStatefulWidget {
  const _ResumeForm({required this.initial});

  final Resume? initial;

  @override
  ConsumerState<_ResumeForm> createState() => _ResumeFormState();
}

class _ResumeFormState extends ConsumerState<_ResumeForm> {
  late final TextEditingController _controller;
  late ResumeSourceType _sourceType;
  bool _isExtracting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initial?.text ?? '');
    _sourceType = widget.initial?.sourceType ?? ResumeSourceType.paste;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _pickPdf() async {
    setState(() {
      _isExtracting = true;
      _errorMessage = null;
    });

    try {
      final files = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
      if (files.isEmpty) {
        return;
      }
      final bytes = await files.single.readAsBytes();

      final text = await ref.read(pdfExtractionClientProvider).extractText(bytes);
      setState(() {
        _controller.text = text;
        _sourceType = ResumeSourceType.pdf;
      });
    } on PdfExtractionException catch (error) {
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) {
        setState(() => _isExtracting = false);
      }
    }
  }

  Future<void> _save() async {
    final resume = Resume(
      sourceType: _sourceType,
      text: _controller.text,
      updatedAt: DateTime.now(),
    );
    await ref.read(resumeRepositoryProvider).save(resume);
    ref.invalidate(resumeProvider);

    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('이력서를 저장했습니다.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              maxLines: null,
              expands: true,
              textAlignVertical: TextAlignVertical.top,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: '이력서 텍스트를 붙여넣으세요.',
              ),
            ),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _isExtracting ? null : _pickPdf,
            icon: _isExtracting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('PDF 불러오기'),
          ),
          const SizedBox(height: 4),
          Text(
            'PDF는 최대 4MB, 20페이지까지 불러올 수 있습니다.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          ElevatedButton(onPressed: _save, child: const Text('저장')),
        ],
      ),
    );
  }
}
