import { useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, UserRoundSearch } from 'lucide-react';
import {
  getAdminListProfessionalsQueryKey,
  getListProfessionalsQueryKey,
  useAdminCreateProfessional,
  useAdminDeleteProfessional,
  useAdminListProfessionals,
  useAdminUpdateProfessional,
  type CreateProfessionalRequest,
  type Professional,
} from '@workspace/api-client-react';
import { Shell } from '@/components/shell';
import { AdminNav } from './admin-nav';
import { AdminErrorState, AdminMutationError } from './admin-feedback';
import { queryClient } from '@/lib/queryClient';
import { hasProfessionalContact, parseCommaSeparated } from '@/lib/professionals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type FormValues = Omit<CreateProfessionalRequest, 'specialties' | 'languages'> & {
  specialties: string;
  languages: string;
};

type FormErrors = Partial<Record<'name' | 'profession' | 'bio' | 'contact', string>>;

const emptyForm: FormValues = {
  name: '',
  profession: '',
  credentials: '',
  bio: '',
  specialties: '',
  languages: '',
  phone: '',
  email: '',
  website: '',
  location: '',
  offersRemote: false,
  offersInPerson: false,
  imageUrl: '',
  isPublished: false,
  displayOrder: 0,
};

function formFromProfessional(professional: Professional): FormValues {
  return {
    ...professional,
    credentials: professional.credentials ?? '',
    specialties: professional.specialties.join(', '),
    languages: professional.languages.join(', '),
    phone: professional.phone ?? '',
    email: professional.email ?? '',
    website: professional.website ?? '',
    location: professional.location ?? '',
    imageUrl: professional.imageUrl ?? '',
  };
}

function payloadFromForm(values: FormValues): CreateProfessionalRequest {
  return {
    ...values,
    name: values.name.trim(),
    profession: values.profession.trim(),
    credentials: values.credentials?.trim() || null,
    bio: values.bio.trim(),
    specialties: parseCommaSeparated(values.specialties),
    languages: parseCommaSeparated(values.languages),
    phone: values.phone?.trim() || null,
    email: values.email?.trim() || null,
    website: values.website?.trim() || null,
    location: values.location?.trim() || null,
    imageUrl: values.imageUrl?.trim() || null,
  };
}

function ProfessionalForm({
  initial,
  mutationError,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: FormValues;
  mutationError: unknown;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateProfessionalRequest) => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => {
      const next = { ...current };
      if (key === 'name') delete next.name;
      if (key === 'profession') delete next.profession;
      if (key === 'bio') delete next.bio;
      if (key === 'phone' || key === 'email' || key === 'website') delete next.contact;
      return next;
    });
  };

  const submit = () => {
    const payload = payloadFromForm(values);
    const nextErrors: FormErrors = {};
    if (!payload.name) nextErrors.name = 'Enter the professional’s name.';
    if (!payload.profession) nextErrors.profession = 'Enter their professional role.';
    if (!payload.bio) nextErrors.bio = 'Add a short introduction for visitors.';
    if (payload.isPublished && !hasProfessionalContact(payload)) {
      nextErrors.contact = 'Add a phone number, email address, or website before publishing.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(payload);
  };

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        submit();
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="professional-name">Full name</FieldLabel>
              <Input
                id="professional-name"
                autoFocus
                required
                maxLength={120}
                value={values.name}
                onChange={event => setValue('name', event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.profession)}>
              <FieldLabel htmlFor="professional-role">Professional role</FieldLabel>
              <Input
                id="professional-role"
                required
                maxLength={120}
                placeholder="Clinical psychologist"
                value={values.profession}
                onChange={event => setValue('profession', event.target.value)}
                aria-invalid={Boolean(errors.profession)}
              />
              <FieldError>{errors.profession}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="professional-credentials">Credentials</FieldLabel>
              <Input
                id="professional-credentials"
                maxLength={160}
                placeholder="PhD, LPC"
                value={values.credentials ?? ''}
                onChange={event => setValue('credentials', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="professional-photo">Profile image URL</FieldLabel>
              <Input id="professional-photo" type="url" placeholder="https://…" value={values.imageUrl ?? ''} onChange={event => setValue('imageUrl', event.target.value)} />
            </Field>
          </FieldGroup>
          <Field data-invalid={Boolean(errors.bio)}>
            <FieldLabel htmlFor="professional-bio">Short introduction</FieldLabel>
            <Textarea
              id="professional-bio"
              required
              maxLength={1000}
              rows={4}
              placeholder="Help visitors understand who this person supports and how they work."
              value={values.bio}
              onChange={event => setValue('bio', event.target.value)}
              aria-invalid={Boolean(errors.bio)}
            />
            <FieldDescription>{values.bio.length}/1000 characters</FieldDescription>
            <FieldError>{errors.bio}</FieldError>
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Care details</FieldLegend>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="professional-specialties">Specialties</FieldLabel>
              <Input
                id="professional-specialties"
                placeholder="Anxiety, grief, trauma"
                value={values.specialties}
                onChange={event => setValue('specialties', event.target.value)}
              />
              <FieldDescription>Separate each specialty with a comma.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="professional-languages">Languages</FieldLabel>
              <Input id="professional-languages" placeholder="English, Yoruba" value={values.languages} onChange={event => setValue('languages', event.target.value)} />
              <FieldDescription>Separate each language with a comma.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="professional-location">Location</FieldLabel>
              <Input
                id="professional-location"
                maxLength={160}
                placeholder="Lagos, Nigeria"
                value={values.location ?? ''}
                onChange={event => setValue('location', event.target.value)}
              />
            </Field>
            <FieldGroup className="gap-3">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="professional-remote">Remote appointments</FieldLabel>
                  <FieldDescription>Available by phone or video.</FieldDescription>
                </FieldContent>
                <Switch id="professional-remote" checked={values.offersRemote} onCheckedChange={checked => setValue('offersRemote', checked)} />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="professional-in-person">In-person appointments</FieldLabel>
                  <FieldDescription>Visitors can attend at a physical location.</FieldDescription>
                </FieldContent>
                <Switch id="professional-in-person" checked={values.offersInPerson} onCheckedChange={checked => setValue('offersInPerson', checked)} />
              </Field>
            </FieldGroup>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Contact</FieldLegend>
          <FieldDescription>At least one contact method is required before this profile can be published.</FieldDescription>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.contact)}>
              <FieldLabel htmlFor="professional-phone">Phone number</FieldLabel>
              <Input
                id="professional-phone"
                type="tel"
                maxLength={40}
                placeholder="+234…"
                value={values.phone ?? ''}
                onChange={event => setValue('phone', event.target.value)}
                aria-invalid={Boolean(errors.contact)}
              />
            </Field>
            <Field data-invalid={Boolean(errors.contact)}>
              <FieldLabel htmlFor="professional-email">Email address</FieldLabel>
              <Input
                id="professional-email"
                type="email"
                value={values.email ?? ''}
                onChange={event => setValue('email', event.target.value)}
                aria-invalid={Boolean(errors.contact)}
              />
            </Field>
            <Field data-invalid={Boolean(errors.contact)}>
              <FieldLabel htmlFor="professional-website">Website or booking link</FieldLabel>
              <Input
                id="professional-website"
                type="url"
                placeholder="https://…"
                value={values.website ?? ''}
                onChange={event => setValue('website', event.target.value)}
                aria-invalid={Boolean(errors.contact)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="professional-order">Display priority</FieldLabel>
              <Input
                id="professional-order"
                type="number"
                min={0}
                value={values.displayOrder}
                onChange={event => setValue('displayOrder', Math.max(0, Number(event.target.value) || 0))}
              />
              <FieldDescription>Lower numbers appear first.</FieldDescription>
            </Field>
          </FieldGroup>
          <FieldError>{errors.contact}</FieldError>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="professional-published">Publish on the site</FieldLabel>
              <FieldDescription>Turn this off to save a private draft or remove the profile from public view.</FieldDescription>
            </FieldContent>
            <Switch id="professional-published" checked={values.isPublished} onCheckedChange={checked => setValue('isPublished', checked)} />
          </Field>
        </FieldSet>

        <AdminMutationError error={mutationError} fallback="We could not save this professional. Your changes are still here—please try again." />
      </FieldGroup>

      <DialogFooter className="mt-8 gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : values.isPublished ? 'Save and publish' : 'Save draft'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdminProfessionals() {
  const { data: professionals = [], isLoading, isError, error, refetch, isFetching } = useAdminListProfessionals();
  const createProfessional = useAdminCreateProfessional();
  const updateProfessional = useAdminUpdateProfessional();
  const toggleProfessional = useAdminUpdateProfessional();
  const deleteProfessional = useAdminDeleteProfessional();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);

  const publishedCount = professionals.filter(professional => professional.isPublished).length;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return professionals.filter(professional => {
      const matchesStatus = status === 'all' || (status === 'published' ? professional.isPublished : !professional.isPublished);
      const matchesSearch =
        !term ||
        [professional.name, professional.profession, professional.location, ...professional.specialties].filter(Boolean).some(value => value!.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [professionals, search, status]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getAdminListProfessionalsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getListProfessionalsQueryKey(),
      }),
    ]);
  };

  const openCreate = () => {
    setEditing(null);
    createProfessional.reset();
    setFormOpen(true);
  };

  const openEdit = (professional: Professional) => {
    setEditing(professional);
    updateProfessional.reset();
    setFormOpen(true);
  };

  const save = (values: CreateProfessionalRequest) => {
    if (editing) {
      updateProfessional.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: async () => {
            setFormOpen(false);
            await refresh();
          },
        },
      );
      return;
    }
    createProfessional.mutate(
      { data: values },
      {
        onSuccess: async () => {
          setFormOpen(false);
          await refresh();
        },
      },
    );
  };

  const togglePublished = (professional: Professional, isPublished: boolean) => {
    toggleProfessional.reset();
    toggleProfessional.mutate({ id: professional.id, data: { isPublished } }, { onSuccess: refresh });
  };

  const remove = (professional: Professional) => {
    deleteProfessional.reset();
    deleteProfessional.mutate({ id: professional.id }, { onSuccess: refresh });
  };

  const nextOrder = professionals.length ? Math.max(...professionals.map(item => item.displayOrder)) + 10 : 0;

  return (
    <Shell>
      <section className="mx-auto max-w-[1100px] px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
        <h1 className="max-w-3xl font-serif text-[clamp(42px,7vw,72px)] leading-[.98] tracking-[-.04em] text-balance">Professional directory</h1>
        <p className="mt-6 max-w-2xl text-[16px] leading-7 text-muted-foreground">
          Keep trustworthy professional help current. Draft profiles privately, check the contact details, then publish when they are ready.
        </p>
      </section>
      <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <AdminNav active="professionals" />

        <div className="mt-8 flex flex-col gap-5 border-y border-border py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-6 text-sm">
            <span>
              <strong className="font-semibold text-foreground">{professionals.length}</strong> <span className="text-muted-foreground">total</span>
            </span>
            <span>
              <strong className="font-semibold text-foreground">{publishedCount}</strong> <span className="text-muted-foreground">published</span>
            </span>
            <span>
              <strong className="font-semibold text-foreground">{professionals.length - publishedCount}</strong> <span className="text-muted-foreground">drafts</span>
            </span>
          </div>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Add professional
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field>
            <FieldLabel htmlFor="professional-search" className="sr-only">
              Search professionals
            </FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="professional-search"
                type="search"
                className="pl-9"
                placeholder="Search by name, role, specialty, or location"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="professional-status" className="sr-only">
              Filter by status
            </FieldLabel>
            <Select value={status} onValueChange={value => setStatus(value as typeof status)}>
              <SelectTrigger id="professional-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All profiles</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-6">
          <AdminMutationError error={toggleProfessional.error ?? deleteProfessional.error} fallback="We could not complete that change. Please try again." />
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Loading professionals">
            {[0, 1, 2, 3].map(item => (
              <Skeleton key={item} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              void refetch();
            }}
            retrying={isFetching}
            title="We could not load the professional directory."
          />
        ) : filtered.length === 0 ? (
          <Empty className="mt-8 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundSearch />
              </EmptyMedia>
              <EmptyTitle>{professionals.length ? 'No profiles match those filters' : 'No professionals yet'}</EmptyTitle>
              <EmptyDescription>
                {professionals.length ? 'Try another name or show all profile statuses.' : 'Add the first professional as a draft, then publish it when the details are ready.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {professionals.length ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus data-icon="inline-start" />
                  Add professional
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map(professional => (
              <Card key={professional.id} data-testid={`admin-professional-${professional.id}`} className="shadow-none">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={professional.isPublished ? 'default' : 'secondary'}>{professional.isPublished ? 'Published' : 'Draft'}</Badge>
                        <span className="text-xs text-muted-foreground">Priority {professional.displayOrder}</span>
                      </div>
                      <CardTitle className="mt-3 font-serif text-2xl leading-tight">{professional.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {professional.profession}
                        {professional.credentials ? ` · ${professional.credentials}` : ''}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={professional.isPublished}
                      onCheckedChange={checked => togglePublished(professional, checked)}
                      disabled={toggleProfessional.isPending}
                      aria-label={`${professional.isPublished ? 'Unpublish' : 'Publish'} ${professional.name}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{professional.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.specialties.slice(0, 4).map(specialty => (
                      <Badge key={specialty} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                    {professional.specialties.length > 4 && <Badge variant="outline">+{professional.specialties.length - 4}</Badge>}
                  </div>
                  {!hasProfessionalContact(professional) && (
                    <Alert>
                      <AlertTitle>Contact details needed</AlertTitle>
                      <AlertDescription>Add a phone number, email, or website before publishing.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{professional.location || (professional.offersRemote ? 'Remote' : 'Location not set')}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(professional)}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${professional.name}`}>
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently delete {professional.name}?</AlertDialogTitle>
                          <AlertDialogDescription>Unpublishing is safer if this profile may be needed later. Deleting cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep profile</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(professional)}>Delete permanently</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={formOpen}
        onOpenChange={open => {
          if (!open) setFormOpen(false);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add a professional'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the profile and control whether visitors can see it.' : 'Start with a private draft or publish once the contact details are ready.'}
            </DialogDescription>
          </DialogHeader>
          <ProfessionalForm
            key={editing?.id ?? `new-${nextOrder}`}
            initial={editing ? formFromProfessional(editing) : { ...emptyForm, displayOrder: nextOrder }}
            mutationError={editing ? updateProfessional.error : createProfessional.error}
            submitting={editing ? updateProfessional.isPending : createProfessional.isPending}
            onCancel={() => setFormOpen(false)}
            onSubmit={save}
          />
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
