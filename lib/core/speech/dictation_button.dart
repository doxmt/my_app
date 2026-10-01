import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'dictation.dart';

/// 음성 입력 버튼. 누르면 말하는 동안 인식된 글이 [controller] 뒤에 채워지고,
/// 사용자가 확인·수정한 뒤 직접 전송한다. 기기 내장 음성인식을 쓰며 앱 서버로 보내는 것은 없다.
/// [enabled]가 꺼지면(전송 중 등) 진행 중인 인식을 취소한다.
///
/// 듣는 동안에는 버튼이 빨갛게 채워지며 파동이 퍼지고 "듣는 중…" 라벨이 보인다.
/// [listening]을 넘기면 듣는 중 여부가 거기에 반영되어, 입력창도 함께 강조할 수 있다.
class DictationButton extends StatefulWidget {
  const DictationButton({super.key, required this.controller, this.enabled = true, this.listening});

  final TextEditingController controller;
  final bool enabled;
  final ValueNotifier<bool>? listening;

  @override
  State<DictationButton> createState() => _DictationButtonState();
}

class _DictationButtonState extends State<DictationButton> with SingleTickerProviderStateMixin {
  final _speech = SpeechToText();
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));
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
    _pulse.dispose();
    super.dispose();
  }

  /// 듣는 중 상태를 한 곳에서 바꾼다(화면 상태, 공유 알림, 파동 애니메이션).
  void _setListening(bool value) {
    if (_listening == value) return;
    _listening = value;
    widget.listening?.value = value;
    if (!mounted) return;
    if (value && !MediaQuery.of(context).disableAnimations) {
      _pulse.repeat();
    } else {
      _pulse.stop();
      _pulse.value = 0;
    }
    setState(() {});
  }

  void _cancel() {
    if (_initialized) {
      _speech.cancel();
    }
    if (_listening) {
      _listening = false;
      widget.listening?.value = false;
    }
  }

  Future<void> _toggle() async {
    if (_listening) {
      await _speech.stop();
      _setListening(false);
      return;
    }
    if (!_initialized) {
      _initialized = await _speech.initialize(onStatus: _onStatus, onError: _onError);
      if (!_initialized) {
        _showMessage(dictationErrorMessage('error_permission'));
        return;
      }
    }
    _base = widget.controller.text;
    _setListening(true);
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
    if (status == 'done' || status == 'notListening') {
      _setListening(false);
    }
  }

  void _onError(SpeechRecognitionError error) {
    _setListening(false);
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
    final button = IconButton(
      tooltip: _listening ? '음성 입력 중지' : '음성으로 입력',
      onPressed: widget.enabled ? _toggle : null,
      isSelected: _listening,
      icon: const Icon(Icons.mic_none),
      selectedIcon: const Icon(Icons.mic),
      style: _listening
          ? IconButton.styleFrom(backgroundColor: colorScheme.error, foregroundColor: colorScheme.onError)
          : null,
    );
    if (!_listening) return button;

    return Semantics(
      liveRegion: true,
      label: '음성을 듣고 있습니다',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: Tween<double>(begin: 1, end: 0.45).animate(_pulse),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.circle, size: 8, color: colorScheme.error),
                const SizedBox(width: 4),
                Text(
                  '듣는 중…',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(color: colorScheme.error),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              AnimatedBuilder(
                animation: _pulse,
                builder: (context, _) => Container(
                  width: 40 + 20 * _pulse.value,
                  height: 40 + 20 * _pulse.value,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colorScheme.error.withValues(alpha: 0.3 * (1 - _pulse.value)),
                  ),
                ),
              ),
              button,
            ],
          ),
        ],
      ),
    );
  }
}
