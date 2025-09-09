"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CampaignForm from "@/components/marketing/campaign-form";
import CampaignViewModal from "@/components/marketing/campaign-view-modal";
import Breadcrumb from "@/components/navigation/breadcrumb";

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [providerStatus, setProviderStatus] = useState<{
    emailConfigured: boolean;
    smsConfigured: boolean;
    whatsappConfigured: boolean;
  } | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<any | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/marketing/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setProviderStatus(data.providerStatus || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb items={[{ label: "Marketing", href: "/marketing" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Marketing Campaigns
          </h1>
          <p className="text-gray-600">
            Create and schedule bulk communications
          </p>
        </div>
        <Button onClick={() => setOpenForm(true)}>New Campaign</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Latest campaigns and statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {providerStatus && (
            <div className="mb-4 text-sm text-gray-600">
              Provider status: Email{" "}
              {providerStatus.emailConfigured ? "✔" : "✖"}, SMS{" "}
              {providerStatus.smsConfigured ? "✔" : "✖"}, WhatsApp{" "}
              {providerStatus.whatsappConfigured ? "✔" : "✖"}
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No campaigns yet
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-600">
                        Channels:{" "}
                        {Object.entries(c.channels || {})
                          .filter(([_, v]) => v)
                          .map(([k]) => k.toUpperCase())
                          .join(", ") || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Scheduled: {c.scheduledAt || "Now"} • Status: {c.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const res = await fetch(
                            `/api/marketing/campaigns/${c.id}`,
                          );
                          if (res.ok) {
                            const data = await res.json();
                            setViewCampaign(data.campaign);
                            setViewOpen(true);
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(c);
                          setOpenForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("Delete this campaign?")) return;
                          const res = await fetch(
                            `/api/marketing/campaigns/${c.id}`,
                            { method: "DELETE" },
                          );
                          if (res.ok) fetchCampaigns();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {c.result && (
                    <div className="mt-2 text-xs text-gray-500">
                      Sent: {c.result.sent || 0} • Failed:{" "}
                      {c.result.failed || 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {openForm && (
        <CampaignForm
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
            fetchCampaigns();
          }}
          onSuccess={() => {
            setOpenForm(false);
            setEditing(null);
            fetchCampaigns();
          }}
          existing={editing || undefined}
        />
      )}

      <CampaignViewModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewCampaign(null);
        }}
        campaign={viewCampaign}
      />
    </div>
  );
}
