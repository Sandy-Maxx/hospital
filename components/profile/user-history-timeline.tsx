"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Briefcase, Clock, History } from "lucide-react";
import { ProfileData } from "./types";

interface Props {
  designationChangelog: NonNullable<ProfileData["designation"]>["changelog"];
  experience: NonNullable<ProfileData["experience"]>;
}

export default function UserHistoryTimeline({ designationChangelog = [], experience = [] }: Props) {
  const items = [
    ...designationChangelog.map((c) => ({
      type: "designation" as const,
      title: c.designation,
      from: c.fromYear,
      to: c.toYear,
    })),
    ...experience.map((e) => ({
      type: "experience" as const,
      title: `${e.designation} @ ${e.organization}`,
      from: e.fromYear,
      to: e.toYear,
    })),
  ].sort((a, b) => (b.from || 0) - (a.from || 0));

  if (!items.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2 text-gray-600" />
          Career Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <ul className="space-y-6">
            {items.map((it, idx) => (
              <li key={idx} className="relative pl-12">
                <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-gray-300" />
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  {it.type === "designation" ? (
                    <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  )}
                  {it.from}
                  {it.to ? ` - ${it.to}` : " - Present"}
                </div>
                <div className="text-gray-900 font-medium">{it.title}</div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

