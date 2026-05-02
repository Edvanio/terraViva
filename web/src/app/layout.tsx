import "@/styles/globals.css";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { Onboarding } from "@/components/Onboarding";

export const metadata = {
  title: "Terra Viva — Da colônia para sua mesa",
  description: "Feira digital de produtores locais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <Header />
          <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
          <Onboarding />
        </ToastProvider>
      </body>
    </html>
  );
}
