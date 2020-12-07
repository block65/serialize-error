import { CustomError } from '@block65/custom-error';
import { URL } from 'url';
import * as assert from 'assert';
import { serializeError } from '../lib';

function getUrlError(): Error {
  try {
    const url = new URL('/', 'lol');
    throw new Error(`error expected from URL ${url}`);
  } catch (err) {
    return err;
  }
}

function getAssertionError(): Error {
  try {
    assert(false, 'asserting false');
    throw new Error(`error expected`);
  } catch (err) {
    return err;
  }
}

test('AssertionError', () => {
  const err = getAssertionError();

  const result = serializeError(err);

  expect(result).toStrictEqual({
    actual: false,
    code: 'ERR_ASSERTION',
    expected: true,
    generatedMessage: false,
    message: 'asserting false',
    name: 'AssertionError',
    operator: '==',
    previous: [],
    stack: expect.arrayContaining([expect.any(String)]),
  });
});

test('URLError', () => {
  const err = getUrlError();
  const result = serializeError(err);

  expect(result).toStrictEqual({
    code: 'ERR_INVALID_URL',
    input: 'lol',
    message: 'Invalid URL: lol',
    name: 'TypeError',
    previous: [],
    stack: expect.arrayContaining([expect.any(String)]),
  });
});

test('CustomError', () => {
  const previousErr = new CustomError('previous').debug({ woo1: 'woo1' });
  const current = new CustomError('current', previousErr).debug({
    woo2: 'woo2',
  });

  expect(current.previous).toBe(previousErr);

  const result = serializeError(current);

  expect(result).toStrictEqual({
    debug: {
      woo2: 'woo2',
    },
    debugData: {
      woo2: 'woo2',
    },
    message: 'current',
    name: 'CustomError',
    previous: [
      {
        debug: {
          woo1: 'woo1',
        },
        debugData: {
          woo1: 'woo1',
        },
        message: 'previous',
        name: 'CustomError',
        previous: [],
        sensitive: true,
        stack: expect.arrayContaining([expect.any(String)]),
        statusCode: 2,
      },
    ],
    sensitive: true,
    stack: expect.arrayContaining([expect.any(String)]),
    statusCode: 2,
  });
});
