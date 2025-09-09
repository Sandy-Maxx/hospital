export function formatDateYYMMDD(d: Date | string | number): string {
  const date = new Date(d);
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function tailId(id: string, n = 6): string {
  return (id || "").slice(-n).toUpperCase();
}

// Consistent Bill Number formatting
// Prefer persisted bill.billNumber; otherwise derive a stable display number from createdAt and id tail
export function formatBillNumber(bill: {
  billNumber?: string | null;
  id: string;
  createdAt?: string | Date;
}): string {
  if (bill?.billNumber) return bill.billNumber;
  const created = bill?.createdAt ? new Date(bill.createdAt) : new Date();
  return `BILL-${formatDateYYMMDD(created)}-${tailId(bill.id, 6)}`;
}

// Consistent Prescription Number formatting
export function formatPrescriptionNumber(presc: {
  id: string;
  createdAt?: string | Date;
}): string {
  const created = presc?.createdAt ? new Date(presc.createdAt) : new Date();
  return `PR-${formatDateYYMMDD(created)}-${tailId(presc.id, 6)}`;
}
