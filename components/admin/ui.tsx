import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "success" | "warn" | "danger" | "info" | "sky";
}) {
  const tones: Record<string, string> = {
    muted: "bg-surface-muted text-muted",
    success: "bg-emerald-50 text-success",
    warn: "bg-amber-50 text-[#92400E]",
    danger: "bg-rose-50 text-danger",
    info: "bg-sky-100 text-sky-700",
    sky: "bg-sky-600 text-white",
  };
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[10.5px] font-extrabold", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border-base bg-surface-muted/40 px-6 py-10 text-center">
      <p className="font-body text-[13.5px] font-bold text-ink-800">{title}</p>
      {hint && <p className="font-body text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-body text-[20px] font-black tracking-tight text-sky-950 sm:text-[24px]">{title}</h1>
        {subtitle && <p className="mt-0.5 font-body text-[12.5px] font-medium text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "btn-glow inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 px-4 py-2.5 font-body text-[13px] font-bold text-white disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-border-base bg-white px-4 py-2.5 font-body text-[13px] font-bold text-ink-800 transition-colors hover:bg-surface-muted disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border-base bg-white px-3.5 py-2.5 font-body text-[13.5px] text-ink-800 placeholder:text-muted/70 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "min-h-[90px] resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "appearance-none", props.className)} />;
}
