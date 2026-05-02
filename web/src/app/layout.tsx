import "@/styles/globals.css";
import { Header } from "@/components/Header";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ToastProvider } from "@/components/ui/Toast";
import { Onboarding } from "@/components/Onboarding";

export const metadata = {
  title: "Terra Viva — Do produtor pra você",
  description: "Compre direto de quem produz. Produtos coloniais frescos, entregues ou retirados no seu tempo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <Header />
          <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-tab-safe md:pb-8">{children}</main>
          <BottomTabBar />
          <Onboarding />
        </ToastProvider>
      </body>
    </html>
  );
}
