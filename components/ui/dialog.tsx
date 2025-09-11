import * as React from "react";

interface DialogContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DialogCtx = React.createContext<DialogContextType | null>(null);

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  };
  return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({ children, onClick, asChild, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const ctx = React.useContext(DialogCtx);
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

export function DialogContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DialogCtx);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div className={`relative z-10 mx-auto my-8 max-w-lg rounded bg-white shadow-lg p-4 ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-2 ${className}`} {...props} />;
}

export function DialogTitle({ className = "text-lg font-semibold", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className} {...props} />;
}

export function DialogDescription({ className = "text-sm text-gray-600", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={className} {...props} />;
}

export function DialogFooter({ className = "mt-4 flex justify-end gap-2", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

