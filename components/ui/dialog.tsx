import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  return (
    <AnimatePresence>
      {ctx?.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={() => ctx.setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={`relative z-10 w-full rounded bg-white shadow-lg ${className}`}
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="h-full flex flex-col" {...props}>
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
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

