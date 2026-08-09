class Service {
  final String id;
  final String name;
  final String? description;
  final int avgServiceTimeMin;
  final double price;
  final double frontRowSurcharge;
  final int frontRowStock;
  final int frontRowSold;
  final DateTime frontRowReleaseAt;
  final int frontRowWindowDays;

  Service({
    required this.id,
    required this.name,
    this.description,
    required this.avgServiceTimeMin,
    this.price = 0,
    this.frontRowSurcharge = 0,
    this.frontRowStock = 0,
    this.frontRowSold = 0,
    DateTime? frontRowReleaseAt,
    this.frontRowWindowDays = 3,
  }) : frontRowReleaseAt = frontRowReleaseAt ?? DateTime.now();

  int get frontRowRemaining => frontRowStock - frontRowSold;

  bool get isFrontRowWindowOpen {
    final closes = frontRowReleaseAt.add(Duration(days: frontRowWindowDays));
    final now = DateTime.now();
    return !now.isBefore(frontRowReleaseAt) && !now.isAfter(closes);
  }

  factory Service.fromJson(Map<String, dynamic> json) => Service(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        avgServiceTimeMin: json['avgServiceTimeMin'] as int,
        price: (json['price'] as num?)?.toDouble() ?? 0,
        frontRowSurcharge: (json['frontRowSurcharge'] as num?)?.toDouble() ?? 0,
        frontRowStock: json['frontRowStock'] as int? ?? 0,
        frontRowSold: json['frontRowSold'] as int? ?? 0,
        frontRowReleaseAt:
            json['frontRowReleaseAt'] != null ? DateTime.tryParse(json['frontRowReleaseAt'] as String) : null,
        frontRowWindowDays: json['frontRowWindowDays'] as int? ?? 3,
      );
}
