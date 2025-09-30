const PRINT_WINDOW_FEATURES = 'noopener,noreferrer,width=800,height=600';

const escapePhotoUrl = (photoUrl: string) => photoUrl.replace(/"/g, '&quot;');

export const openPhotoPrintWindow = (photoUrl: string): boolean => {
  if (typeof window === 'undefined') {
    console.warn('Photo printing is only available in the browser environment.');
    return false;
  }

  const normalizedUrl = photoUrl?.trim();
  if (!normalizedUrl) {
    console.error('Cannot print photo: empty URL provided.');
    return false;
  }

  const printWindow = window.open('', '_blank', PRINT_WINDOW_FEATURES);

  if (!printWindow) {
    console.error('Unable to open print window for photo');
    return false;
  }

  const escapedUrl = escapePhotoUrl(normalizedUrl);
  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir foto de referencia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; background: #ffffff; }
          img { max-width: 100%; max-height: 100vh; }
        </style>
      </head>
      <body>
        <img id="order-photo" src="${escapedUrl}" alt="Foto de referencia" />
        <script>
          const image = document.getElementById('order-photo');
          if (image) {
            image.onload = () => {
              window.focus();
              window.print();
            };
            image.onerror = () => {
              window.close();
            };
          } else {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  return true;
};
