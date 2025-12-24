export function buildPrompt(userContent: string) {
  return [
    {
      role: "user",
      content: userContent
    }
  ];
}
