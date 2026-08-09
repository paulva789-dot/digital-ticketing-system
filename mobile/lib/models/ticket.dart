enum SeatType { standard, frontRow }

SeatType seatTypeFromJson(String? value) => value == 'FRONT_ROW' ? SeatType.frontRow : SeatType.standard;

String seatTypeToJson(SeatType type) => type == SeatType.frontRow ? 'FRONT_ROW' : 'STANDARD';

class Ticket {
  final String id;
  final int number;
  final String serviceId;
  final String status;
  final int? position;
  final SeatType seatType;
  final int quantity;
  final double totalPrice;
  final double amountPaid;
  final double discountPct;
  final DateTime? scheduledAt;

  Ticket({
    required this.id,
    required this.number,
    required this.serviceId,
    required this.status,
    this.position,
    this.seatType = SeatType.standard,
    this.quantity = 1,
    this.totalPrice = 0,
    this.amountPaid = 0,
    this.discountPct = 0,
    this.scheduledAt,
  });

  double get balanceDue => (totalPrice - amountPaid).clamp(0, double.infinity);
  bool get isActive => status == 'WAITING' || status == 'CALLED';

  factory Ticket.fromJson(Map<String, dynamic> json) => Ticket(
        id: json['id'] as String,
        number: json['number'] as int,
        serviceId: json['serviceId'] as String,
        status: json['status'] as String,
        position: json['position'] as int?,
        seatType: seatTypeFromJson(json['seatType'] as String?),
        quantity: json['quantity'] as int? ?? 1,
        totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0,
        amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0,
        discountPct: (json['discountPct'] as num?)?.toDouble() ?? 0,
        scheduledAt: json['scheduledAt'] != null ? DateTime.tryParse(json['scheduledAt'] as String) : null,
      );

  Ticket copyWith({String? status}) => Ticket(
        id: id,
        number: number,
        serviceId: serviceId,
        status: status ?? this.status,
        position: position,
        seatType: seatType,
        quantity: quantity,
        totalPrice: totalPrice,
        amountPaid: amountPaid,
        discountPct: discountPct,
        scheduledAt: scheduledAt,
      );
}

class QueueStatus {
  final int waitingCount;
  final int? nowServing;
  final int estimatedWaitMin;

  QueueStatus({required this.waitingCount, this.nowServing, required this.estimatedWaitMin});

  factory QueueStatus.fromJson(Map<String, dynamic> json) => QueueStatus(
        waitingCount: json['waitingCount'] as int,
        nowServing: json['nowServing'] as int?,
        estimatedWaitMin: json['estimatedWaitMin'] as int,
      );
}
