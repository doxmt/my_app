import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/pdf_extraction_client.dart';
import '../domain/resume.dart';
import '../domain/self_intro_extractor.dart';
import 'resume_providers.dart';

/// 이력서 입력 화면. 텍스트 붙여넣기 또는 PDF 업로드로 이력서를 채우고 저장한다.
class ResumePage extends ConsumerWidget {
  const ResumePage({super.key, this.returnToInterview = false});

  /// 모의면접에서 이력서 입력으로 넘어온 경우 true. 저장하면 모의면접으로 돌아간다.
  final bool returnToInterview;

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
        data: (resume) => _ResumeForm(initial: resume, returnToInterview: returnToInterview),
      ),
    );
  }
}

class _ResumeForm extends ConsumerStatefulWidget {
  const _ResumeForm({required this.initial, required this.returnToInterview});

  final Resume? initial;
  final bool returnToInterview;

  @override
  ConsumerState<_ResumeForm> createState() => _ResumeFormState();
}

class _ResumeFormState extends ConsumerState<_ResumeForm> {
  late final TextEditingController _controller;
  late final TextEditingController _selfIntroController;
  late ResumeSourceType _sourceType;
  bool _isExtracting = false;
  String? _errorMessage;
  String? _selfIntroNotice;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initial?.text ?? '');
    _selfIntroController = TextEditingController(text: widget.initial?.selfIntroduction ?? '');
    _sourceType = widget.initial?.sourceType ?? ResumeSourceType.paste;
  }

  @override
  void dispose() {
    _controller.dispose();
    _selfIntroController.dispose();
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
        if (_selfIntroController.text.trim().isEmpty) {
          _selfIntroController.text = extractSelfIntroduction(text);
        }
      });
    } on PdfExtractionException catch (error) {
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) {
        setState(() => _isExtracting = false);
      }
    }
  }

  /// 입력칸이 이미 채워져 있으면 덮어쓴다. 덮어썼다는 사실은 안내 문구로 보여준다.
  void _importSelfIntro() {
    final extracted = extractSelfIntroduction(_controller.text);
    setState(() {
      if (extracted.isEmpty) {
        _selfIntroNotice = '이력서에서 자기소개 항목을 찾지 못했어요. 직접 입력해 주세요.';
        return;
      }
      final replaced = _selfIntroController.text.trim().isNotEmpty;
      _selfIntroController.text = extracted;
      _selfIntroNotice = replaced ? '이력서의 자기소개로 입력 내용을 바꿨어요.' : '이력서에서 자기소개를 가져왔어요.';
    });
  }

  Future<void> _save() async {
    // 자기소개 칸이 비어 있으면 이력서에서 찾아 채운다. 이미 입력한 내용은 덮어쓰지 않는다.
    var selfIntro = _selfIntroController.text.trim();
    if (selfIntro.isEmpty) {
      selfIntro = extractSelfIntroduction(_controller.text);
      _selfIntroController.text = selfIntro;
    }
    final resume = Resume(
      sourceType: _sourceType,
      text: _controller.text,
      updatedAt: DateTime.now(),
      selfIntroduction: selfIntro,
    );
    await ref.read(resumeRepositoryProvider).save(resume);
    ref.invalidate(resumeProvider);

    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('이력서를 저장했습니다.')));
      if (widget.returnToInterview) {
        context.go('/interview');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _controller,
            minLines: 10,
            maxLines: 16,
            textAlignVertical: TextAlignVertical.top,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '이력서 텍스트를 붙여넣으세요.',
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
          const SizedBox(height: 24),
          const Text('자기소개'),
          const SizedBox(height: 4),
          Text(
            '면접을 자기소개로 시작할 때 쓰입니다.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _selfIntroController,
            minLines: 4,
            maxLines: 8,
            maxLength: maxSelfIntroductionLength,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '자기소개를 입력하세요.',
            ),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(onPressed: _importSelfIntro, child: const Text('이력서에서 가져오기')),
          ),
          if (_selfIntroNotice != null)
            Text(_selfIntroNotice!, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: _save, child: const Text('저장')),
        ],
      ),
    );
  }
}
