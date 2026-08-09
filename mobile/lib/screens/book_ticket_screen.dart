import 'package:flutter/material.dart';

import '../models/service.dart';
import '../services/api_client.dart';
import 'ticket_status_screen.dart';

class BookTicketScreen extends StatefulWidget {
  final Service service;
  const BookTicketScreen({super.key, required this.service});

  @override
  State<BookTicketScreen> createState() => _BookTicketScreenState();
}

class _BookTicketScreenState extends State<BookTicketScreen> {
  final _api = ApiClient();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final (ticket, _) = await _api.createTicket(
        widget.service.id,
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => TicketStatusScreen(ticket: ticket)),
      );
    } catch (err) {
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Book: ${widget.service.name}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email (optional)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone (optional, for SMS alerts)'),
            ),
            const SizedBox(height: 20),
            if (_error != null) Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? 'Booking...' : 'Get my ticket'),
            ),
          ],
        ),
      ),
    );
  }
}
