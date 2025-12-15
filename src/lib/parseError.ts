const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    Object.hasOwnProperty.call(error, 'error') &&
    (error as { error?: Error }).error instanceof Error
  ) {
    const err = error as any;
    return err?.body?.error || err?.message || 'Unknown error';
  }
  return `${error as string}`;
};

export default parseError;
