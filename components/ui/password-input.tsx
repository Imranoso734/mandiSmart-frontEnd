"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={["pl-11", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        aria-label={visible ? "پاس ورڈ چھپائیں" : "پاس ورڈ دکھائیں"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
