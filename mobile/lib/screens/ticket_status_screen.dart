import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models/ticket.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';

class TicketStatusScreen extends StatefulWidget {
  final Ticket ticket;
  const TicketStatusScreen({super.key, required this.ticket});

  @override
  State<TicketStatusScreen> createState() => _TicketStatusScreenState();
}

class _TicketStatusScreenState extends State<TicketStatusScreen> {
  final _api = ApiClient();
  final _socket = QueueSocket();
  late Ticket _ticket;
  QueueStatus? _queueStatus;

  @override
  void initState() {
    super.initState();
    _ticket = widget.ticket;
    _api.getQueueStatus(_ticket.serviceId).then((s) {
      if (mounted) setState(() => _queueStatus = s);
    });
    _socket.connect(
      serviceId: _ticket.serviceId,
      onQueueUpdate: (status) {
        if (mounted) setState(() => _queueStatus = status);
      },
      onTicketCalled: (ticketId) {
        if (ticketId == _ticket.id && mounted) {
          setState(() => _ticket = _ticket.copyWith(status: 'CALLED'));
        }
      },
    );
  }

  @override
  void dispose() {
    _socket.dispose(_ticket.serviceId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final status = _queueStatus;
    return Scaffold(
      appBar: AppBar(title: const Text('Your ticket')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text(
                _ticket.status == 'CALLED' ? "It's your turn!" : "You're in the queue",
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              Text('Status: ${_ticket.status}', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 24),
              QrImageView(data: _ticket.id, size: 220),
              const SizedBox(height: 24),
              if (status != null)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _StatTile(label: 'Your number', value: '${_ticket.number}'),
                    _StatTile(label: 'Now serving', value: '${status.nowServing ?? '—'}'),
                    _StatTile(label: 'Est. wait', value: '${status.estimatedWaitMin}m'),
                  ],
                )
              else
                const CircularProgressIndicator(),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  const _StatTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineMedium),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
