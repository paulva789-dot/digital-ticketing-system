import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// API base URLs, overridable at build/run time with:
///   flutter run --dart-define=API_URL=http://192.168.1.23:4000
///
/// The default picks the right "localhost" for wherever the app is running:
///  - Android emulator can't see the host's localhost directly; it's reachable at 10.0.2.2.
///  - Web, Windows/macOS/Linux desktop, and iOS simulator all share the host's
///    network namespace, so plain localhost works.
/// A physical device (real phone) can never reach a dev machine's localhost —
/// pass `--dart-define=API_URL=http://your-lan-ip:4000` when running on one.
String get _defaultHost {
  if (kIsWeb) return 'localhost';
  if (Platform.isAndroid) return '10.0.2.2';
  return 'localhost';
}

class AppConfig {
  static final apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://$_defaultHost:4000');
  static final socketUrl = String.fromEnvironment('SOCKET_URL', defaultValue: 'http://$_defaultHost:4000');

  /// The web app's base URL. Payment (MTN MoMo, Orange Money, Stripe,
  /// Flutterwave, free trial) is web-only by design — the app hands off to a
  /// browser for it instead of embedding a payment flow. Override with
  /// `--dart-define=WEB_URL=https://your-deployed-frontend.example`.
  static final webUrl = String.fromEnvironment('WEB_URL', defaultValue: 'http://$_defaultHost:5173');
}
