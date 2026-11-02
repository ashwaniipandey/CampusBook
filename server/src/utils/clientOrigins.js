export const getAllowedClientOrigins = () =>
  (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        const parsedOrigin = new URL(origin);
        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
          throw new Error('Unsupported protocol');
        }
        return parsedOrigin.origin;
      } catch {
        throw new Error(`CLIENT_URL contains an invalid origin: ${origin}`);
      }
    });
