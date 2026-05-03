"use client";

import { useRef, useState } from "react";

interface PhotoPickerPopupProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function PhotoPickerPopup({ onFileSelected, disabled, children }: PhotoPickerPopupProps) {
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFileSelected(f);
    setOpen(false);
    // reset para permitir re-selecionar mesmo arquivo
    e.target.value = "";
  }

  return (
    <div className="relative">
      <div onClick={() => !disabled && setOpen(true)}>{children}</div>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />

          {/* popup centralizado */}
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-3 shadow-xl min-w-[220px]">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-textPrimary transition hover:bg-gray-100"
              onClick={() => { cameraRef.current?.click(); }}
            >
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              Tirar foto
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-textPrimary transition hover:bg-gray-100"
              onClick={() => { galleryRef.current?.click(); }}
            >
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 19.5V4.5A2.25 2.25 0 0 0 20.25 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              Buscar na galeria
            </button>
            <button
              type="button"
              className="mt-1 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm text-textSecondary transition hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* Input câmera (capture=environment abre câmera traseira no mobile) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      {/* Input galeria (sem capture = abre galeria) */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
