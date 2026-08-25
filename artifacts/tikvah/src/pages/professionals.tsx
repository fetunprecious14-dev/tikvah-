import { useMemo, useState } from 'react';
import { ExternalLink, Globe2, HeartHandshake, Mail, MapPin, Phone, Search, UserRoundSearch, Video } from 'lucide-react';
import { Link } from 'wouter';
import { useListProfessionals } from '@workspace/api-client-react';
import { Shell } from '@/components/shell';
import { professionalInitials } from '@/lib/professionals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function Professionals() {
  const [search, setSearch] = useState('');
  const { data: professionals = [], isLoading, isError, refetch, isFetching } = useListProfessionals();
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return professionals;
    return professionals.filter(professional =>
      [professional.name, professional.profession, professional.bio, professional.location, ...professional.specialties]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(term)),
    );
  }, [professionals, search]);

  return (
    <Shell>
      <section className="mx-auto max-w-[1220px] px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <h1 className="max-w-4xl font-serif text-[clamp(44px,7vw,78px)] leading-[.98] tracking-[-.04em] text-balance">Find professional support that fits.</h1>
        <p className="mt-7 max-w-2xl text-[17px] leading-7 text-muted-foreground">
          Browse people who can offer professional, non-emergency care. You can contact them directly and decide what feels right for you.
        </p>
      </section>

      <section className="mx-auto max-w-[1220px] px-5 pb-24 sm:px-8">
        <Alert className="max-w-3xl">
          <HeartHandshake />
          <AlertTitle>Professional care, not emergency response</AlertTitle>
          <AlertDescription>
            If you may be in immediate danger or cannot stay safe, use our <Link href="/crisis">crisis support page</Link> instead.
          </AlertDescription>
        </Alert>

        <div className="mt-8 flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">Search by a person’s name, professional role, specialty, or location.</p>
          <Field className="sm:max-w-sm">
            <FieldLabel htmlFor="public-professional-search" className="sr-only">
              Search professionals
            </FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="public-professional-search"
                type="search"
                className="pl-9"
                placeholder="Search professional help"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
          </Field>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2" aria-label="Loading professionals">
            {[0, 1, 2, 3].map(item => (
              <Skeleton key={item} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Empty className="mt-10 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundSearch />
              </EmptyMedia>
              <EmptyTitle>We could not load professional help</EmptyTitle>
              <EmptyDescription>Please try again. If you need urgent support, the crisis page is still available.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                {isFetching ? 'Trying again…' : 'Try again'}
              </Button>
            </EmptyContent>
          </Empty>
        ) : filtered.length === 0 ? (
          <Empty className="mt-10 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundSearch />
              </EmptyMedia>
              <EmptyTitle>{search ? 'No professionals match that search' : 'The directory is being prepared'}</EmptyTitle>
              <EmptyDescription>
                {search ? 'Try a broader name, specialty, or location.' : 'Please check back soon. You can still browse resources or contact the Tikvah team.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/resources">Browse resources</Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {filtered.map(professional => (
              <Card key={professional.id} data-testid={`professional-${professional.id}`} className="flex flex-col shadow-none">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="size-16 border border-border">
                      {professional.imageUrl && <AvatarImage src={professional.imageUrl} alt={`Portrait of ${professional.name}`} />}
                      <AvatarFallback className="font-serif text-xl">{professionalInitials(professional.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="font-serif text-3xl leading-tight">{professional.name}</CardTitle>
                      <CardDescription className="mt-1 text-sm leading-6">
                        {professional.profession}
                        {professional.credentials ? ` · ${professional.credentials}` : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  <p className="text-[15px] leading-7 text-muted-foreground">{professional.bio}</p>

                  {professional.specialties.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">Areas of support</p>
                      <div className="flex flex-wrap gap-2">
                        {professional.specialties.map(specialty => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {professional.location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={15} aria-hidden="true" />
                        {professional.location}
                      </span>
                    )}
                    {professional.offersRemote && (
                      <span className="inline-flex items-center gap-2">
                        <Video size={15} aria-hidden="true" />
                        Remote
                      </span>
                    )}
                    {professional.offersInPerson && (
                      <span className="inline-flex items-center gap-2">
                        <HeartHandshake size={15} aria-hidden="true" />
                        In person
                      </span>
                    )}
                    {professional.languages.length > 0 && (
                      <span className="inline-flex items-center gap-2">
                        <Globe2 size={15} aria-hidden="true" />
                        {professional.languages.join(', ')}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap gap-2 border-t pt-5">
                  {professional.phone && (
                    <Button asChild>
                      <a href={`tel:${professional.phone}`}>
                        <Phone data-icon="inline-start" />
                        Call
                      </a>
                    </Button>
                  )}
                  {professional.email && (
                    <Button asChild variant="outline">
                      <a href={`mailto:${professional.email}`}>
                        <Mail data-icon="inline-start" />
                        Email
                      </a>
                    </Button>
                  )}
                  {professional.website && (
                    <Button asChild variant="outline">
                      <a href={professional.website} target="_blank" rel="noreferrer">
                        Website <ExternalLink data-icon="inline-end" />
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mx-auto mt-16 max-w-2xl border-t border-border pt-10 text-center">
          <h2 className="font-serif text-3xl">Not sure who to contact?</h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            You can start with the person whose experience feels closest to what you need. It is okay to ask about availability, fees, and whether they are the right fit before
            deciding.
          </p>
        </div>
      </section>
    </Shell>
  );
}
