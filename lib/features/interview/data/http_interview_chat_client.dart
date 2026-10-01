// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/interview_chat_client.dart';
import '../domain/interview_message.dart';

/// `supabase_flutter`의 `functions.invoke()`는 스트리밍을 지원하지 않아
/// Function URL에 직접 POST하고 SSE를 수동 파싱한다 (ADR-013).
class HttpInterviewChatClient implements InterviewChatClient {
  HttpInterviewChatClient({
    required http.Client client,
    required String supabaseUrl,
    required String publishableKey,
    required Future<String> Function() deviceIdProvider,
    required Future<String?> Function() accessTokenProvider,
  }) : _client = client,
       _endpoint = Uri.parse('$supabaseUrl/functions/v1/interview-chat'),
       _publishableKey = publishableKey,
       _deviceIdProvider = deviceIdProvider,
       _accessTokenProvider = accessTokenProvider;

  final http.Client _client;
  final Uri _endpoint;
  final String _publishableKey;
  final Future<String> Function() _deviceIdProvider;

  /// 로그인 상태면 회원 액세스 토큰, 아니면 null. 세션을 watch하지 않고 요청 시점에 읽는다.
  final Future<String?> Function() _accessTokenProvider;

  void close() => _client.close();

  Future<Map<String, String>> _authHeaders() async {
    final deviceId = await _deviceIdProvider();
    final accessToken = await _accessTokenProvider();
    return {
      'apikey': _publishableKey,
      'Authorization': 'Bearer ${accessToken ?? _publishableKey}',
      'X-Device-Id': deviceId,
    };
  }

  UsageStatus _parseUsage(Map<String, dynamic> json) {
    if (json.containsKey('tier')) {
      return MemberUsageStatus(remaining: json['remaining'] as int? ?? 0);
    }
    return GuestUsageStatus(
      deviceRemaining: json['deviceRemaining'] as int? ?? 0,
      ipRemaining: json['ipRemaining'] as int? ?? 0,
    );
  }

  @override
  Future<UsageStatus> fetchUsage() async {
    final http.Response response;
    try {
      response = await _client.get(_endpoint, headers: await _authHeaders());
    } catch (_) {
      throw const InterviewNetworkException();
    }

    if (response.statusCode != 200) {
      throw const InterviewUpstreamException();
    }

    return _parseUsage(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Stream<String> streamReply({
    required String jobTitle,
    String jobPosting = '',
    required String resumeText,
    required List<InterviewMessage> history,
    required String message,
    void Function(UsageStatus usage)? onUsage,
  }) async* {
    final request = http.Request('POST', _endpoint)
      ..headers.addAll(await _authHeaders())
      ..headers['Content-Type'] = 'application/json'
      ..body = jsonEncode({
        'jobTitle': jobTitle,
        if (jobPosting.trim().isNotEmpty) 'jobPosting': jobPosting.trim(),
        'resumeText': resumeText,
        'history': history
            .map((item) => {'role': item.role.name, 'content': item.content})
            .toList(),
        'message': message,
      });

    final http.StreamedResponse response;
    try {
      response = await _client.send(request);
    } catch (_) {
      throw const InterviewNetworkException();
    }

    if (response.statusCode == 429) {
      final body = await response.stream.bytesToString();
      final json = jsonDecode(body) as Map<String, dynamic>;
      if (json.containsKey('tier')) {
        throw InterviewRateLimitedException.member(remaining: json['remaining'] as int? ?? 0);
      }
      throw InterviewRateLimitedException.guest(
        blockedBy: json['blockedBy'] as String?,
        deviceRemaining: json['deviceRemaining'] as int? ?? 0,
        ipRemaining: json['ipRemaining'] as int? ?? 0,
      );
    }

    if (response.statusCode != 200) {
      throw const InterviewUpstreamException();
    }

    var buffer = '';
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      buffer += chunk.replaceAll('\r\n', '\n');

      var separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex != -1) {
        final rawEvent = buffer.substring(0, separatorIndex);
        buffer = buffer.substring(separatorIndex + 2);

        final parsed = _parseEvent(rawEvent);
        separatorIndex = buffer.indexOf('\n\n');
        if (parsed == null) {
          continue;
        }

        final event = parsed.$1;
        final data = parsed.$2;
        switch (event) {
          case 'usage':
            onUsage?.call(_parseUsage(jsonDecode(data) as Map<String, dynamic>));
          case 'delta':
            final json = jsonDecode(data) as Map<String, dynamic>;
            final text = json['text'] as String?;
            if (text != null) {
              yield text;
            }
          case 'error':
            throw const InterviewUpstreamException();
          case 'done':
            return;
        }
      }
    }
  }

  (String, String)? _parseEvent(String rawEvent) {
    String? event;
    final dataLines = <String>[];
    for (final line in rawEvent.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.substring('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.add(line.substring('data:'.length).trim());
      }
    }
    if (event == null || dataLines.isEmpty) {
      return null;
    }
    return (event, dataLines.join('\n'));
  }
}
