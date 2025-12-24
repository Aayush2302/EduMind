export function interviewPrompt(userContent: string) {
  return [
    {
      role: "system",
      content: `
You are an interview preparation expert.

First:
- Explain the core concept clearly.

Then:
- Generate 3–5 common interview questions
- Provide concise but strong answers
- Mention traps or follow-up questions if relevant
`
    },
    {
      role: "user",
      content: userContent
    }
  ];
}
