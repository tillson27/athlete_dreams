'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

type ConfirmTone = 'danger' | 'primary';

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const confirmClass =
    tone === 'danger'
      ? 'bg-error text-on-error hover:bg-error/90'
      : 'bg-primary text-on-primary hover:bg-primary-strong';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="w-[min(92vw,28rem)] rounded-card border border-outline-variant bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-black/45"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
            <Icon name={tone === 'danger' ? 'trash' : 'info'} className="h-5 w-5" />
          </span>
          <div>
            <h2 id={titleId} className="font-display text-xl font-bold">
              {title}
            </h2>
            <div id={bodyId} className="mt-2 text-sm text-on-surface-variant">
              {body}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="label-bold inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`label-bold inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
