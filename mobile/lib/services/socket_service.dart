import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config.dart';
import '../models/ticket.dart';

class QueueSocket {
  io.Socket? _socket;

  void connect({
    required String serviceId,
    required void Function(QueueStatus) onQueueUpdate,
    required void Function(String ticketId) onTicketCalled,
  }) {
    final socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
    );
    _socket = socket;

    socket.onConnect((_) => socket.emit('queue:subscribe', serviceId));
    socket.on('queue:update', (data) => onQueueUpdate(QueueStatus.fromJson(Map<String, dynamic>.from(data))));
    socket.on('ticket:called', (data) => onTicketCalled(Map<String, dynamic>.from(data)['ticketId'] as String));

    socket.connect();
  }

  void dispose(String serviceId) {
    _socket?.emit('queue:unsubscribe', serviceId);
    _socket?.dispose();
    _socket = null;
  }
}
