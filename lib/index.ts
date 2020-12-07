import type { CustomError } from '@block65/custom-error';
import { ErrorObject, serializeError as serialize } from 'serialize-error';

export interface SerializedError {
  name: string;
  message: string;
  stack: string[];
  sensitive?: boolean;
  statusCode?: number;
  previous?: SerializedError[];

  [key: string]: unknown;
}

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

export function serializeError(err: Error | CustomError): SerializedError {
  const previousErrors =
    'previous' in err && err.previous
      ? flattenPreviousErrors(err.previous)
      : [];

  return {
    ...serialize(err),
    message: err.message,
    name: err.name,
    ...('statusCode' in err ? { statusCode: err.statusCode } : {}),
    stack: (err.stack || '')
      .split('\n')
      .map((frame): string => frame.trim())
      .slice(1),
    ...('sensitive' in err ? { sensitive: err.sensitive } : {}),
    previous: previousErrors.map(serializeError),
    ...('debug' in err ? { debug: err.debug() } : {}),
  };
}
