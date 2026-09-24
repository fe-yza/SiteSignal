import type { JWT } from 'next-auth/jwt';
export function readSessionToken(req: Request, secret: string | undefined): Promise<JWT | null>;
