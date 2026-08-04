import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { useGetConversation, useCreateConversationMessage, getGetConversationQueryKey, getListConversationsQueryKey } from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';

const statusLabels: Record<string, string> = {
  awaiting_reply: 'Awaiting reply',
  responded: 'Responded',
  urgent: 'Urgent',
  archived: 'Archived',
};

export function ConversationThread({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: conversation, isLoading } = useGetConversation(id);
  const sendMessage = useCreateConversationMessage();
  const [text, setText] = useState('');

  const formatTime = (value: string | Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
  };

  const submit = () => {
    if (!text.trim() || sendMessage.isPending) return;
    sendMessage.mutate({ id, data: { body: text } }, { onSuccess: () => { setText(''); refresh(); } });
  };

  if (isLoading || !conversation) {
    return (
      <Shell>
        <section className="mx-auto max-w-[760px] px-5 py-24 text-center sm:px-8"><p className="text-sm text-muted-foreground">Loading conversation…</p></section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mx-auto max-w-[760px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <Link href="/conversations" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary" data-testid="link-back-conversations">
          <ArrowLeft size={13} /> Back to conversations
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-foreground">{statusLabels[conversation.status]}</span>
          {conversation.status === 'urgent' && (
            <span className="flex items-center gap-1 text-[11px] text-destructive"><AlertTriangle size={12} /> Flagged for urgent review</span>
          )}
        </div>

        <div className="mt-6 space-y-5">
          {conversation.messages.map(message => (
            <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${message.senderType === 'admin' ? 'border border-border bg-secondary/60' : 'bg-primary text-primary-foreground'}`}
                data-testid={`message-${message.id}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[.1em] opacity-70">{message.senderName}</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">{message.body}</p>
                <time className="mt-2 block text-[11px] opacity-60">{formatTime(message.createdAt)}</time>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            data-testid="textarea-reply"
            placeholder="Write a reply…"
            className="min-h-[110px] w-full resize-none bg-transparent text-[15px] leading-6 outline-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={!text.trim() || sendMessage.isPending} testId="button-send-reply">
              {sendMessage.isPending ? 'Sending…' : <>Send <ArrowRight size={15} /></>}
            </Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}
