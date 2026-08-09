/// API base URLs, overridable at build/run time with:
///   flutter run --dart-define=API_URL=http://10.0.2.2:4000
/// (10.0.2.2 is how the Android emulator reaches the host machine's localhost.)
class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:4000');
  static const socketUrl = String.fromEnvironment('SOCKET_URL', defaultValue: 'http://10.0.2.2:4000');
}
