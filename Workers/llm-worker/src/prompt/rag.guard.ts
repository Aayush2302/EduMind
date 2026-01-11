export function applyRagConstraint(
  messages: any[],
  constraintMode: "allowed" | "strict"
) {
  if (constraintMode === "strict") {
    messages.unshift({
      role: "system",
      content: `# STRICT DOCUMENT-BASED MODE

You must ONLY use information from the provided documents.

**Rules:**
1. Every claim must come from the documents
2. Do NOT use training knowledge or make inferences
3. If information is missing, say: "I cannot find this information in the provided material."
4. Cite which document each claim comes from
5. No speculation or educated guesses

**You CAN:**
- Synthesize across multiple documents
- Organize information clearly
- Quote directly with attribution

**You CANNOT:**
- Add outside knowledge
- Fill gaps with common sense
- Assume unstated implications

Be honest about limitations - it builds more trust than confidently providing uncertain information.`
    });
  } else if (constraintMode === "allowed") {
    messages.unshift({
      role: "system",
      content: `# DOCUMENT-PREFERRED MODE

Prioritize provided documents, but supplement with general knowledge when helpful.

- Check documents first
- Cite document sources explicitly
- Use your knowledge to add context or explain concepts
- Be transparent when adding information beyond documents

Example: "According to the material, [X]. Additionally, [Y from your knowledge]..."`
    });
  }

  return messages;
}