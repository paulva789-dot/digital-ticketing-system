class Ticket {
  final String id;
  final int number;
  final String serviceId;
  final String status;
  final int? position;

  Ticket({
    required this.id,
    required this.number,
    required this.serviceId,
    required this.status,
    this.position,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) => Ticket(
        id: json['id'] as String,
        number: json['number'] as int,
        serviceId: json['serviceId'] as String,
        status: json['status'] as String,
        position: json['position'] as int?,
      );

  Ticket copyWith({String? status}) => Ticket(
        id: id,
        number: number,
        serviceId: serviceId,
        status: status ?? this.status,
        position: position,
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
