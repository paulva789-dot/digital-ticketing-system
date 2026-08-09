import 'package:flutter_test/flutter_test.dart';

import 'package:ticketing_mobile/main.dart';

void main() {
  testWidgets('renders the service selection title', (WidgetTester tester) async {
    await tester.pumpWidget(const TicketingApp());
    await tester.pump();

    expect(find.text('Choose a service'), findsOneWidget);
  });
}
