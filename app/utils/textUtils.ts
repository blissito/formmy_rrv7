/**
 * Remove HTML tags from a string and return plain text
 * @param html - HTML string to clean
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Replace <br> and </p> tags with newlines to preserve line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  text = textarea.value;
  
  // Clean up extra whitespace but preserve intentional line breaks
  text = text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
  
  return text.trim();
}

/**
 * Server-side version of stripHtmlTags that doesn't use DOM
 * @param html - HTML string to clean
 * @returns Plain text without HTML tags
 */
export function stripHtmlTagsServer(html: string): string {
  if (!html) return '';
  
  // Replace <br> and </p> tags with newlines to preserve line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Clean up extra whitespace but preserve intentional line breaks
  text = text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
  
  return text.trim();
}