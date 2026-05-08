import { useState } from "react";
import { useAuth } from "#/features/auth/hooks/use-auth";
import { useTheme } from "#/shared/hooks/use-theme";
import { AvatarUploader } from "../avatar-uploader";
import { NameEditor } from "./name-editor";
import { PasswordChanger } from "./password-changer";
import { SessionInfo } from "./session-info";
import { MFASection } from "./mfa-section";

const SectionTitle = ({
  children,
  isDarkMode,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
}) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  return (
    <p
      className={`text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
    >
      {children}
    </p>
  );
};

export const ProfileSettings = () => {
  const { data: user } = useAuth();
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        my profile
      </h1>

      {/* Profile */}
      <div className="mb-8">
        <SectionTitle isDarkMode={isDarkMode}>profile</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <div className="flex items-center gap-6 py-3">
            <AvatarUploader avatarUrl={avatarUrl} name={name} onAvatarChange={setAvatarUrl} />
            <div className="flex-1 min-w-0">
              <NameEditor avatarUrl={avatarUrl} name={name} onNameChange={setName} />
              <div className="py-3">
                <span
                  className={`block text-[10px] uppercase tracking-wider mb-1 ${t("text-text-dark/30", "text-text-light/30")}`}
                >
                  email
                </span>
                <span
                  className={`text-[13px] lowercase ${t("text-text-dark/50", "text-text-light/50")}`}
                >
                  {user?.email ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="mb-8">
        <SectionTitle isDarkMode={isDarkMode}>security</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <PasswordChanger />
          <MFASection />
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-8">
        <SectionTitle isDarkMode={isDarkMode}>sessions</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <SessionInfo />
        </div>
      </div>
    </div>
  );
};
