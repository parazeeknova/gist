import { useDebugStorageObjects } from "#/features/console/hooks/use-debug";
import { useTheme } from "#/shared/hooks/use-theme";

export const DebugStorage = () => {
  const { isDarkMode } = useTheme();
  const { data, isError, isPending } = useDebugStorageObjects();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (isPending) {
    return (
      <div
        className={`flex items-center justify-center h-full text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        loading storage objects...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className={`flex items-center justify-center h-full text-[11px] lowercase ${t("text-red-400", "text-red-600")}`}
      >
        failed to load storage objects
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar px-4 py-3">
      <p className={`text-[11px] lowercase mb-3 ${t("text-text-dark/40", "text-text-light/40")}`}>
        {data.totalObjectCount} objects across {data.totalBucketCount} buckets
      </p>
      <div className="space-y-4">
        {data.buckets.map((bucket) => (
          <section key={bucket.bucket}>
            <h3
              className={`text-[11px] lowercase mb-2 ${t("text-text-dark/70", "text-text-light/70")}`}
            >
              {bucket.bucket} ({bucket.objectCount})
            </h3>
            {bucket.objects.length === 0 ? (
              <p
                className={`text-[10px] lowercase ${t("text-text-dark/25", "text-text-light/25")}`}
              >
                no objects
              </p>
            ) : (
              <ul className="space-y-1">
                {bucket.objects.map((object) => (
                  <li
                    key={`${object.bucket}/${object.key}`}
                    className={`text-[10px] break-all ${t("text-text-dark/55", "text-text-light/55")}`}
                  >
                    {object.bucket} / {object.key}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
