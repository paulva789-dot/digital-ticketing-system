import 'package:flutter/material.dart';

import '../models/service.dart';
import '../models/ticket.dart';
import '../services/api_client.dart';
import 'ticket_status_screen.dart';

int discountPctForQuantity(int quantity) {
  if (quantity >= 5) return 20;
  if (quantity >= 2) return 10;
  return 0;
}

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
  SeatType _seatType = SeatType.standard;
  int _quantity = 1;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  String? get _frontRowBlockedReason {
    final service = widget.service;
    if (_seatType != SeatType.frontRow) return null;
    if (service.frontRowRemaining <= 0) return 'Sold out.';
    if (!service.isFrontRowWindowOpen) {
      return 'Front-row tickets are only bookable within ${service.frontRowWindowDays} days of release.';
    }
    return null;
  }

  double get _unitPrice => widget.service.price + (_seatType == SeatType.frontRow ? widget.service.frontRowSurcharge : 0);
  int get _discountPct => discountPctForQuantity(_quantity);
  double get _totalPrice => _unitPrice * _quantity * (1 - _discountPct / 100);

  Future<void> _submit() async {
    if (_frontRowBlockedReason != null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final (ticket, qrCode) = await _api.createTicket(
        widget.service.id,
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        quantity: _quantity,
        seatType: _seatType,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => TicketStatusScreen(ticket: ticket, qrCode: qrCode)),
      );
    } catch (err) {
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final blocked = _frontRowBlockedReason;

    return Scaffold(
      appBar: AppBar(title: Text(widget.service.name)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Text('Seat type', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _SeatOption(
                  label: 'Standard',
                  price: widget.service.price,
                  selected: _seatType == SeatType.standard,
                  onTap: () => setState(() => _seatType = SeatType.standard),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SeatOption(
                  label: 'Front Row',
                  price: widget.service.price + widget.service.frontRowSurcharge,
                  caption: '${widget.service.frontRowRemaining} left',
                  selected: _seatType == SeatType.frontRow,
                  onTap: () => setState(() => _seatType = SeatType.frontRow),
                ),
              ),
            ],
          ),
          if (blocked != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(blocked, style: TextStyle(color: scheme.error, fontSize: 13)),
            ),
          const SizedBox(height: 24),
          Text('Number of tickets', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton.filledTonal(
                onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                icon: const Icon(Icons.remove),
              ),
              Expanded(
                child: Center(
                  child: Text('$_quantity', style: Theme.of(context).textTheme.headlineSmall),
                ),
              ),
              IconButton.filledTonal(
                onPressed: _quantity < 10 ? () => setState(() => _quantity++) : null,
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          if (_discountPct > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Center(
                child: Text(
                  '🎉 $_discountPct% multi-ticket discount applied',
                  style: TextStyle(color: Colors.green.shade600, fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ),
          const SizedBox(height: 24),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email (optional)',
              hintText: 'you@example.com',
              prefixIcon: Icon(Icons.mail_outline),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone (optional, for SMS alerts)',
              prefixIcon: Icon(Icons.sms_outlined),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total'),
                Text(
                  '\$${_totalPrice.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_error!, style: TextStyle(color: scheme.error)),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: (_submitting || blocked != null) ? null : _submit,
            child: Text(_submitting ? 'Booking...' : 'Get my ticket'),
          ),
        ],
      ),
    );
  }
}

class _SeatOption extends StatelessWidget {
  final String label;
  final double price;
  final String? caption;
  final bool selected;
  final VoidCallback onTap;

  const _SeatOption({
    required this.label,
    required this.price,
    this.caption,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? scheme.primaryContainer : scheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? scheme.primary : scheme.outlineVariant, width: selected ? 2 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? scheme.onPrimaryContainer : null)),
            const SizedBox(height: 2),
            Text(
              '\$${price.toStringAsFixed(2)}${caption != null ? ' · $caption' : ''}',
              style: TextStyle(
                fontSize: 12,
                color: selected ? scheme.onPrimaryContainer.withValues(alpha: 0.8) : scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
