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

[0, 'string', BigInt(0), false, Symbol('kaboom')].forEach((primitive) => {
  test('dont explode on primitives', () => {
    const result = serializeError(primitive);
    expect(result).toMatchSnapshot({
      stack: expect.arrayContaining([expect.any(String)]),
    });
  });
});

[null, undefined].forEach((primitive) => {
  test('dont explode on voids', () => {
    const result = serializeError(primitive);
    expect(result).toMatchSnapshot({
      stack: expect.arrayContaining([expect.any(String)]),
    });
  });
});

test('AssertionError', () => {
  const err = getAssertionError();

  const result = serializeError(err);

  expect(result).toMatchInlineSnapshot(
    {
      stack: expect.arrayContaining([expect.any(String)]),
    },
    `
    Object {
      "actual": false,
      "code": "ERR_ASSERTION",
      "expected": true,
      "generatedMessage": false,
      "message": "asserting false",
      "name": "AssertionError",
      "operator": "==",
      "stack": ArrayContaining [
        Any<String>,
      ],
    }
  `,
  );
});

test('URLError', () => {
  const err = getUrlError();
  const result = serializeError(err);

  expect(result).toMatchInlineSnapshot(
    {
      stack: expect.arrayContaining([expect.any(String)]),
    },
    `
    Object {
      "code": "ERR_INVALID_URL",
      "input": "lol",
      "message": "Invalid URL: lol",
      "name": "TypeError",
      "stack": ArrayContaining [
        Any<String>,
      ],
    }
  `,
  );
});

test('CustomError', () => {
  const previousErr = new CustomError('previous').debug({ woo1: 'woo1' });
  const current = new CustomError('current', previousErr).debug({
    woo2: 'woo2',
  });

  expect(current.previous).toBe(previousErr);

  const result = serializeError(current);

  expect(result).toMatchInlineSnapshot(
    {
      previous: [
        {
          stack: expect.arrayContaining([expect.any(String)]),
        },
      ],
      stack: expect.arrayContaining([expect.any(String)]),
    },
    `
    Object {
      "debug": Object {
        "woo2": "woo2",
      },
      "debugData": Object {
        "woo2": "woo2",
      },
      "message": "current",
      "name": "CustomError",
      "previous": Array [
        Object {
          "debug": Object {
            "woo1": "woo1",
          },
          "debugData": Object {
            "woo1": "woo1",
          },
          "message": "previous",
          "name": "CustomError",
          "previous": Array [],
          "sensitive": true,
          "stack": ArrayContaining [
            Any<String>,
          ],
          "statusCode": 2,
        },
      ],
      "sensitive": true,
      "stack": ArrayContaining [
        Any<String>,
      ],
      "statusCode": 2,
    }
  `,
  );
});
