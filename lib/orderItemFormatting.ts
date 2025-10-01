export interface ItemWithCustomization {
  details?: string | null;
  customization?: Record<string, unknown> | null;
  photoUrl?: string | null;
}

export interface FormattedItemDetail {
  label?: string;
  value: string;
  emphasis?: boolean;
}

const CUSTOMIZATION_LABELS: Record<string, { label: string; emphasis?: boolean; allowMultiline?: boolean }> = {
  shape: { label: 'Forma' },
  layers: { label: 'Capas' },
  flavors: { label: 'Masa' },
  colors: { label: 'Colores' },
  fillings: { label: 'Rellenos' },
  decorations: { label: 'Decoraciones' },
  inscription: { label: 'Mensaje', emphasis: true },
  specialRequests: { label: 'Notas', allowMultiline: true },
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const extractItemDetails = (item: ItemWithCustomization): FormattedItemDetail[] => {
  const details: FormattedItemDetail[] = [];
  const seen = new Set<string>();

  const pushUnique = (entry: FormattedItemDetail) => {
    const key = `${entry.label ?? ''}|${entry.value}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      details.push(entry);
    }
  };

  if (isNonEmptyString(item.details)) {
    item.details
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const separatorIndex = line.indexOf(':');

        if (separatorIndex > -1) {
          const rawLabel = line.slice(0, separatorIndex).trim();
          const rawValue = line.slice(separatorIndex + 1).trim();

          if (isNonEmptyString(rawLabel) && isNonEmptyString(rawValue)) {
            pushUnique({ label: rawLabel, value: rawValue });
            return;
          }
        }

        pushUnique({ value: line });
      });
  }

  const customization = item.customization ?? null;

  if (customization && typeof customization === 'object') {
    Object.entries(customization).forEach(([key, rawValue]) => {
      if (!rawValue) return;
      if (key === 'summary') return;
      if (key === 'photoUrl') {
        pushUnique({ value: 'Foto de referencia adjunta', emphasis: true });
        return;
      }

      if (!isNonEmptyString(rawValue)) {
        return;
      }

      const config = CUSTOMIZATION_LABELS[key] ?? {
        label: key.charAt(0).toUpperCase() + key.slice(1),
      };

      const normalizedValue = rawValue.trim();

      const lines = config.allowMultiline
        ? normalizedValue
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
        : [normalizedValue];

      lines.forEach(line =>
        pushUnique({
          label: config.label,
          value: line,
          emphasis: config.emphasis,
        })
      );
    });
  }

  return details;
};

export const getItemPhotoUrl = (item: ItemWithCustomization): string | null => {
  if (isNonEmptyString(item.photoUrl)) {
    return item.photoUrl.trim();
  }

  const customization = item.customization ?? null;
  if (customization && typeof customization === 'object') {
    const rawPhoto = (customization as Record<string, unknown>)['photoUrl'];
    if (isNonEmptyString(rawPhoto)) {
      return rawPhoto.trim();
    }
  }

  return null;
};
