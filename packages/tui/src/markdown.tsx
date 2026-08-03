import { Box, Text } from "ink";
import { type ReactElement, type ReactNode } from "react";

type Props = { children: string };

const INLINE_RE =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function isCodeFence(line: string): boolean {
  return /^\s*(```|~~~)/.test(line);
}

function isHeading(line: string): boolean {
  return /^\s*#{1,6}\s/.test(line);
}

function isBullet(line: string): boolean {
  return /^\s*[-*+]\s/.test(line);
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  INLINE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<Text key={`p${nodes.length}`}>{text.slice(last, m.index)}</Text>);
    }
    const raw = m[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      nodes.push(
        <Text key={`b${nodes.length}`} bold>
          {raw.slice(2, -2)}
        </Text>,
      );
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      nodes.push(
        <Text key={`c${nodes.length}`} color="cyan">
          {raw.slice(1, -1)}
        </Text>,
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      nodes.push(
        <Text key={`i${nodes.length}`} italic>
          {raw.slice(1, -1)}
        </Text>,
      );
    } else {
      const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(raw);
      nodes.push(
        <Text key={`l${nodes.length}`} dimColor>
          {match ? `${match[1]} (${match[2]})` : raw}
        </Text>,
      );
    }
    last = m.index + raw.length;
  }
  if (last < text.length) {
    nodes.push(<Text key={`p${last}`}>{text.slice(last)}</Text>);
  }
  return nodes;
}

export function Markdown({ children }: Props): ReactElement {
  const raw = children ?? "";
  const lines = raw.split("\n");
  const nodes: ReactNode[] = [];
  let isCode = false;
  let buffer: string[] = [];

  const flush = (): void => {
    if (buffer.length === 0) {
      return;
    }
    nodes.push(
      <Box key={`code${nodes.length}`} flexDirection="column">
        {buffer.map((l, i) => (
          <Text key={i} color="green">
            {l}
          </Text>
        ))}
      </Box>,
    );
    buffer = [];
  };

  for (const line of lines) {
    if (isCodeFence(line)) {
      if (isCode) {
        flush();
        isCode = false;
      } else {
        flush();
        isCode = true;
      }
      continue;
    }
    if (isCode) {
      buffer.push(line);
      continue;
    }
    if (isHeading(line)) {
      nodes.push(
        <Text key={`h${nodes.length}`} bold>
          {line.replace(/^\s*#{1,6}\s/, "")}
        </Text>,
      );
      continue;
    }
    if (isBullet(line)) {
      nodes.push(
        <Box key={`b${nodes.length}`} paddingLeft={1}>
          <Text dimColor>
            {"• "}
          </Text>
          <Text>{inline(line.replace(/^\s*[-*+]\s/, ""))}</Text>
        </Box>,
      );
      continue;
    }
    nodes.push(<Text key={`t${nodes.length}`}>{inline(line)}</Text>);
  }
  flush();

  return <Box flexDirection="column">{nodes}</Box>;
}