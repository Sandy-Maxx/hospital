import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function TokenInfoPage({ params }: { params: { token: string } }) {
  const token = decodeURIComponent(params.token || "");

  let appointment: any | null = null;
  try {
    appointment = await prisma.appointment.findFirst({
      where: { tokenNumber: token },
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { select: { name: true, department: true } },
        session: { select: { name: true, date: true, startTime: true, endTime: true } },
      },
    });
  } catch (e) {
    appointment = null;
  }

  const formatTime = (time: string | null | undefined) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-700 text-xl font-bold">
              {token || "Token"}
            </div>
          </div>

          {!appointment ? (
            <div className="text-center text-gray-600">
              Token details not found.
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Patient</span>
                <span className="font-semibold text-gray-900">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Session</span>
                <span className="font-semibold text-gray-900">
                  {appointment.session?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(appointment.session?.date || appointment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-semibold text-gray-900">
                  {formatTime(appointment.session?.startTime)} - {formatTime(appointment.session?.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-gray-900">
                  {appointment.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Priority</span>
                <span className="font-semibold text-gray-900">
                  {appointment.priority}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-500">
            Hospital Token Viewer
          </div>
        </div>
      </div>
    </div>
  );
}

