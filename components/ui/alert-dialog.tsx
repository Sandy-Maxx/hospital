import * as React from "react";

interface CtxType { open: boolean; setOpen: (v: boolean) => void }
const Ctx = React.createContext<CtxType | null>(null);

export function AlertDialog({ children }: React.HTMLAttributes<HTMLDivElement>) {
  const [open, setOpen] = React.useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function AlertDialogTrigger({ children, onClick, asChild, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const ctx = React.useContext(Ctx);
  const handle = (e: any) => {
    onClick?.(e);
    ctx?.setOpen(true);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: (e: any) => {
        (children as any).props?.onClick?.(e);
        handle(e);
      },
    });
  }
  return (
    <button type="button" onClick={handle} {...rest}>
      {children}
    </button>
  );
}

export function AlertDialogContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div className={`relative z-10 mx-auto my-8 max-w-md rounded bg-white shadow-lg p-4 ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-2 ${className}`} {...props} />;
}

export function AlertDialogTitle({ className = "text-lg font-semibold", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className} {...props} />;
}

export function AlertDialogDescription({ className = "text-sm text-gray-600", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={className} {...props} />;
}

export function AlertDialogFooter({ className = "mt-4 flex justify-end gap-2", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function AlertDialogAction({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(Ctx);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        ctx?.setOpen(false);
      }}
      className="bg-red-600 text-white px-3 py-1 rounded"
      {...rest}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(Ctx);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        ctx?.setOpen(false);
      }}
      className="px-3 py-1 rounded border"
      {...rest}
    >
      {children}
    </button>
  );
}

