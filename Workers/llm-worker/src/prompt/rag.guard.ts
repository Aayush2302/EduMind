export function applyRagConstraint(
  messages: any[],
  constraintMode: "allowed" | "strict"
) {
  if (constraintMode === "strict") {
    messages.unshift({
      role: "system",
      content: `
You must answer ONLY using the provided documents.
If the answer is not present in the documents, reply:
"I cannot find this information in the provided material."
Do NOT use outside knowledge.
`
    });
  }

  return messages;
}
