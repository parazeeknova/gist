import { useTheme } from "#/shared/hooks/use-theme";
import { Check } from "#/features/console/components/check";
import {
  useSystemSettings,
  useUpdateSystemSetting,
} from "#/features/console/hooks/use-system-settings";

const DEBUG_SETTINGS = [
  {
    description: "enable the debug database/storage inspector page and sidebar navigation.",
    key: "debug_routes",
    label: "debug routes",
  },
  {
    description:
      "enable the debug api endpoints for database table inspection and storage management.",
    key: "debug_api",
    label: "debug api",
  },
] as const;

export const DebugSettings = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();

  const getValue = (key: string) => settings?.find((s) => s.key === key)?.value ?? false;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        debug settings
      </h1>

      <div className="mb-4">
        <p
          className={`text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          features
        </p>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          {isLoading ? (
            <div
              className={`py-6 text-center text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              loading...
            </div>
          ) : (
            DEBUG_SETTINGS.map((item, idx) => (
              <div
                key={item.key}
                className={
                  idx < DEBUG_SETTINGS.length - 1
                    ? `border-b ${t("border-border-dark", "border-border-light")}`
                    : ""
                }
              >
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span
                        className={`text-[11px] lowercase ${t("text-text-dark/70", "text-text-light/70")}`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`text-[10px] lowercase mt-0.5 ${t("text-text-dark/30", "text-text-light/30")}`}
                      >
                        {item.description}
                      </span>
                    </div>
                    <Check
                      checked={getValue(item.key)}
                      onChange={() =>
                        updateSetting.mutate({ key: item.key, value: !getValue(item.key) })
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`mt-8 border ${t("border-border-dark", "border-border-light")} px-3 py-3`}>
        <span className={`text-[10px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
          these settings are only visible and configurable by the workspace owner. disabling "debug
          routes" will hide the debug inspector page. disabling "debug api" will disable the backend
          debug endpoints.
        </span>
      </div>
    </div>
  );
};
