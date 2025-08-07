/**
 * Formatea el contenido del mensaje para detectar y estilizar el razonamiento del modelo
 */
export function formatReasoningContent(content: string): string {
  // Patrones comunes de razonamiento en diferentes formatos
  const reasoningPatterns = [
    // Formato <reasoning>...</reasoning>
    {
      pattern: /<reasoning>([\s\S]*?)<\/reasoning>/gi,
      replacement: '\n\n🤖 **Pensamientos del robot:**\n```thinking\n$1\n```\n\n'
    },
    // Formato {reasoning: ...}
    {
      pattern: /\{reasoning:\s*([\s\S]*?)\}/gi,
      replacement: '\n\n🤖 **Pensamientos del robot:**\n```thinking\n$1\n```\n\n'
    },
    // Formato [reasoning]...[/reasoning]
    {
      pattern: /\[reasoning\]([\s\S]*?)\[\/reasoning\]/gi,
      replacement: '\n\n🤖 **Pensamientos del robot:**\n```thinking\n$1\n```\n\n'
    },
    // Formato "reasoning": "..."
    {
      pattern: /"reasoning":\s*"([\s\S]*?)"/gi,
      replacement: '\n\n🤖 **Pensamientos del robot:**\n```thinking\n$1\n```\n\n'
    },
    // Formato thinking: ...
    {
      pattern: /^thinking:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/gim,
      replacement: '\n\n🤖 **Pensamientos del robot:**\n```thinking\n$1\n```\n\n'
    }
  ];

  let formattedContent = content;

  // Aplicar todos los patrones de formateo
  reasoningPatterns.forEach(({ pattern, replacement }) => {
    formattedContent = formattedContent.replace(pattern, replacement);
  });

  // Limpiar espacios múltiples y saltos de línea excesivos
  formattedContent = formattedContent
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return formattedContent;
}

/**
 * Extrae el contenido de razonamiento si existe
 */
export function extractReasoningContent(content: string): {
  reasoning: string | null;
  mainContent: string;
} {
  const reasoningPatterns = [
    /<reasoning>([\s\S]*?)<\/reasoning>/gi,
    /\{reasoning:\s*([\s\S]*?)\}/gi,
    /\[reasoning\]([\s\S]*?)\[\/reasoning\]/gi,
    /"reasoning":\s*"([\s\S]*?)"/gi,
    /^thinking:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/gim
  ];

  let reasoning: string | null = null;
  let mainContent = content;

  for (const pattern of reasoningPatterns) {
    const match = pattern.exec(content);
    if (match) {
      reasoning = match[1].trim();
      mainContent = content.replace(pattern, '').trim();
      break;
    }
  }

  return { reasoning, mainContent };
}