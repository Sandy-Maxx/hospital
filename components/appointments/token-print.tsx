"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";

interface TokenPrintProps {
  appointment: {
    id: string;
    tokenNumber: string;
    patient: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    doctor?: {
      name: string;
      department: string;
    };
    session: {
      name: string;
      date?: string;
      startTime: string;
      endTime: string;
    };
    status: string;
    priority: string;
    createdAt: string;
  };
  hospitalSettings: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    tokenPrefix: string;
  };
  onClose?: () => void;
}

export default function TokenPrint({
  appointment,
  hospitalSettings,
  onClose,
}: TokenPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const handlePrint = async () => {
    const root = printRef.current;
    if (!root) return;

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(root as HTMLElement, {
      scale: 3, // higher scale for sharper QR
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    const w = window.open("", "_blank");
    if (!w) return;

    // Minimal printable HTML that sizes image to 80mm width for compact printouts
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Token - ${appointment.tokenNumber}</title>
          <style>
            @page { margin: 5mm; }
            body { margin: 0; padding: 0; text-align: center; }
            img { width: 80mm; height: auto; }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Token" />
          <script>window.onload = function(){ window.focus(); window.print(); setTimeout(()=>window.close(), 300); }<\/script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // Download as PDF using html2canvas + jsPDF
  const handleScreenshotDownload = async () => {
    const root = printRef.current;
    if (!root) return;

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(root as HTMLElement, {
      scale: 3, // high DPI for crisp QR
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = imgData;
    a.download = `token-${appointment.tokenNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const qrData = JSON.stringify({
    tokenNumber: appointment.tokenNumber,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    doctorName: appointment.doctor?.name || "Not Assigned",
    sessionName: appointment.session.name,
    appointmentTime: `${appointment.session.startTime} - ${appointment.session.endTime}`,
    status: appointment.status,
    priority: appointment.priority,
  });

  // Pre-render QR to PNG to ensure html2canvas captures it fully
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const QR = (await import("qrcode")).default;
        const url = await QR.toDataURL(qrData, {
          width: 256,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        if (mounted) setQrUrl(url);
      } catch (e) {
        console.error("QR generation failed", e);
        if (mounted) setQrUrl(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [qrData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex space-x-2 justify-center mb-4">
          <Button onClick={handlePrint} className="flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            Print Token
          </Button>
          <Button
            onClick={handleScreenshotDownload}
            variant="outline"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Save PNG
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex items-center"
            >
              Close
            </Button>
          )}
        </div>

        {/* Token Preview */}
        <div
          ref={printRef}
          className="token-container max-w-md mx-auto border-2 border-gray-300 rounded-lg p-6 bg-white shadow-lg"
        >
          {/* Header */}
          <div className="header text-center border-b-2 border-gray-200 pb-4 mb-4">
            {hospitalSettings.logo && (
              <img
                src={hospitalSettings.logo}
                alt="Hospital Logo"
                className="mx-auto mb-2"
                style={{ maxHeight: 64, width: "auto", objectFit: "contain" }}
              />
            )}
            <div className="hospital-name text-2xl font-bold text-blue-600 mb-1">
              {hospitalSettings.name}
            </div>
            <div className="tagline text-sm text-gray-600 mb-2">
              {hospitalSettings.tagline}
            </div>
            <div className="contact-info text-xs text-gray-500">
              <div>
                {hospitalSettings.phone} | {hospitalSettings.email}
              </div>
              <div>{hospitalSettings.address}</div>
            </div>
          </div>

          {/* Token Number */}
          <div className="token-number text-4xl md:text-5xl font-bold text-center text-blue-600 my-6 p-4 border-4 border-blue-600 rounded-lg bg-blue-50">
            {appointment.tokenNumber}
          </div>

          {/* Patient Information */}
          <div className="patient-info mb-4">
            <h3 className="font-bold text-gray-800 mb-2">Patient Details</h3>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Name:</span>
              <span className="value">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </span>
            </div>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Phone:</span>
              <span className="value">{appointment.patient.phone}</span>
            </div>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Priority:</span>
              <span
                className={`priority-badge priority-${appointment.priority.toLowerCase()}`}
              >
                {appointment.priority}
              </span>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="appointment-info mb-4">
            <h3 className="font-bold text-gray-800 mb-2">
              Appointment Details
            </h3>
            <div className="info-row">
              <span className="label">Doctor:</span>
              <span>Dr. {appointment.doctor?.name || "Not Assigned"}</span>
            </div>
            <div className="info-row">
              <span className="label">Department:</span>
              <span>{appointment.doctor?.department || "General"}</span>
            </div>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Session:</span>
              <span className="value">{appointment.session.name}</span>
            </div>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Date:</span>
              <span className="value">
                {formatDate(appointment.session.date || appointment.createdAt)}
              </span>
            </div>
            <div className="info-row flex justify-between text-sm">
              <span className="label font-semibold">Time:</span>
              <span className="value">
                {formatTime(appointment.session.startTime)} -{" "}
                {formatTime(appointment.session.endTime)}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-section text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <QrCode className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Scan for Details
              </span>
            </div>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="mx-auto block"
                style={{ width: 128, height: 128 }}
              />
            ) : (
              <div className="text-xs text-gray-500 text-center">
                Generating QR...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
            <div>Please arrive 15 minutes before your session time</div>
            <div>Token generated on: {formatDate(appointment.createdAt)}</div>
            <div className="mt-1 font-semibold">
              Keep this token safe for your appointment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
