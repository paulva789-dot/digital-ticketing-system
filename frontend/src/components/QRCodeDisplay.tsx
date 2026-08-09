interface Props {
  qrCode: string;
  label: string;
}

export function QRCodeDisplay({ qrCode, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={qrCode} alt={`QR code for ${label}`} className="w-48 h-48 rounded-lg border themed-border" />
      <span className="text-sm themed-muted">{label}</span>
    </div>
  );
}
