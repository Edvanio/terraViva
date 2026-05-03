"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    localStorage.removeItem("terra_viva_token");
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-red-50 hover:text-red-600"
    >
      Sair
    </button>
  );
}
