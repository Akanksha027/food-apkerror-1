/** Avoid importing the auth store from `lib/api` (breaks require cycle). */
type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export async function notifyUnauthorized(): Promise<void> {
  await unauthorizedHandler?.();
}
