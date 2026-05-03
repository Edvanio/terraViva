"use client";

export function LogoutButton() {
  async function handleLogout() {
    localStorage.removeItem("terra_viva_token");
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
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
