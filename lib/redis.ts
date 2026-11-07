import Redis from 'ioredis';

// Singleton: sin esto, el recargado en caliente de `next dev` abre una
// conexión nueva en cada cambio hasta que Redis deja de aceptar más.
const g = globalThis as unknown as { redis?: Redis };

export const redis =
  g.redis ?? new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380', { lazyConnect: false });

if (process.env.NODE_ENV !== 'production') g.redis = redis;
