"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Delete, Keyboard, X } from "lucide-react";

import { cn } from "@/lib/utils";

type TargetElement = HTMLInputElement | HTMLTextAreaElement;

type KeyDef = {
  code: string;
  latin: string;
  urdu: string;
  width?: "wide" | "space";
};

const KEY_ROWS: KeyDef[][] = [
  [
    { code: "Backquote", latin: "`", urdu: "؍" },
    { code: "Digit1", latin: "1", urdu: "1" },
    { code: "Digit2", latin: "2", urdu: "2" },
    { code: "Digit3", latin: "3", urdu: "3" },
    { code: "Digit4", latin: "4", urdu: "4" },
    { code: "Digit5", latin: "5", urdu: "5" },
    { code: "Digit6", latin: "6", urdu: "6" },
    { code: "Digit7", latin: "7", urdu: "7" },
    { code: "Digit8", latin: "8", urdu: "8" },
    { code: "Digit9", latin: "9", urdu: "9" },
    { code: "Digit0", latin: "0", urdu: "0" },
    { code: "Minus", latin: "-", urdu: "-" },
    { code: "Equal", latin: "=", urdu: "=" },
    { code: "Backspace", latin: "Bksp", urdu: "مٹائیں", width: "wide" },
  ],
  [
    { code: "KeyQ", latin: "Q", urdu: "ق" },
    { code: "KeyW", latin: "W", urdu: "و" },
    { code: "KeyE", latin: "E", urdu: "ع" },
    { code: "KeyR", latin: "R", urdu: "ر" },
    { code: "KeyT", latin: "T", urdu: "ت" },
    { code: "KeyY", latin: "Y", urdu: "ے" },
    { code: "KeyU", latin: "U", urdu: "ء" },
    { code: "KeyI", latin: "I", urdu: "ی" },
    { code: "KeyO", latin: "O", urdu: "ہ" },
    { code: "KeyP", latin: "P", urdu: "پ" },
    { code: "BracketLeft", latin: "[", urdu: "{" },
    { code: "BracketRight", latin: "]", urdu: "}" },
    { code: "Backslash", latin: "\\", urdu: "\\" },
  ],
  [
    { code: "KeyA", latin: "A", urdu: "ا" },
    { code: "KeyS", latin: "S", urdu: "س" },
    { code: "KeyD", latin: "D", urdu: "د" },
    { code: "KeyF", latin: "F", urdu: "ف" },
    { code: "KeyG", latin: "G", urdu: "گ" },
    { code: "KeyH", latin: "H", urdu: "ح" },
    { code: "KeyJ", latin: "J", urdu: "ج" },
    { code: "KeyK", latin: "K", urdu: "ک" },
    { code: "KeyL", latin: "L", urdu: "ل" },
    { code: "Semicolon", latin: ";", urdu: "؛" },
    { code: "Quote", latin: "'", urdu: "،" },
  ],
  [
    { code: "KeyZ", latin: "Z", urdu: "ز" },
    { code: "KeyX", latin: "X", urdu: "ش" },
    { code: "KeyC", latin: "C", urdu: "چ" },
    { code: "KeyV", latin: "V", urdu: "ط" },
    { code: "KeyB", latin: "B", urdu: "ب" },
    { code: "KeyN", latin: "N", urdu: "ن" },
    { code: "KeyM", latin: "M", urdu: "م" },
    { code: "Comma", latin: ",", urdu: "،" },
    { code: "Period", latin: ".", urdu: "۔" },
    { code: "Slash", latin: "/", urdu: "؟" },
  ],
  [{ code: "Space", latin: "Space", urdu: "خالی جگہ", width: "space" }],
];

const KEY_MAP = new Map(KEY_ROWS.flat().map((key) => [key.code, key]));

function isSupportedTarget(target: EventTarget | null): target is TargetElement {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (target.readOnly || target.disabled) {
    return false;
  }

  if (target.dataset.urduKeyboard === "false" || target.dir === "ltr") {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    const type = target.type || "text";
    const blocked = ["email", "password", "date", "time", "datetime-local", "number", "file", "hidden", "color", "range", "checkbox", "radio"];
    if (blocked.includes(type)) {
      return false;
    }
  }

  return true;
}

function setNativeValue(element: TargetElement, nextValue: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, nextValue);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function restoreFocus(element: TargetElement, cursorPosition?: number) {
  window.requestAnimationFrame(() => {
    element.focus();
    if (typeof cursorPosition === "number") {
      element.setSelectionRange(cursorPosition, cursorPosition);
    }
  });
}

function insertText(element: TargetElement, text: string) {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;
  const nextValue = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;
  setNativeValue(element, nextValue);
  restoreFocus(element, start + text.length);
}

function backspaceText(element: TargetElement) {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;
  if (start === end && start === 0) return;
  const deleteStart = start === end ? start - 1 : start;
  const nextValue = `${element.value.slice(0, deleteStart)}${element.value.slice(end)}`;
  setNativeValue(element, nextValue);
  restoreFocus(element, deleteStart);
}

export function UrduKeyboard() {
  const [target, setTarget] = useState<TargetElement | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const targetRef = useRef<TargetElement | null>(null);
  const interactionRef = useRef(false);

  useEffect(() => {
    const getLiveTarget = () => {
      if (targetRef.current && targetRef.current.isConnected && isSupportedTarget(targetRef.current)) {
        return targetRef.current;
      }
      return null;
    };

    const handleFocusIn = (event: FocusEvent) => {
      const nextTarget = isSupportedTarget(event.target) ? event.target : null;
      targetRef.current = nextTarget;
      setTarget(nextTarget);
      if (nextTarget) {
        setOpen(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (interactionRef.current) {
          return;
        }

        const nextTarget = isSupportedTarget(document.activeElement) ? document.activeElement : null;
        targetRef.current = nextTarget;
        setTarget(nextTarget);
        if (!nextTarget) {
          setOpen(false);
        }
      }, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = getLiveTarget();
      if (!activeElement) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.code === "Backspace") {
        event.preventDefault();
        setActiveCode("Backspace");
        backspaceText(activeElement);
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setActiveCode("Space");
        insertText(activeElement, " ");
        return;
      }

      const key = KEY_MAP.get(event.code);
      if (!key || key.code === "Backspace" || key.code === "Space") return;

      event.preventDefault();
      setActiveCode(event.code);
      insertText(activeElement, key.urdu);
    };

    const handleKeyUp = () => {
      setActiveCode(null);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const title = useMemo(() => {
    if (!target) return "";
    return target.placeholder || target.getAttribute("aria-label") || "اردو لکھیں";
  }, [target]);

  if (!target) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70]">
      <div className="pointer-events-none mx-auto flex max-w-7xl justify-end px-3 pb-3">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--brand-line)] bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-lg transition hover:bg-white dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-950"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
        >
          <Keyboard className="size-4" />
          {open ? "کی بورڈ بند کریں" : "اردو کی بورڈ"}
        </button>
      </div>

      {open ? (
        <div
          className="border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,242,233,0.98))] px-3 pb-3 pt-3 shadow-[0_-16px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]"
          onMouseDownCapture={() => {
            interactionRef.current = true;
          }}
          onMouseUpCapture={() => {
            window.setTimeout(() => {
              interactionRef.current = false;
            }, 0);
          }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-2xl text-slate-950 dark:text-white">اردو کی بورڈ</p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-300">{title}</p>
              </div>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--brand-line)] bg-white text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-x-auto overflow-y-hidden pb-1">
          {KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex min-w-max justify-center gap-2">
              {row.map((key) => (
                <button
                  key={key.code}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    interactionRef.current = true;
                  }}
                  onClick={() => {
                    const activeElement = targetRef.current;
                    if (!activeElement) return;

                    if (key.code === "Backspace") {
                      backspaceText(activeElement);
                      return;
                    }

                    if (key.code === "Space") {
                      insertText(activeElement, " ");
                      return;
                    }

                    insertText(activeElement, key.urdu);
                  }}
                  className={cn(
                    "flex h-14 min-w-12 items-center justify-center rounded-2xl border border-[var(--brand-line)] bg-white px-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/8 dark:text-white",
                    activeCode === key.code && "border-[var(--brand-forest)] bg-[var(--surface-soft)] text-[var(--brand-forest)] dark:bg-emerald-500/15 dark:text-emerald-100",
                    key.width === "wide" && "min-w-[7rem]",
                    key.width === "space" && "min-w-[16rem] sm:min-w-[28rem]",
                  )}
                >
                  {key.code === "Backspace" ? (
                    <span className="flex items-center gap-2">
                      <Delete className="size-4" />
                      <span className="text-sm font-medium">{key.urdu}</span>
                    </span>
                  ) : key.code === "Space" ? (
                    <span className="text-sm font-medium">{key.urdu}</span>
                  ) : (
                    <span className="flex flex-col items-center leading-none">
                      <span className="font-heading text-[1.35rem] text-slate-950 dark:text-white">{key.urdu}</span>
                      <span className="mt-1 text-[0.72rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">{key.latin}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
