import {
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import {
  useMFASetup,
  useMFAEnable,
  useMFADisable,
  useMFABackupCodes,
  useMFAStatus,
} from "@/features/auth/hooks/use-mfa";
import { useTheme } from "@/shared/hooks/use-theme";

interface MFASetupFormProps {
  isDarkMode: boolean;
  manualKey: string;
  qrUri: string;
  onCancel: () => void;
  onEnable: (code: string) => void;
}

const MFASetupForm = ({ isDarkMode, manualKey, qrUri, onCancel, onEnable }: MFASetupFormProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [setupCode, setSetupCode] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex flex-col items-center">
        <p
          className={`mb-3 text-center text-[11px] lowercase ${t("text-text-dark/50", "text-text-light/50")}`}
        >
          scan this qr code with your authenticator app
        </p>
        <div
          className={`p-3 ${isDarkMode ? "bg-white" : "bg-white"}`}
          style={{ width: "fit-content" }}
        >
          <QRCodeSVG bgColor="#ffffff" fgColor="#000000" level="M" size={180} value={qrUri} />
        </div>
        <p className={`mt-2 text-[10px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
          or enter the key manually
        </p>
      </div>

      <div>
        <label
          className={`block text-[10px] uppercase tracking-wider mb-1 ${t("text-text-dark/30", "text-text-light/30")}`}
          htmlFor="mfa-secret-key"
        >
          secret key
        </label>
        <div className="flex items-center gap-2">
          <code
            className={`text-[11px] break-all ${t("text-text-dark/60", "text-text-light/60")}`}
            id="mfa-secret-key"
          >
            {manualKey}
          </code>
          <button
            className={`${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
            onClick={() => copyToClipboard(manualKey)}
            type="button"
          >
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </button>
        </div>
      </div>

      <div>
        <label
          className={`block text-[10px] uppercase tracking-wider mb-1 ${t("text-text-dark/30", "text-text-light/30")}`}
          htmlFor="mfa-verify-code"
        >
          verify code
        </label>
        <input
          className={`w-full bg-transparent border-b py-2 text-[13px] uppercase tracking-widest outline-none transition-colors text-center ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
          id="mfa-verify-code"
          maxLength={8}
          onChange={(e) => setSetupCode(e.target.value.replaceAll(/[^0-9a-zA-Z]/g, ""))}
          placeholder="000000"
          type="text"
          value={setupCode}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
          onClick={() => onEnable(setupCode)}
          type="button"
        >
          verify and enable
        </button>
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
          onClick={onCancel}
          type="button"
        >
          cancel
        </button>
      </div>
    </div>
  );
};

interface MFABackupCodesViewProps {
  codes: string[];
  isDarkMode: boolean;
  onClose: () => void;
}

const MFABackupCodesView = ({ codes, isDarkMode, onClose }: MFABackupCodesViewProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  return (
    <div className="mt-3 space-y-2">
      <p
        className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        backup codes
      </p>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, i) => (
          <code
            className={`text-[11px] text-center py-1 ${t("text-text-dark/60", "text-text-light/60")}`}
            key={i}
          >
            {code}
          </code>
        ))}
      </div>
      <button
        className={`text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
        onClick={onClose}
        type="button"
      >
        close
      </button>
    </div>
  );
};

interface MFADisableFormProps {
  isDarkMode: boolean;
  onCancel: () => void;
  onDisable: (password: string) => void;
}

const MFADisableForm = ({ isDarkMode, onCancel, onDisable }: MFADisableFormProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [password, setPassword] = useState("");

  return (
    <div className="mt-3 space-y-3">
      <div className="relative">
        <input
          className={`w-full bg-transparent border-b py-2 pr-8 text-[13px] lowercase outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="current password to disable"
          type="password"
          value={password}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
          onClick={() => onDisable(password)}
          type="button"
        >
          confirm disable
        </button>
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
          onClick={onCancel}
          type="button"
        >
          cancel
        </button>
      </div>
    </div>
  );
};

interface MFAActionsProps {
  isDarkMode: boolean;
  isEnabled: boolean;
  onBackupCodes: () => void;
  onDisable: () => void;
  onSetup: () => void;
}

const MFAActions = ({
  isDarkMode,
  isEnabled,
  onBackupCodes,
  onDisable,
  onSetup,
}: MFAActionsProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  if (isEnabled) {
    return (
      <div className="flex items-center gap-2">
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
          onClick={onBackupCodes}
          type="button"
        >
          <ShieldCheckIcon size={12} /> backup codes
        </button>
        <button
          className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
          onClick={onDisable}
          type="button"
        >
          <ShieldSlashIcon size={12} /> disable
        </button>
      </div>
    );
  }
  return (
    <button
      className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
      onClick={onSetup}
      type="button"
    >
      <ShieldCheckIcon size={12} /> enable
    </button>
  );
};

interface MFAStatusMessagesProps {
  isDarkMode: boolean;
  isEnabled: boolean;
  workspaceEnforced: boolean;
}

const MFAStatusMessages = ({
  isDarkMode,
  isEnabled,
  workspaceEnforced,
}: MFAStatusMessagesProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  return (
    <>
      {workspaceEnforced && !isEnabled && (
        <p className={`text-[11px] lowercase mb-2 ${t("text-amber-400", "text-amber-600")}`}>
          <WarningIcon className="inline mr-1" size={12} />
          mfa is required by your workspace
        </p>
      )}
      {isEnabled && (
        <p className={`text-[11px] lowercase mb-2 ${t("text-green-400", "text-green-600")}`}>
          <ShieldCheckIcon className="inline mr-1" size={12} />
          mfa is enabled
        </p>
      )}
    </>
  );
};

export const MFASection = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const { data: status, isLoading: statusLoading } = useMFAStatus();
  const setup = useMFASetup();
  const enable = useMFAEnable();
  const disable = useMFADisable();
  const backupCodes = useMFABackupCodes();

  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSetup = async () => {
    setErrMsg("");
    try {
      await setup.mutateAsync();
      setShowSetup(true);
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : "setup failed");
    }
  };

  const handleEnable = async (code: string) => {
    setErrMsg("");
    if (code.length < 6) {
      setErrMsg("code must be at least 6 characters");
      return;
    }
    try {
      await enable.mutateAsync({ code });
      setShowSetup(false);
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : "enable failed");
    }
  };

  const handleDisable = async (password: string) => {
    setErrMsg("");
    if (!password) {
      setErrMsg("password is required");
      return;
    }
    try {
      await disable.mutateAsync({ password });
      setShowDisableForm(false);
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : "disable failed");
    }
  };

  const handleBackupCodes = async () => {
    setErrMsg("");
    try {
      await backupCodes.mutateAsync();
      setShowBackupCodes(true);
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : "failed to generate backup codes");
    }
  };

  if (statusLoading) {
    return (
      <div className="py-3">
        <p className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
          loading...
        </p>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          two-factor auth
        </span>
        <MFAActions
          isDarkMode={isDarkMode}
          isEnabled={status?.is_enabled ?? false}
          onBackupCodes={handleBackupCodes}
          onDisable={() => setShowDisableForm(true)}
          onSetup={handleSetup}
        />
      </div>

      <MFAStatusMessages
        isDarkMode={isDarkMode}
        isEnabled={status?.is_enabled ?? false}
        workspaceEnforced={status?.workspace_enforced ?? false}
      />

      {showSetup && setup.data && (
        <MFASetupForm
          isDarkMode={isDarkMode}
          manualKey={setup.data.manual_key}
          onCancel={() => setShowSetup(false)}
          onEnable={handleEnable}
          qrUri={setup.data.qr_uri}
        />
      )}

      {!showSetup && !status?.is_enabled && (
        <p className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
          add an extra layer of security to your account
        </p>
      )}

      {showBackupCodes && backupCodes.data && (
        <MFABackupCodesView
          codes={backupCodes.data.codes}
          isDarkMode={isDarkMode}
          onClose={() => setShowBackupCodes(false)}
        />
      )}

      {showDisableForm && status?.is_enabled && (
        <MFADisableForm
          isDarkMode={isDarkMode}
          onCancel={() => setShowDisableForm(false)}
          onDisable={handleDisable}
        />
      )}

      {errMsg && (
        <p className={`text-[11px] lowercase mt-2 ${t("text-red-400", "text-red-600")}`}>
          {errMsg}
        </p>
      )}
    </div>
  );
};
