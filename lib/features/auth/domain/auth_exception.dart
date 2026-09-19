/// 로그인/로그아웃 동작에서 발생하는 예외. 화면에 그대로 보여줄 한국어 메시지를 담는다.
class AuthActionException implements Exception {
  const AuthActionException(this.message);

  final String message;
}
