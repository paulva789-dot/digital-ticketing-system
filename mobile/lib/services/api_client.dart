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
    final res = await call();
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

  Future<(Ticket, String)> createTicket(String serviceId, {String? email, String? phone}) => _send(
        () => http.post(
          Uri.parse('${AppConfig.apiUrl}/api/tickets'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'serviceId': serviceId,
            'channel': 'APP',
            if (email != null && email.isNotEmpty) 'contactEmail': email,
            if (phone != null && phone.isNotEmpty) 'contactPhone': phone,
          }),
        ),
        (body) => (Ticket.fromJson(body['ticket'] as Map<String, dynamic>), body['qrCode'] as String),
      );

  Future<Ticket> getTicket(String id) => _send(
        () => http.get(Uri.parse('${AppConfig.apiUrl}/api/tickets/$id')),
        (body) => Ticket.fromJson(body as Map<String, dynamic>),
      );

  Future<QueueStatus> getQueueStatus(String serviceId) => _send(
        () => http.get(Uri.parse('${AppConfig.apiUrl}/api/queue/$serviceId')),
        (body) => QueueStatus.fromJson(body as Map<String, dynamic>),
      );
}
