import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/service.dart';
import '../models/ticket.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiClient {
  Future<T> _send<T>(Future<http.Response> Function() call, T Function(dynamic) parse) async {
    final http.Response res;
    try {
      res = await call().timeout(const Duration(seconds: 10));
    } catch (_) {
      throw ApiException('Could not reach the server. Check your connection and try again.');
    }
    final body = res.body.isNotEmpty ? jsonDecode(res.body) : null;
    if (res.statusCode >= 400) {
      throw ApiException(body?['error'] as String? ?? 'Request failed (${res.statusCode})');
    }
    return parse(body);
  }

  Future<List<Service>> listServices() => _send(
        () => http.get(Uri.parse('${AppConfig.apiUrl}/api/services')),
        (body) => (body as List).map((s) => Service.fromJson(s as Map<String, dynamic>)).toList(),
      );

  Future<(Ticket, String)> createTicket(
    String serviceId, {
    String? email,
    String? phone,
    int quantity = 1,
    SeatType seatType = SeatType.standard,
    DateTime? scheduledAt,
  }) =>
      _send(
        () => http.post(
          Uri.parse('${AppConfig.apiUrl}/api/tickets'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'serviceId': serviceId,
            'channel': 'APP',
            'quantity': quantity,
            'seatType': seatTypeToJson(seatType),
            if (email != null && email.isNotEmpty) 'contactEmail': email,
            if (phone != null && phone.isNotEmpty) 'contactPhone': phone,
            if (scheduledAt != null) 'scheduledAt': scheduledAt.toIso8601String(),
          }),
        ),
        (body) => (Ticket.fromJson(body['ticket'] as Map<String, dynamic>), body['qrCode'] as String),
      );

  Future<Ticket> getTicket(String id) => _send(
        () => http.get(Uri.parse('${AppConfig.apiUrl}/api/tickets/$id')),
        (body) => Ticket.fromJson(body as Map<String, dynamic>),
      );

  Future<Ticket> cancelTicket(String id) => _send(
        () => http.post(Uri.parse('${AppConfig.apiUrl}/api/tickets/$id/cancel')),
        (body) => Ticket.fromJson(body as Map<String, dynamic>),
      );

  Future<QueueStatus> getQueueStatus(String serviceId) => _send(
        () => http.get(Uri.parse('${AppConfig.apiUrl}/api/queue/$serviceId')),
        (body) => QueueStatus.fromJson(body as Map<String, dynamic>),
      );
}
