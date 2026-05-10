export const parseErrorMessage = (parsed: unknown): string => {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as { error?: string }).error === "string"
  ) {
    return (parsed as { error: string }).error;
  }
  return "An error occurred";
};
