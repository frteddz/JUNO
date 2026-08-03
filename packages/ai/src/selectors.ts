export const SEL = {
  composer:
    'textarea[data-testid="chat_input_input"], #chat-input, textarea[placeholder], [contenteditable="true"][data-testid], [contenteditable="true"][class*="input"], [contenteditable="true"][role="textbox"]',
  sendButton:
    'button[type="submit"], button[aria-label*="Send"], button[aria-label*="发送"], [data-testid="send-button"]',
  markdown:
    ".ds-markdown, [class*=\"ds-markdown\"], [data-testid*=\"chatMessage\"] [class*=\"markdown\"], [class*=\"chat-message\"] [class*=\"markdown\"]",
  chatContainer: '[class*="chat"], [class*="conversation"]',
} as const;
