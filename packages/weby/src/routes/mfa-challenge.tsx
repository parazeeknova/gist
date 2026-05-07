import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMFAVerify } from "@/features/auth/hooks/use-mfa";
import { useTheme } from "@/shared/hooks/use-theme";

const MFAChallenge = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [code, setCode] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const verify = useMFAVerify();

  const handleSubmit = async () => {
    setErrMsg("");
    if (code.length < 6) {
      setErrMsg("code must be at least 6 characters");
      return;
    }
    try {
      await verify.mutateAsync({ code });
      void navigate({ to: "/home" });
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : "verification failed");
    }
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center ${t("bg-bg-dark", "bg-bg-light")}`}
    >
      <div className="w-full max-w-sm px-6">
        <h1
          className={`mb-8 text-center text-sm font-normal lowercase ${t("text-text-dark", "text-text-light")}`}
        >
          two-factor authentication
        </h1>

        <p
          className={`mb-6 text-center text-[11px] lowercase ${t("text-text-dark/50", "text-text-light/50")}`}
        >
          enter the code from your authenticator app
        </p>

        <input
          className={`mb-4 w-full border-b bg-transparent py-2 text-center text-[13px] uppercase tracking-widest outline-none transition-colors ${t(
            "border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50",
            "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50",
          )}`}
          maxLength={8}
          onChange={(e) => setCode(e.target.value.replaceAll(/[^0-9a-zA-Z]/g, ""))}
          placeholder="000000"
          type="text"
          value={code}
        />

        {errMsg && (
          <p
            className={`mb-4 text-center text-[11px] lowercase ${t("text-red-400", "text-red-600")}`}
          >
            {errMsg}
          </p>
        )}

        <button
          className={`w-full py-2 text-[13px] lowercase transition-opacity ${
            code.length >= 6
              ? t(
                  "text-text-dark/50 hover:text-text-dark/80",
                  "text-text-light/50 hover:text-text-light/80",
                )
              : t("text-text-dark/20 cursor-not-allowed", "text-text-light/20 cursor-not-allowed")
          }`}
          disabled={code.length < 6 || verify.isPending}
          onClick={handleSubmit}
          type="button"
        >
          {verify.isPending ? "verifying..." : "verify"}
        </button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/mfa-challenge")({
  component: MFAChallenge,
});
