export interface ParsedSpecialRequest {
  summary: string | null;
  userRequests: string;
  referenceCode: string | null;
  statusMessage: string | null;
  pickupTime: string | null;
  pickupDate: string | null;
}

const METADATA_PATTERNS = [/^referencia interna/i, /^estado:/i];
const SPECIAL_REQUEST_HEADER = /solicitudes especiales:\s*([\s\S]*)/i;
const PICKUP_TIME_PATTERN = /hora preferida de recogida:\s*(.*)/i;
const PICKUP_DATE_PATTERN = /fecha preferida de recogida:\s*(.*)/i;

export function parseSpecialRequestSections(raw: string | null | undefined): ParsedSpecialRequest {
  if (!raw || typeof raw !== 'string') {
    return {
      summary: null,
      userRequests: '',
      referenceCode: null,
      statusMessage: null,
      pickupTime: null,
      pickupDate: null,
    };
  }

  const sections = raw
    .split('\n\n')
    .map((section) => section.trim())
    .filter(Boolean)
    .filter((section) => section !== '---');

  let referenceCode: string | null = null;
  let statusMessage: string | null = null;
  const summaryParts: string[] = [];
  let pickupTime: string | null = null;
  let pickupDate: string | null = null;

  sections.forEach((section) => {
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

    const timeMatch = section.match(PICKUP_TIME_PATTERN);
    if (timeMatch && timeMatch[1]) {
      pickupTime = timeMatch[1].trim() || null;
    }

    const dateMatch = section.match(PICKUP_DATE_PATTERN);
    if (dateMatch && dateMatch[1]) {
      pickupDate = dateMatch[1].trim() || null;
    }

    summaryParts.push(section);
  });

  const summary = summaryParts.length > 0
    ? summaryParts
        .map((part) =>
          part
            .split('\n')
            .filter((line) => !METADATA_PATTERNS.some((pattern) => pattern.test(line.trim())))
            .join('\n')
            .trim()
        )
        .filter(Boolean)
        .join('\n\n')
    : null;

  let userRequests = '';

  if (summary) {
    const specialRequestMatch = summary.match(SPECIAL_REQUEST_HEADER);
    if (specialRequestMatch) {
      userRequests = (specialRequestMatch[1] || '').trim();
    }
  }

  const sanitizedUserRequests = userRequests
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => !METADATA_PATTERNS.some((pattern) => pattern.test(line.trim())))
    .join('\n')
    .trim();

  return {
    summary,
    userRequests: sanitizedUserRequests,
    referenceCode,
    statusMessage,
    pickupTime,
    pickupDate,
  };
}
