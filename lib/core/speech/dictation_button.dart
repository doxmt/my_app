import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'dictation.dart';

/// 음성 입력 버튼. 누르면 말하는 동안 인식된 글이 [controller] 뒤에 채워지고,
/// 사용자가 확인·수정한 뒤 직접 전송한다. 기기 내장 음성인식을 쓰며 앱 서버로 보내는 것은 없다.
/// [enabled]가 꺼지면(전송 중 등) 진행 중인 인식을 취소한다.
class DictationButton extends StatefulWidget {
  const DictationButton({
    super.key,
    required this.controller,
    this.enabled = true,
  });

  final TextEditingController controller;
  final bool enabled;

  @override
  State<DictationButton> createState() => _DictationButtonState();
}

class _DictationButtonState extends State<DictationButton> {
  final _speech = SpeechToText();
  bool _initialized = false;
  bool _listening = false;
  String _base = '';

  @override
  void didUpdateWidget(DictationButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.enabled && !widget.enabled) {
      _cancel();
    }
  }

  @override
  void dispose() {
    _cancel();
    super.dispose();
  }

  void _cancel() {
    if (_initialized) {
      _speech.cancel();
    }
    _listening = false;
  }

  Future<void> _toggle() async {
    if (_listening) {
      await _speech.stop();
      if (mounted) setState(() => _listening = false);
      return;
    }
    if (!_initialized) {
      _initialized = await _speech.initialize(
        onStatus: _onStatus,
        onError: _onError,
      );
      if (!_initialized) {
        _showMessage(dictationErrorMessage('error_permission'));
        return;
      }
    }
    _base = widget.controller.text;
    setState(() => _listening = true);
    await _speech.listen(
      onResult: _onResult,
      listenOptions: SpeechListenOptions(
        partialResults: true,
        listenMode: ListenMode.dictation,
        localeId: dictationLocaleId,
        listenFor: const Duration(minutes: 2),
        pauseFor: const Duration(seconds: 6),
      ),
    );
  }

  void _onResult(SpeechRecognitionResult result) {
    final text = joinDictation(_base, result.recognizedWords);
    widget.controller.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  void _onStatus(String status) {
    if ((status == 'done' || status == 'notListening') && mounted) {
      setState(() => _listening = false);
    }
  }

  void _onError(SpeechRecognitionError error) {
    if (!mounted) return;
    setState(() => _listening = false);
    _showMessage(dictationErrorMessage(error.errorMsg));
  }

  void _showMessage(String? message) {
    if (message == null || !mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return IconButton(
      tooltip: _listening ? '음성 입력 중지' : '음성으로 입력',
      onPressed: widget.enabled ? _toggle : null,
      isSelected: _listening,
      icon: const Icon(Icons.mic_none),
      selectedIcon: Icon(Icons.mic, color: colorScheme.error),
      style: _listening
          ? IconButton.styleFrom(backgroundColor: colorScheme.errorContainer)
          : null,
    );
  }
}
