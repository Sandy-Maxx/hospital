import * as React from "react";

export function Table({ className = "w-full border-collapse", ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={className} {...props} />;
}

export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "border-b last:border-0", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

export function TableHead({ className = "text-left text-xs uppercase text-gray-500", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-3 py-2 ${className}`} {...props} />;
}

export function TableCell({ className = "text-sm", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 py-2 align-middle ${className}`} {...props} />;
}

