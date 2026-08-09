import 'package:flutter/material.dart';

import 'screens/home_screen.dart';

void main() {
  runApp(const TicketingApp());
}

class TicketingApp extends StatelessWidget {
  const TicketingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Digital Ticketing',
      theme: ThemeData(colorSchemeSeed: const Color(0xFF0F172A), useMaterial3: true),
      home: const HomeScreen(),
    );
  }
}
