import { ChatConversation } from '../types';

export class ChatExportUtil {
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static toMarkdown(conversation: ChatConversation): string {
    const lines: string[] = [];
    lines.push(`# ${conversation.title || 'Conversation'}`);
    lines.push(`- **Model:** ${conversation.model}`);
    lines.push(`- **Exported:** ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of conversation.messages) {
      const isUser = msg.role === 'user';
      lines.push(`### ${isUser ? '👤 User' : `🤖 Assistant (${msg.model || conversation.model})`}`);
      lines.push(`*${new Date(msg.createdAt).toLocaleTimeString()}*`);
      lines.push('');

      if (msg.imageUrl) {
        lines.push(`![Attached Image](${msg.imageUrl})`);
        lines.push('');
      }

      if (msg.reasoning && msg.reasoning.trim()) {
        lines.push('> **Thinking Process:**');
        lines.push('> ' + msg.reasoning.split('\n').join('\n> '));
        lines.push('');
      }

      lines.push(msg.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  static toPlainText(conversation: ChatConversation): string {
    const lines: string[] = [];
    lines.push(`TITLE: ${conversation.title}`);
    lines.push(`MODEL: ${conversation.model}`);
    lines.push(`DATE: ${new Date().toLocaleString()}`);
    lines.push('='.repeat(50));
    lines.push('');

    for (const msg of conversation.messages) {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      lines.push(`[${role}] (${new Date(msg.createdAt).toLocaleTimeString()})`);
      if (msg.reasoning) {
        lines.push(`(Reasoning: ${msg.reasoning.trim()})`);
      }
      lines.push(msg.content);
      lines.push('-'.repeat(40));
      lines.push('');
    }

    return lines.join('\n');
  }

  static exportAs(conversation: ChatConversation, format: 'md' | 'txt' | 'json') {
    const slug = (conversation.title || 'chat').slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'md') {
      const md = this.toMarkdown(conversation);
      this.downloadFile(md, `${slug}.md`, 'text/markdown;charset=utf-8');
    } else if (format === 'txt') {
      const txt = this.toPlainText(conversation);
      this.downloadFile(txt, `${slug}.txt`, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      const json = JSON.stringify(conversation, null, 2);
      this.downloadFile(json, `${slug}.json`, 'application/json;charset=utf-8');
    }
  }
}
