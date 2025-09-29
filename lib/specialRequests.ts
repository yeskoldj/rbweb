export interface SpecialRequestEntry {
  label?: string;
  value: string;
}

export const formatSpecialRequests = (specialRequests?: string): SpecialRequestEntry[] => {
  if (!specialRequests) {
    return [];
  }

  const pieces = specialRequests
    .split(/[\n;]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  if (pieces.length === 0) {
    return [];
  }

  if (pieces.length === 1) {
    const [label, ...rest] = pieces[0].split(':');
    if (rest.length === 0) {
      return [{ value: pieces[0] }];
    }

    return [
      {
        label: label.trim(),
        value: rest.join(':').trim(),
      },
    ];
  }

  return pieces.map((piece) => {
    const [label, ...rest] = piece.split(':');
    if (rest.length === 0) {
      return { value: label.trim() };
    }

    return {
      label: label.trim(),
      value: rest.join(':').trim(),
    };
  });
};
