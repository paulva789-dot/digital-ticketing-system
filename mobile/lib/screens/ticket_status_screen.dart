import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/ticket.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';

class TicketStatusScreen extends StatefulWidget {
  final Ticket ticket;
  final String? qrCode;
  const TicketStatusScreen({super.key, required this.ticket, this.qrCode});

  @override
  State<TicketStatusScreen> createState() => _TicketStatusScreenState();
}

class _TicketStatusScreenState extends State<TicketStatusScreen> {
  final _api = ApiClient();
  final _socket = QueueSocket();
  late Ticket _ticket;
  QueueStatus? _queueStatus;
  bool _cancelling = false;

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

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel ticket?'),
        content: const Text('This will give up your place in the queue.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep ticket')),
          FilledButton.tonal(onPressed: () => Navigator.pop(context, true), child: const Text('Cancel ticket')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancelling = true);
    try {
      final updated = await _api.cancelTicket(_ticket.id);
      if (mounted) setState(() => _ticket = updated);
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$err')));
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  Future<void> _openPaymentOnWeb() async {
    final uri = Uri.parse('${AppConfig.webUrl}/ticket/${_ticket.id}');
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Couldn\'t open $uri — visit it manually to pay.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final status = _queueStatus;
    final cancelled = _ticket.status == 'CANCELLED';
    final calledUp = _ticket.status == 'CALLED';

    return Scaffold(
      appBar: AppBar(title: const Text('Your ticket')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Column(
                key: ValueKey(_ticket.status),
                children: [
                  Text(
                    cancelled
                        ? 'Ticket cancelled'
                        : calledUp
                            ? "It's your turn!"
                            : "You're in the queue",
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Status: ${_ticket.status}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            if (_ticket.scheduledAt != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('📅 ${_ticket.scheduledAt}', style: Theme.of(context).textTheme.bodySmall),
              ),
            const SizedBox(height: 24),

            if (!cancelled)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: widget.qrCode != null && widget.qrCode!.startsWith('data:image')
                    ? Image.memory(_decodeDataUri(widget.qrCode!), width: 200, height: 200)
                    : QrImageView(data: _ticket.id, size: 200),
              ),
            const SizedBox(height: 24),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _SummaryRow(label: 'Seat type', value: _ticket.seatType == SeatType.frontRow ? 'Front Row' : 'Standard'),
                  _SummaryRow(label: 'Quantity', value: '${_ticket.quantity}'),
                  if (_ticket.discountPct > 0)
                    _SummaryRow(label: 'Discount', value: '-${_ticket.discountPct.toStringAsFixed(0)}%'),
                  _SummaryRow(label: 'Total', value: '\$${_ticket.totalPrice.toStringAsFixed(2)}', emphasize: true),
                  if (_ticket.balanceDue > 0)
                    _SummaryRow(label: 'Balance due', value: '\$${_ticket.balanceDue.toStringAsFixed(2)}'),
                ],
              ),
            ),

            if (!cancelled && _ticket.balanceDue > 0) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: scheme.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.credit_card, color: scheme.primary, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Payment is completed on our website (MTN MoMo, Orange Money, Stripe, Flutterwave, or a free trial).',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _openPaymentOnWeb,
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: const Text('Pay on website'),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (!cancelled && status != null) ...[
              const SizedBox(height: 24),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _StatTile(label: 'Your number', value: '${_ticket.number}'),
                  _StatTile(label: 'Now serving', value: '${status.nowServing ?? '—'}', highlight: status.nowServing != null),
                  _StatTile(label: 'People ahead', value: '${_ticket.position ?? status.waitingCount}'),
                  _StatTile(label: 'Est. wait', value: '${status.estimatedWaitMin}m'),
                ],
              ),
            ] else if (!cancelled)
              const Padding(
                padding: EdgeInsets.only(top: 24),
                child: CircularProgressIndicator(),
              ),

            if (!cancelled && (_ticket.status == 'WAITING' || _ticket.status == 'CALLED')) ...[
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _cancelling ? null : _cancel,
                  style: OutlinedButton.styleFrom(foregroundColor: scheme.error, side: BorderSide(color: scheme.error)),
                  child: Text(_cancelling ? 'Cancelling...' : 'Cancel ticket'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

Uint8List _decodeDataUri(String dataUri) {
  final base64Part = dataUri.split(',').last;
  return base64Decode(base64Part);
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool emphasize;
  const _SummaryRow({required this.label, required this.value, this.emphasize = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
          Text(
            value,
            style: emphasize
                ? Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)
                : Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  const _StatTile({required this.label, required this.value, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: highlight ? scheme.primaryContainer : scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}
