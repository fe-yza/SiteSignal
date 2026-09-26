import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Leave time for a sleeping backend to start before the host ends this request.
export const maxDuration = 180;
