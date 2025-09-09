"use client";

import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav
      className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={`${item.href}-${index}`}>
          {index > 0 && <ChevronRight className="w-4 h-4" aria-hidden />}
          <Link
            href={item.href}
            className={
              index === items.length - 1
                ? "text-gray-900 font-medium"
                : "hover:text-blue-600"
            }
            aria-current={index === items.length - 1 ? "page" : undefined}
          >
            {item.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
