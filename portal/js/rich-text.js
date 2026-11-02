// Shared helper for rendering user-entered multi-line text with simple bullet
// list and bold support:
//   - a line starting with "-", "*", or "•" becomes a bullet point
//   - **text** becomes bold
//   - blank lines separate paragraphs
// Used anywhere a longer description/body text is displayed
// (News, Veranstaltungen, Bibliothek, ...).

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function applyInlineFormatting(escapedText) {
  return escapedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderRichText(text) {
  if (!text) return '';

  const lines = text.split('\n');
  let html = '';
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length) {
      html += '<ul class="rich-text-list">' + listBuffer.map(item => `<li>${item}</li>`).join('') + '</ul>';
      listBuffer = [];
    }
  }

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) { flushList(); return; }

    const bulletMatch = line.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(applyInlineFormatting(escapeHtml(bulletMatch[1])));
    } else {
      flushList();
      html += `<p>${applyInlineFormatting(escapeHtml(line))}</p>`;
    }
  });

  flushList();
  return html;
}
