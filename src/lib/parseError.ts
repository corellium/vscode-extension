type CorelliumError = {
  error: Error;
};

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
    return (error as CorelliumError).error.message;
  }
  return `${error as string}`;
};

export default parseError;
