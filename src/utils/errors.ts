export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }

  return fallback;
}

export function formatCmsError(error: unknown): string {
  const message = getErrorMessage(error);
  return message.toLowerCase().includes('duplicate') ? 'Slug is already in use.' : message;
}
