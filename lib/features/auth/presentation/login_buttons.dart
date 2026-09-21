import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart' show AppleLogoPainter;

const double _buttonHeight = 44;

/// 4개 로그인 버튼 공통 글자 크기. Google 규정(14)과 Kakao 규정(컨테이너 높이의 1/3 이하 = 14.6)을 모두 만족하는 값.
const double _labelFontSize = 14;

/// 로딩 중에는 탭을 무시하고 흐리게 보여주는 공통 래퍼.
class _LoginButtonFrame extends StatelessWidget {
  const _LoginButtonFrame({
    required this.label,
    required this.enabled,
    required this.onPressed,
    required this.color,
    required this.radius,
    required this.child,
    this.borderColor,
  });

  final String label;
  final bool enabled;
  final VoidCallback onPressed;
  final Color color;
  final double radius;
  final Color? borderColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
      side: borderColor == null ? BorderSide.none : BorderSide(color: borderColor!),
    );
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: SizedBox(
          height: _buttonHeight,
          child: Material(
            color: color,
            shape: shape,
            clipBehavior: Clip.antiAlias,
            child: InkWell(onTap: enabled ? onPressed : null, child: child),
          ),
        ),
      ),
    );
  }
}

/// Google 브랜딩 가이드: 모서리 4, 로고 20x20, 라이트/다크 색 분기.
class GoogleLoginButton extends StatelessWidget {
  const GoogleLoginButton({super.key, required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  static const label = 'Google 계정으로 로그인';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isIos = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    final padding = isIos ? 16.0 : 12.0;
    return _LoginButtonFrame(
      label: label,
      enabled: enabled,
      onPressed: onPressed,
      color: isDark ? const Color(0xFF131314) : const Color(0xFFFFFFFF),
      borderColor: isDark ? const Color(0xFF8E918F) : const Color(0xFF747775),
      radius: 4,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: padding),
        child: Row(
          children: [
            Image.asset('assets/login/google_g.png', width: 20, height: 20, fit: BoxFit.contain),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: _labelFontSize,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFFE3E3E3) : const Color(0xFF1F1F1F),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Apple HIG: 라이트 배경엔 Black, 다크 배경엔 White 스타일(로고·글자는 배경과 반대색 하나만 사용).
/// 로고는 패키지가 공개한 [AppleLogoPainter]를 쓰고, 크기는 공식 버튼 이미지 계측값(약 11x14, 높이 44 기준)에 맞춘다.
/// 다른 로그인 버튼과 같은 배치(로고 왼쪽 정렬, 글자 가운데)로 그린다.
class AppleLoginButton extends StatelessWidget {
  const AppleLoginButton({super.key, required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  static const label = 'Apple로 로그인';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final foreground = isDark ? const Color(0xFF000000) : const Color(0xFFFFFFFF);
    return _LoginButtonFrame(
      label: label,
      enabled: enabled,
      onPressed: onPressed,
      color: isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000),
      radius: 8,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            SizedBox(
              width: 11.5,
              height: 14,
              child: CustomPaint(painter: AppleLogoPainter(color: foreground)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: _labelFontSize, fontWeight: FontWeight.w500, color: foreground),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Kakao 디자인 가이드: #FEE500, 모서리 12, 심볼 높이 18(원본 36:34 비율), 왼쪽 여백 14. 다크에서도 동일.
class KakaoLoginButton extends StatelessWidget {
  const KakaoLoginButton({super.key, required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  static const label = '카카오 로그인';

  @override
  Widget build(BuildContext context) {
    return _LoginButtonFrame(
      label: label,
      enabled: enabled,
      onPressed: onPressed,
      color: const Color(0xFFFEE500),
      radius: 12,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.only(left: 14),
              child: Image.asset('assets/login/kakao_symbol.png', height: 18, fit: BoxFit.contain),
            ),
          ),
          const Text(label, style: TextStyle(fontSize: _labelFontSize, color: Color(0xD9000000))),
        ],
      ),
    );
  }
}

/// GitHub 브랜드 가이드는 로고(흰색/검정)만 규정. 버튼 규격·문구는 제안값.
class GithubLoginButton extends StatelessWidget {
  const GithubLoginButton({super.key, required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  static const label = 'GitHub로 로그인';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _LoginButtonFrame(
      label: label,
      enabled: enabled,
      onPressed: onPressed,
      color: isDark ? const Color(0xFFFFFFFF) : const Color(0xFF24292F),
      borderColor: isDark ? const Color(0xFFD0D7DE) : null,
      radius: 8,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16),
        child: Row(
          children: [
            Image.asset(
              isDark ? 'assets/login/github_invertocat_black.png' : 'assets/login/github_invertocat_white.png',
              height: 20,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: _labelFontSize,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFF1F2328) : const Color(0xFFFFFFFF),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
