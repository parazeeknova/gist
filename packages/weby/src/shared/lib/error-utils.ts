export const parseErrorMessage = (parsed: unknown, fallback = "An error occurred"): string => {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as { error?: string }).error === "string"
  ) {
    return (parsed as { error: string }).error;
  }
  return fallback;
};
