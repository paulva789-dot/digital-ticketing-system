import QRCode from "qrcode";

/** Returns a data: URL PNG encoding the ticket id, ready to drop into an <img src>. */
export function generateTicketQrCode(ticketId: string): Promise<string> {
  return QRCode.toDataURL(ticketId, { errorCorrectionLevel: "M", margin: 1, width: 320 });
}
