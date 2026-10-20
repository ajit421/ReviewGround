/**
 * ReviewGround - Mermaid Diagram Sanitizer
 * Automatically validates and heals common LLM-generated Mermaid syntax glitches
 * (such as hallucinated words inside arrows: e.g. `--yminus->>`, `--return->>`, `-call->>`)
 * to prevent GitHub Markdown rendering errors ("Unable to render rich display").
 */

/**
 * Heals sequence diagram arrows by stripping hallucinated words or extra characters.
 * Examples:
 *   `DB--yminus->>PaymentAPI` -> `DB-->>PaymentAPI`
 *   `A--return->>B`           -> `A-->>B`
 *   `A-call->>B`             -> `A->>B`
 *   `A--response-->B`        -> `A-->B`
 *   `A-- >>B`                -> `A-->>B`
 */
export function sanitizeSequenceDiagram(text: string): string {
  const lines = text.split('\n');
  const sanitizedLines = lines.map((line) => {
    let cleaned = line;

    // Fix dotted arrow with embedded word: e.g. --yminus->> or --return->> or --something->>
    cleaned = cleaned.replace(/--[a-zA-Z0-9_]+->>/g, '-->>');

    // Fix solid arrow with embedded word: e.g. -call->> or -fetch->>
    cleaned = cleaned.replace(/(?<!-)-[a-zA-Z0-9_]+->>/g, '->>');

    // Fix dotted open arrow with embedded word: e.g. --yminus-->
    cleaned = cleaned.replace(/--[a-zA-Z0-9_]+-->/g, '-->');

    // Fix solid open arrow with embedded word: e.g. -call-->
    cleaned = cleaned.replace(/(?<!-)-[a-zA-Z0-9_]+-->/g, '-->');

    // Fix broken arrow spacing: e.g. `-- >>` or `- >>` or `-> >`
    cleaned = cleaned.replace(/--\s+>>/g, '-->>');
    cleaned = cleaned.replace(/(?<!-)-\s+>>/g, '->>');
    cleaned = cleaned.replace(/->\s+>/g, '->>');

    return cleaned;
  });

  return sanitizedLines.join('\n');
}

/**
 * Scans markdown text for ```mermaid code blocks and sanitizes their content
 * to prevent GitHub "Unable to render rich display" parse errors.
 */
export function sanitizeMermaidInMarkdown(markdown: string): string {
  if (!markdown || !markdown.includes('```mermaid')) {
    return markdown;
  }

  return markdown.replace(/```mermaid\s*([\s\S]*?)```/g, (_fullMatch, diagramBody: string) => {
    let sanitized = diagramBody;
    if (sanitized.includes('sequenceDiagram')) {
      sanitized = sanitizeSequenceDiagram(sanitized);
    }
    return `\`\`\`mermaid\n${sanitized.trim()}\n\`\`\``;
  });
}
