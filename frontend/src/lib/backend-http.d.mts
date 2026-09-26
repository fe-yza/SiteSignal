export function backendBaseUrl(env?: NodeJS.ProcessEnv): string;
export function backendRequest(path: string, options?: RequestInit): Promise<Response>;
