import { Box, Text } from "ink";
import type { ReactElement } from "react";

const BANNER = [
  "       █████ █████  █████ ██████   █████    ███████   ",
  "      ▒▒███ ▒▒███  ▒▒███ ▒▒██████ ▒▒███   ███▒▒▒▒▒███ ",
  "       ▒███  ▒███   ▒███  ▒███▒███ ▒███  ███     ▒▒███",
  "       ▒███  ▒███   ▒███  ▒███▒▒███▒███ ▒███      ▒███",
  "       ▒███  ▒███   ▒███  ▒███ ▒▒██████ ▒███      ▒███",
  " ███   ▒███  ▒███   ▒███  ▒███  ▒▒█████ ▒▒███     ███ ",
  "▒▒████████   ▒▒████████   █████  ▒▒█████ ▒▒▒███████▒  ",
  " ▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒▒   ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒▒▒  ",
];

export function Banner({ accent }: { accent: string }): ReactElement {
  return (
    <Box flexDirection="column" alignItems="center">
      {BANNER.map((line, i) => (
        <Text key={i} color={accent}>
          {line}
        </Text>
      ))}
      <Text color="yellow" bold>
        J U N O
      </Text>
      <Text dimColor>
        Just Understands Natural Orders - local, no AI, your terminal.
      </Text>
    </Box>
  );
}
