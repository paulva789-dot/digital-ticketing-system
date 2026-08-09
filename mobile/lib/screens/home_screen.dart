import 'package:flutter/material.dart';

import '../models/service.dart';
import '../services/api_client.dart';
import 'book_ticket_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiClient();
  late Future<List<Service>> _services;

  @override
  void initState() {
    super.initState();
    _services = _api.listServices();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose a service')),
      body: FutureBuilder<List<Service>>(
        future: _services,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Failed to load services: ${snapshot.error}'));
          }
          final services = snapshot.data ?? [];
          if (services.isEmpty) {
            return const Center(child: Text('No services available yet.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: services.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final service = services[i];
              return Card(
                child: ListTile(
                  title: Text(service.name),
                  subtitle: service.description != null ? Text(service.description!) : null,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => BookTicketScreen(service: service)),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
