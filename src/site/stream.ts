// Pulls complete JSON objects out of a text stream as soon as each one closes.
// It only tracks braces and strings, so it does not care whether the model sends one
// object per line, pretty-prints them, wraps them in an array or adds stray prose.

export function createObjectStream(onObject: (value: unknown) => void) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let buf = '';

  return {
    push(chunk: string) {
      for (const ch of chunk) {
        if (depth === 0) {
          if (ch === '{') {
            depth = 1;
            buf = '{';
          }
          continue;
        }
        buf += ch;
        if (inString) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) {
          let value: unknown;
          try {
            value = JSON.parse(buf);
          } catch {
            value = { op: 'invalid', raw: buf.slice(0, 160) };
          }
          buf = '';
          onObject(value);
        }
      }
    },
    /** True while an object has been opened but not yet closed. */
    get pending() {
      return depth > 0;
    },
  };
}
