function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(line: string): string {
  let r = escapeHtml(line);
  r = r.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 text-sm font-mono rounded">$1</code>');
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  r = r.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return r;
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const parts: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (line.trim() === '') { if (inList) { parts.push('</ul>'); inList = false; } continue; }
    if (line.startsWith('### ')) { if (inList) { parts.push('</ul>'); inList = false; } parts.push(`<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">${parseInline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { if (inList) { parts.push('</ul>'); inList = false; } parts.push(`<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">${parseInline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# ')) { if (inList) { parts.push('</ul>'); inList = false; } parts.push(`<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${parseInline(line.slice(2))}</h1>`); continue; }
    if (/^[-*]\s/.test(line.trim())) {
      if (!inList) { parts.push('<ul class="list-disc list-inside space-y-1 my-3 ml-4">'); inList = true; }
      parts.push(`<li class="text-gray-700">${parseInline(line.trim().slice(2))}</li>`); continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      if (!inList) { parts.push('<ol class="list-decimal list-inside space-y-1 my-3 ml-4">'); inList = true; }
      parts.push(`<li class="text-gray-700">${parseInline(line.trim().replace(/^\d+\.\s/, ''))}</li>`); continue;
    }
    if (inList) { parts.push('</ul>'); inList = false; }
    parts.push(`<p class="text-gray-700 my-2 leading-relaxed">${parseInline(line)}</p>`);
  }
  if (inList) parts.push('</ul>');
  return parts.join('\n');
}

export function MarkdownRenderer({ content }: { content: string }) {
  return <div className="sop-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />;
}
