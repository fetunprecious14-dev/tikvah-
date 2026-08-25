export function parseCommaSeparated(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function hasProfessionalContact(professional: { phone?: string | null; email?: string | null; website?: string | null }) {
  return Boolean(professional.phone?.trim() || professional.email?.trim() || professional.website?.trim());
}

export function professionalInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'TH'
  );
}
