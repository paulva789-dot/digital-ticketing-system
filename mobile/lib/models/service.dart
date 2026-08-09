class Service {
  final String id;
  final String name;
  final String? description;
  final int avgServiceTimeMin;

  Service({required this.id, required this.name, this.description, required this.avgServiceTimeMin});

  factory Service.fromJson(Map<String, dynamic> json) => Service(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        avgServiceTimeMin: json['avgServiceTimeMin'] as int,
      );
}
