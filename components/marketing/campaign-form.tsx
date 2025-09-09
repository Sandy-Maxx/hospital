"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CampaignForm({
  onClose,
  onSuccess,
  existing,
}: {
  onClose: () => void;
  onSuccess: () => void;
  existing?: any;
}) {
  const [name, setName] = useState(existing?.name || "");
  const [messageHtml, setMessageHtml] = useState<string>(
    existing?.messageHtml || existing?.message || "",
  );
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt || "");
  const [channels, setChannels] = useState<{
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  }>({
    email: (existing?.channels?.email ?? true) as boolean,
    sms: (existing?.channels?.sms ?? false) as boolean,
    whatsapp: (existing?.channels?.whatsapp ?? false) as boolean,
    push: (existing?.channels?.push ?? false) as boolean,
  });
  const [audience, setAudience] = useState<any>(
    existing?.audience || {
      selector: "ALL",
      period: "90d",
      gender: "",
      minAge: "",
      maxAge: "",
    },
  );
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && messageHtml)
      editorRef.current.innerHTML = messageHtml;
  }, [editorRef.current]);

  const toggleChannel = (key: keyof typeof channels) =>
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const ensureSelectionInside = () => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;
    let node: Node | null = sel.anchorNode;
    let inside = false;
    while (node) {
      if (node === editorRef.current) {
        inside = true;
        break;
      }
      node = node.parentNode;
    }
    if (!inside) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editorRef.current.focus();
    }
  };

  const perform = (cmd: string, val?: string) => {
    if (!editorRef.current) return;
    ensureSelectionInside();
    document.execCommand(cmd, false, val);
  };

  const buildPayload = () => ({
    name: name || "Campaign",
    messageHtml: editorRef.current?.innerHTML || messageHtml || "",
    channels,
    audience,
    scheduledAt: scheduledAt || null,
  });

  const submit = async () => {
    const payload = buildPayload();
    if (!payload.messageHtml.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        existing?.id
          ? `/api/marketing/campaigns/${existing.id}`
          : "/api/marketing/campaigns",
        {
          method: existing?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold">
            {existing ? "Edit Campaign" : "New Campaign"}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Campaign name"
            />
          </div>
          <div>
            <Label>Message</Label>
            {/* Toolbar */}
            <div className="sticky top-[52px] bg-white z-10 flex flex-wrap items-center gap-2 mb-2 text-sm py-2">
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("bold")}
              >
                Bold
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("italic")}
              >
                Italic
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("underline")}
              >
                Underline
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("removeFormat")}
              >
                Clear
              </button>
              <span className="mx-1 text-gray-400">|</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("formatBlock", "H1")}
              >
                H1
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("formatBlock", "H2")}
              >
                H2
              </button>
              <span className="mx-1 text-gray-400">|</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("insertUnorderedList")}
              >
                Bulleted
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("insertOrderedList")}
              >
                Numbered
              </button>
              <span className="mx-1 text-gray-400">|</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("justifyLeft")}
              >
                Left
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("justifyCenter")}
              >
                Center
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("justifyRight")}
              >
                Right
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("justifyFull")}
              >
                Justify
              </button>
              <span className="mx-1 text-gray-400">|</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => perform("createLink", prompt("Enter URL") || "")}
              >
                Link
              </button>
              <input
                type="color"
                onChange={(e) => perform("foreColor", e.target.value)}
                title="Text color"
              />
            </div>

            {/* Template Snippets */}
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span className="text-gray-500">Snippets:</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const html = `<h2>Appointment Reminder</h2><p>Dear {{PATIENT_NAME}},</p><p>This is a friendly reminder for your upcoming appointment at our hospital. If you need to reschedule, please contact us.</p><p>Regards,<br/>Hospital Team</p>`;
                  if (editorRef.current) {
                    editorRef.current.focus();
                    editorRef.current.innerHTML += html;
                  }
                }}
              >
                Appointment Reminder
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const html = `<h2>Health Tips</h2><ul><li>Stay hydrated.</li><li>Exercise regularly.</li><li>Maintain a balanced diet.</li></ul>`;
                  if (editorRef.current) {
                    editorRef.current.focus();
                    editorRef.current.innerHTML += html;
                  }
                }}
              >
                Health Tips
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const html = `<h2>Follow-up Reminder</h2><p>Dear {{PATIENT_NAME}},</p><p>This is a reminder for your follow-up visit. Please book your appointment at your convenience.</p><p>Regards,<br/>Hospital Team</p>`;
                  if (editorRef.current) {
                    editorRef.current.focus();
                    editorRef.current.innerHTML += html;
                  }
                }}
              >
                Follow-up Reminder
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const html = `<h2>Lab Results Ready</h2><p>Dear {{PATIENT_NAME}},</p><p>Your lab results are available. Click the link to download: <a href=\"{{LAB_RESULTS_LINK}}\" target=\"_blank\">Download Reports</a><br/>Passcode: <strong>{{PRESCRIPTION_PASSCODE}}</strong></p><p>If you face any issues, please contact us.</p>`;
                  if (editorRef.current) {
                    editorRef.current.focus();
                    editorRef.current.innerHTML += html;
                  }
                }}
              >
                Send Lab Results
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const html = `<p>Dear {{PATIENT_NAME}},</p><p>We have an important update regarding your recent visit.</p>`;
                  if (editorRef.current) {
                    editorRef.current.focus();
                    editorRef.current.innerHTML += html;
                  }
                }}
              >
                Generic Update
              </button>
              <span className="mx-1 text-gray-400">|</span>
              <span className="text-gray-500">Tags:</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand("insertText", false, "{{PATIENT_NAME}}"))
                }
              >
                {"{{PATIENT_NAME}}"}
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand(
                    "insertText",
                    false,
                    "{{HOSPITAL_NAME}}",
                  ))
                }
              >
                {"{{HOSPITAL_NAME}}"}
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand("insertText", false, "{{DOCTOR_NAME}}"))
                }
              >
                {"{{DOCTOR_NAME}}"}
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand(
                    "insertText",
                    false,
                    "{{APPOINTMENT_DATE}}",
                  ))
                }
              >
                {"{{APPOINTMENT_DATE}}"}
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand(
                    "insertText",
                    false,
                    "{{LAB_RESULTS_LINK}}",
                  ))
                }
              >
                {"{{LAB_RESULTS_LINK}}"}
              </button>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() =>
                  editorRef.current &&
                  (editorRef.current.focus(),
                  document.execCommand(
                    "insertText",
                    false,
                    "{{PRESCRIPTION_PASSCODE}}",
                  ))
                }
              >
                {"{{PRESCRIPTION_PASSCODE}}"}
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="w-full min-h-[120px] p-2 border rounded bg-white"
              onInput={(e) =>
                setMessageHtml((e.target as HTMLDivElement).innerHTML)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledAt || ""}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Channels</Label>
              <div className="mt-2 space-y-2">
                {(["email", "sms", "whatsapp", "push"] as const).map((ch) => (
                  <label key={ch} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={channels[ch]}
                      onChange={() => toggleChannel(ch)}
                    />
                    <span className="capitalize">{ch}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label>Audience</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <select
                  className="p-2 border rounded w-full"
                  value={audience.selector}
                  onChange={(e) =>
                    setAudience((a: any) => ({
                      ...a,
                      selector: e.target.value,
                    }))
                  }
                >
                  <option value="ALL">All patients</option>
                  <option value="VISITED_LAST_PERIOD">
                    Visited in last...
                  </option>
                  <option value="NO_VISIT_LAST_PERIOD">
                    No visit in last...
                  </option>
                  <option value="BOOKED_NOT_VISITED_LAST_PERIOD">
                    Booked but not visited in last...
                  </option>
                  <option value="CANCELLED_LAST_PERIOD">
                    Cancelled visit in last...
                  </option>
                  <option value="CONDITION_MATCH">
                    Matching conditions...
                  </option>
                </select>
              </div>
              <div>
                <select
                  className="p-2 border rounded w-full"
                  value={audience.period}
                  onChange={(e) =>
                    setAudience((a: any) => ({ ...a, period: e.target.value }))
                  }
                >
                  <option value="30d">30 days</option>
                  <option value="90d">Quarter (90 days)</option>
                  <option value="180d">6 months</option>
                  <option value="365d">1 year</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="p-2 border rounded flex-1"
                  value={audience.gender || ""}
                  onChange={(e) =>
                    setAudience((a: any) => ({ ...a, gender: e.target.value }))
                  }
                >
                  <option value="">Any gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                placeholder="Min age"
                value={audience.minAge || ""}
                onChange={(e) =>
                  setAudience((a: any) => ({ ...a, minAge: e.target.value }))
                }
              />
              <Input
                placeholder="Max age"
                value={audience.maxAge || ""}
                onChange={(e) =>
                  setAudience((a: any) => ({ ...a, maxAge: e.target.value }))
                }
              />
            </div>
            {audience.selector === "CONDITION_MATCH" && (
              <div className="mt-2">
                <Label>Conditions/Keywords (comma-separated)</Label>
                <Input
                  placeholder="e.g., diabetes, hypertension, kidney stone"
                  value={audience.conditions?.join(", ") || ""}
                  onChange={(e) =>
                    setAudience((a: any) => ({
                      ...a,
                      conditions: e.target.value
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              submitting ||
              !(editorRef.current?.innerHTML || messageHtml).trim()
            }
          >
            {submitting
              ? existing
                ? "Updating..."
                : "Saving..."
              : existing
                ? "Update Campaign"
                : "Save & Send/Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
