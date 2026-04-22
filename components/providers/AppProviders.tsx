"use client";

import { ThemeProvider } from "@/lib/theme";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/lib/toast";
import { ModalProvider } from "@/lib/modal";
import { AuthProvider } from "@/lib/auth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <StoreProvider>
            <ModalProvider>{children}</ModalProvider>
          </StoreProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
