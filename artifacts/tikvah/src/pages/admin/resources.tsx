import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  useAdminListResources,
  useAdminCreateResource,
  useAdminUpdateResource,
  useAdminDeleteResource,
  getAdminListResourcesQueryKey,
  ResourceTopic,
  ResourceType,
  type Resource,
} from '@workspace/api-client-react';
import { Shell, PageIntro, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';
import { AdminNav } from './admin-nav';

const topicOptions = Object.values(ResourceTopic);
const typeOptions = Object.values(ResourceType);

type ResourceFormValues = {
  title: string;
  description: string;
  type: Resource['type'];
  topic: Resource['topic'];
  url: string;
  body: string;
};

const emptyForm: ResourceFormValues = { title: '', description: '', type: 'article', topic: 'anxiety', url: '', body: '' };

function ResourceForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: ResourceFormValues;
  onSubmit: (values: ResourceFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState(initial);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input
            required
            value={values.title}
            onChange={e => setValues({ ...values, title: e.target.value })}
            data-testid="input-resource-title"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Type</label>
            <select
              value={values.type}
              onChange={e => setValues({ ...values, type: e.target.value as Resource['type'] })}
              data-testid="select-resource-type"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Topic</label>
            <select
              value={values.topic}
              onChange={e => setValues({ ...values, topic: e.target.value as Resource['topic'] })}
              data-testid="select-resource-topic"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {topicOptions.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Description</label>
        <textarea
          required
          value={values.description}
          onChange={e => setValues({ ...values, description: e.target.value })}
          data-testid="input-resource-description"
          className="mt-2 min-h-[70px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Link (optional — for articles, books, videos, podcasts)</label>
          <input
            type="url"
            value={values.url}
            onChange={e => setValues({ ...values, url: e.target.value })}
            data-testid="input-resource-url"
            placeholder="https://…"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Inline content (optional — for prompts, tips, verses, exercises)</label>
          <textarea
            value={values.body}
            onChange={e => setValues({ ...values, body: e.target.value })}
            data-testid="input-resource-body"
            className="mt-2 min-h-[70px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} secondary testId="button-resource-form-cancel">Cancel</Button>
        <Button type="submit" disabled={submitting} testId="button-resource-form-submit">{submitting ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export function AdminResources() {
  const { data: resources = [], isLoading } = useAdminListResources();
  const createResource = useAdminCreateResource();
  const updateResource = useAdminUpdateResource();
  const deleteResource = useAdminDeleteResource();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getAdminListResourcesQueryKey() });

  const handleCreate = (values: ResourceFormValues) => {
    createResource.mutate(
      { data: { ...values, url: values.url || undefined, body: values.body || undefined } },
      { onSuccess: () => { setCreating(false); refresh(); } },
    );
  };

  const handleUpdate = (id: string, values: ResourceFormValues) => {
    updateResource.mutate(
      { id, data: { ...values, url: values.url || null, body: values.body || null } },
      { onSuccess: () => { setEditingId(null); refresh(); } },
    );
  };

  const handleDelete = (resource: Resource) => {
    if (!window.confirm(`Remove "${resource.title}" from the library?`)) return;
    deleteResource.mutate({ id: resource.id }, { onSuccess: refresh });
  };

  return (
    <Shell>
      <PageIntro eyebrow="Admin" title={<>The resource library.</>}>Add, edit, or retire what's on the shelf.</PageIntro>
      <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <AdminNav active="resources" />

        <div className="mt-8 flex items-center justify-between border-y border-border py-5">
          <p className="text-sm text-muted-foreground">{resources.length} resource{resources.length === 1 ? '' : 's'}</p>
          {!creating && (
            <Button onClick={() => setCreating(true)} testId="button-add-resource">
              <Plus size={15} /> Add resource
            </Button>
          )}
        </div>

        {creating && (
          <div className="mt-6">
            <ResourceForm initial={emptyForm} submitting={createResource.isPending} onCancel={() => setCreating(false)} onSubmit={handleCreate} />
          </div>
        )}

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 space-y-3">
            {resources.map(resource =>
              editingId === resource.id ? (
                <ResourceForm
                  key={resource.id}
                  initial={{
                    title: resource.title,
                    description: resource.description,
                    type: resource.type,
                    topic: resource.topic,
                    url: resource.url ?? '',
                    body: resource.body ?? '',
                  }}
                  submitting={updateResource.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={values => handleUpdate(resource.id, values)}
                />
              ) : (
                <div key={resource.id} data-testid={`admin-resource-${resource.id}`} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">{resource.type} · {resource.topic}</span>
                    <p className="mt-1 font-serif text-xl">{resource.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setEditingId(resource.id)}
                      data-testid={`button-edit-resource-${resource.id}`}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resource)}
                      aria-label={`Delete ${resource.title}`}
                      data-testid={`button-delete-resource-${resource.id}`}
                      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </Shell>
  );
}
