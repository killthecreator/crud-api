export const errorChecker = (e: unknown) => {
  if (typeof e === 'string') {
    return { error: e };
  } else if (e instanceof Error) {
    return { error: e.message };
  }
};
