export const getErrorMessage = (e: unknown, fallback: string) => {
  const error = e as { response?: { data?: { error?: { message?: string } | string } } };
  const dataError = error.response?.data?.error;

  if (typeof dataError === "string") return dataError;
  return dataError?.message ?? fallback;
};
