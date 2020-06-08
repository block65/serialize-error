import { CustomError } from '@block65/custom-error';
import { ErrorObject, serializeError as serialize } from 'serialize-error';

export interface SerializedError {
  name: string;
  message: string;
  stack: string[];
  internal?: boolean;
  statusCode?: number;
  previous?: ErrorObject[];
}

export type { CustomError }

function flattenPreviousErrors(
  err: Error | CustomError,
  accum: Error[] = [],
): Error[] {
  if ('previous' in err && err.previous) {
    const { previous, ...rest } = err;
    return flattenPreviousErrors(previous, [...accum, rest]);
  }
  return [...accum, err];
}

export function serializeError(
  err: Error | CustomError,
): SerializedError {
  const previousErrors =
    'previous' in err && err.previous
      ? flattenPreviousErrors(err.previous)
      : [];

  return {
    message: err.message,
    name: err.name,
    ...('internal' in err ? { internal: err.internal } : {}),
    ...('statusCode' in err ? { statusCode: err.statusCode } : {}),
    stack: (err.stack || '')
      .split('\n')
      .map((frame): string => frame.trim())
      .slice(1),
    previous: previousErrors.map(serialize),
    internal: 'internal' in err ? err.internal : undefined,
    ...('debug' in err ? { debug: err.debug() } : {}),
  };
}
