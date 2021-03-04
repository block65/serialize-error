import { CustomError } from '@block65/custom-error';
import { serializeError as serialize } from 'serialize-error';

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

function prepareStack(stack?: string): string[] {
  return (stack || '')
    .split('\n')
    .map((frame): string => frame.trim())
    .slice(1);
}

export function serializeError(
  err: unknown | Error | CustomError,
): SerializedError {
  if (err instanceof CustomError) {
    const previousErrors =
      'previous' in err && err.previous
        ? flattenPreviousErrors(err.previous)
        : [];

    return {
      ...serialize(err),
      message: err.message,
      name: err.name,
      ...('statusCode' in err ? { statusCode: err.statusCode } : {}),
      stack: prepareStack(err.stack),
      ...('sensitive' in err ? { sensitive: err.sensitive } : {}),
      previous: previousErrors.map(serializeError),
      ...('debug' in err ? { debug: err.debug() } : {}),
    };
  }

  if (err instanceof Error) {
    return {
      ...serialize(err),
      message: err.message || '',
      name: err.name || 'Error',
      stack: prepareStack(err.stack),
    };
  }

  if (typeof err === 'string' || typeof err === 'number') {
    return {
      message: err.toString(),
      name: 'Error',
      stack: prepareStack(Error().stack),
    };
  }

  // Not an error object, maybe primitive or null, undefined
  return {
    name: 'Error',
    message: '',
    stack: prepareStack(Error().stack),
    debug: {
      typeofErr: typeof err,
      err,
    },
  };
}
