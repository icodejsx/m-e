"use client";

import { ThemeProvider } from "@/lib/theme";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/lib/toast";
import { ModalProvider } from "@/lib/modal";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <StoreProvider>
          <ModalProvider>{children}</ModalProvider>
        </StoreProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
