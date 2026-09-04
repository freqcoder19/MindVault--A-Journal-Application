import DOMPurify from 'dompurify';

/**
 * Sanitizes rich text HTML to ensure safe rendering without XSS vulnerabilities.
 * Whitelists common formatting tags and inline style properties while stripping
 * script tags, event handlers, iframes, and dangerous attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // If it doesn't contain HTML tags, return as safe text or wrap
  if (!html.includes('<') && !html.includes('>')) {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'font', 
      'ul', 'ol', 'li', 'div', 'h1', 'h2', 'h3', 'h4', 'blockquote',
      'strike', 's'
    ],
    ALLOWED_ATTR: ['style', 'class', 'color', 'face', 'size', 'align', 'dir']
  });
}

/**
 * Converts rich text HTML into clean, human-readable plain text.
 * Used when sending journal context to Gemini so that AI models receive
 * pure natural language without cluttering HTML tags.
 */
export function extractPlainText(htmlOrText: string): string {
  if (!htmlOrText) return '';
  
  if (!htmlOrText.includes('<') && !htmlOrText.includes('>')) {
    return htmlOrText.trim();
  }

  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = htmlOrText;
    
    // Add line breaks for br tags
    temp.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    
    // Add line breaks for block tags
    temp.querySelectorAll('p, div, li, h1, h2, h3, h4, blockquote').forEach(block => {
      block.append(document.createTextNode('\n'));
    });
    
    const text = temp.textContent || temp.innerText || '';
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  return htmlOrText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes and prepares HTML for rendering in the UI.
 * If the input is legacy plain text (no HTML tags), converts newlines to <br />.
 */
export function renderRichTextHtml(content: string): string {
  if (!content) return '';
  let formatted = content;
  if (!/<[a-z][\s\S]*>/i.test(content)) {
    formatted = content.replace(/\n/g, '<br />');
  }
  return sanitizeHtml(formatted);
}

export function calculateWordCount(content: string): number {
  const plain = extractPlainText(content);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/**
 * Checks whether content is effectively empty (empty string, blank spaces, or just empty tags)
 */
export function isContentEmpty(htmlOrText: string): boolean {
  if (!htmlOrText) return true;
  const plain = extractPlainText(htmlOrText);
  return plain.length === 0;
}
