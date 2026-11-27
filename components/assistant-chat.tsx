'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AssistantRequestPayload, ChatMessage } from '@/types';

interface AssistantChatProps {
  payload: AssistantRequestPayload | null;
  disabled?: boolean;
}

const SUGGESTIONS = [
  'Is it safe to run at 6 AM?',
  'Why is AQI high today?',
  'What is PM2.5?',
  'Should children play outside?',
];

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

/** Streaming, grounded AI chat about the selected city's air quality. */
export function AssistantChat({ payload, disabled }: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function ask(question: string) {
    if (!payload || streaming) return;
    setError(null);
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: question },
      { id: nextId(), role: 'assistant', content: '' },
    ]);
    setStreaming(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, question }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : 'The assistant is unavailable right now.';
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming is not supported in this browser.');
      const decoder = new TextDecoder();
      const assistantId = messageCounter;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === `msg-${assistantId}` ? { ...m, content: m.content + text } : m))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setMessages((prev) => prev.filter((m) => m.content !== '' || m.role === 'user'));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section aria-labelledby="assistant-heading" className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="assistant-heading" className="text-sm font-semibold">
          Ask the AI assistant
        </h2>
      </div>

      <div ref={listRef} className="max-h-80 min-h-40 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite" aria-busy={streaming}>
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ask anything about air quality in {payload?.city.name ?? 'your city'}. Answers use live data.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={disabled || streaming || !payload}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </span>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {m.content || (streaming ? '…' : '')}
            </div>
            {m.role === 'user' && (
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = input.trim();
          if (trimmed.length >= 3) ask(trimmed);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about air quality…"
          aria-label="Your question"
          maxLength={500}
          disabled={disabled || streaming || !payload}
        />
        <Button type="submit" size="icon" disabled={disabled || streaming || !payload || input.trim().length < 3}>
          <SendHorizonal className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Send question</span>
        </Button>
      </form>
    </section>
  );
}
