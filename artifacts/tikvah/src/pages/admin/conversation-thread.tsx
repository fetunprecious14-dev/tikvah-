import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import {
  useAdminGetConversation,
  useAdminCreateConversationMessage,
  useAdminUpdateConversation,
  getAdminGetConversationQueryKey,
  getAdminListConversationsQueryKey,
  ConversationStatus,
} from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';

const statusOptions = [
  { value: ConversationStatus.awaiting_reply, label: 'Awaiting reply' },
  { value: ConversationStatus.responded, label: 'Responded' },
  { value: ConversationStatus.urgent, label: 'Urgent' },
  { value: ConversationStatus.archived, label: 'Archived' },
];

export function AdminConversationThread({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: conversation, isLoading } = useAdminGetConversation(id);
  const sendMessage = useAdminCreateConversationMessage();
  const updateConversation = useAdminUpdateConversation();
  const [text, setText] = useState('');
  const [tagInput, setTagInput] = useState('');

  const formatTime = (value: string | Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getAdminGetConversationQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getAdminListConversationsQueryKey() });
  };

  const submit = () => {
    if (!text.trim() || sendMessage.isPending) return;
    sendMessage.mutate({ id, data: { body: text } }, { onSuccess: () => { setText(''); refresh(); } });
  };

  const setStatus = (status: (typeof statusOptions)[number]['value']) => {
    updateConversation.mutate({ id, data: { status } }, { onSuccess: refresh });
  };

  const addTag = () => {
    if (!tagInput.trim() || !conversation) return;
    const tags = Array.from(new Set([...conversation.tags, tagInput.trim()]));
    updateConversation.mutate({ id, data: { tags } }, { onSuccess: refresh });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!conversation) return;
    updateConversation.mutate({ id, data: { tags: conversation.tags.filter(t => t !== tag) } }, { onSuccess: refresh });
  };

  if (isLoading || !conversation) {
    return (
      <Shell>
        <section className="mx-auto max-w-[820px] px-5 py-24 text-center sm:px-8"><p className="text-sm text-muted-foreground">Loading conversation…</p></section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mx-auto max-w-[820px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary" data-testid="link-back-admin-inbox">
          <ArrowLeft size={13} /> Back to inbox
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-serif text-2xl">{conversation.user.name}</p>
            <p className="text-xs text-muted-foreground">{conversation.user.email}</p>
          </div>
          {conversation.status === 'urgent' && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1.5 text-[11px] font-semibold text-destructive"><AlertTriangle size={12} /> Urgent</span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Status</span>
            <select
              value={conversation.status}
              onChange={e => setStatus(e.target.value as (typeof statusOptions)[number]['value'])}
              data-testid="select-conversation-status"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground outline-none"
            >
              {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {conversation.tags.map(tag => (
              <button key={tag} onClick={() => removeTag(tag)} data-testid={`button-remove-tag-${tag}`} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                {tag} ×
              </button>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              data-testid="input-add-tag"
              placeholder="Add a tag…"
              className="min-w-[100px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {conversation.messages.map(message => (
            <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${message.senderType === 'admin' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}
                data-testid={`admin-message-${message.id}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[.1em] opacity-70">{message.senderName}</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">{message.body}</p>
                {message.riskCategories && message.riskCategories.length > 0 && (
                  <p className="mt-2 text-[11px] text-destructive">Flagged: {message.riskCategories.join(', ')}</p>
                )}
                <time className="mt-2 block text-[11px] opacity-60">{formatTime(message.createdAt)}</time>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            data-testid="textarea-admin-reply"
            placeholder="Write a compassionate reply…"
            className="min-h-[130px] w-full resize-none bg-transparent text-[15px] leading-6 outline-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={!text.trim() || sendMessage.isPending} testId="button-send-admin-reply">
              {sendMessage.isPending ? 'Sending…' : <>Send reply <ArrowRight size={15} /></>}
            </Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}
