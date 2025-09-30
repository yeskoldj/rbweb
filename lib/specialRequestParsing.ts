export interface ParsedSpecialRequestSections {
  summary: string | null;
  userRequests: string;
  referenceCode: string | null;
  statusMessage: string | null;
}

const metadataMatchers = [/^referencia interna/i, /^estado:/i];

const sanitizeLines = (value: string): string[] =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !metadataMatchers.some(pattern => pattern.test(line)));

export const parseSpecialRequestSections = (
  raw: string | null | undefined
): ParsedSpecialRequestSections => {
  if (!raw || typeof raw !== 'string') {
    return {
      summary: null,
      userRequests: '',
      referenceCode: null,
      statusMessage: null,
    };
  }

  const sections = raw
    .split('\n\n')
    .map(section => section.trim())
    .filter(Boolean)
    .filter(section => section !== '---');

  let referenceCode: string | null = null;
  let statusMessage: string | null = null;
  const summaryParts: string[] = [];

  sections.forEach(section => {
    const normalized = section.toLowerCase();

    if (normalized.startsWith('referencia interna')) {
      const code = section.split(':').slice(1).join(':').trim();
      referenceCode = code || null;
      return;
    }

    if (normalized.startsWith('estado:')) {
      const message = section.split(':').slice(1).join(':').trim();
      statusMessage = message || null;
      return;
    }

    summaryParts.push(section);
  });

  const summary = summaryParts.length > 0
    ? summaryParts
        .map(part => sanitizeLines(part).join('\n'))
        .filter(Boolean)
        .join('\n\n') || null
    : null;

  let userRequests = '';

  if (summary) {
    const match = summary.match(/Solicitudes especiales:\s*([\s\S]*)/i);
    if (match) {
      userRequests = (match[1] || '').trim();
    }
  }

  const sanitizedUserRequests = sanitizeLines(userRequests).join('\n');

  return {
    summary,
    userRequests: sanitizedUserRequests,
    referenceCode,
    statusMessage,
  };
};

export const extractSpecialRequestNotes = (raw: string | null | undefined): string[] => {
  const { userRequests } = parseSpecialRequestSections(raw);

  if (!userRequests) {
    return [];
  }

  const seen = new Set<string>();

  return userRequests
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};
