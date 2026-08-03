const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "**": 3 };

function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i]!;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expression.length && /[0-9.]/.test(expression[j]!)) j++;
      tokens.push(expression.slice(i, j));
      i = j;
      continue;
    }
    if (ch === "*" && expression[i + 1] === "*") {
      tokens.push("**");
      i += 2;
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    if (/[a-zA-Z%^]/.test(ch)) {
      if (ch === "%") {
        tokens.push("%");
        i++;
        continue;
      }
      throw new Error(`Unsupported character "${ch}" in expression`);
    }
    throw new Error(`Unexpected character "${ch}" in expression`);
  }
  return tokens;
}

function toRpn(tokens: string[]): string[] {
  const out: string[] = [];
  const ops: string[] = [];
  for (const t of tokens) {
    if (/^[0-9.]+$/.test(t)) {
      out.push(t);
    } else if (t === "(") {
      ops.push(t);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()!);
      if (ops.length) ops.pop();
    } else {
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        (PRECEDENCE[ops[ops.length - 1]!] ?? 0) >= (PRECEDENCE[t] ?? 0)
      ) {
        out.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) out.push(ops.pop()!);
  return out;
}

function evalRpn(rpn: string[]): number {
  const stack: number[] = [];
  for (const t of rpn) {
    if (/^[0-9.]+$/.test(t)) {
      stack.push(Number(t));
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("Invalid expression");
      let result: number;
      switch (t) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
          result = a * b;
          break;
        case "/":
          if (b === 0) throw new Error("Division by zero");
          result = a / b;
          break;
        case "**":
          result = a ** b;
          break;
        case "%":
          if (b === 0) throw new Error("Division by zero");
          result = a % b;
          break;
        default:
          throw new Error(`Unknown operator "${t}"`);
      }
      if (!Number.isFinite(result)) throw new Error("Result is not finite");
      stack.push(result);
    }
  }
  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0]!;
}

export function calculate(expression: string): number {
  const normalized = expression.replace(/\b(\d+)\s*\^\s*(\d+)\b/g, "$1**$2");
  const sanitized = normalized.replace(/[%=^]/g, (c) => (c === "%" ? "%" : "**"));
  return evalRpn(toRpn(tokenize(sanitized)));
}