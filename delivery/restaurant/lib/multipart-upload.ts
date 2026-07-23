import { API_BASE_URL, refreshCsrfToken } from '@/lib/api';
import { getToken } from '@/lib/auth/storage';
import { getStoredSessionCookies } from '@/lib/session-cookies';

const SESSION_AUTH_TOKEN = 'session';

export type UploadFilePart = {
  uri: string;
  name: string;
  type: string;
};

type FormDataPartLike = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

let formDataPatched = false;

/**
 * RN 0.74+ may add a `filename*` header that multer cannot parse.
 * Patch the built-in getter once instead of subclassing FormData.
 */
function ensureFormDataMulterPatch() {
  if (formDataPatched || typeof FormData === 'undefined') return;

  const proto = FormData.prototype as FormData & {
    getParts?: () => FormDataPartLike[];
  };
  const original = proto.getParts;
  if (typeof original !== 'function') return;

  proto.getParts = function getPartsMulterSafe(this: FormData) {
    return original.call(this).map((part) => {
      if (!part?.headers) return part;
      const headers = { ...part.headers };
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() !== 'content-disposition') continue;
        headers[key] = headers[key].replace(/;\s*filename\*=[^;]*/gi, '');
      }
      return { ...part, headers };
    });
  };

  formDataPatched = true;
}

function safeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'upload.jpg';
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot) : '.jpg';
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${stem || 'upload'}${ext}`;
}

async function buildUploadHeaders(): Promise<Record<string, string>> {
  const csrf = await refreshCsrfToken(true);
  const authToken = await getToken();
  const sessionCookies = await getStoredSessionCookies();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-CSRF-Token': csrf,
  };

  if (authToken && authToken !== SESSION_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${authToken}`;
  } else if (sessionCookies) {
    headers.Cookie = sessionCookies;
  }

  return headers;
}

function parseUploadBody(body: string, status: number): never {
  let message = `Upload failed (${status})`;
  try {
    const json = JSON.parse(body) as { message?: string; error?: string };
    message = json.message || json.error || message;
  } catch {
    if (body.trim()) message = body.trim();
  }
  throw new Error(message);
}

function isUnexpectedFieldError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('unexpected field') || lower.includes('multer');
}

function uploadViaXhr(
  url: string,
  fieldName: string,
  file: UploadFilePart,
  headers: Record<string, string>
): Promise<Record<string, unknown>> {
  ensureFormDataMulterPatch();

  const formData = new FormData();
  formData.append(fieldName, {
    uri: file.uri,
    name: safeFilename(file.name),
    type: file.type || 'image/jpeg',
  } as unknown as Blob);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'content-type') continue;
      xhr.setRequestHeader(key, value);
    }

    xhr.onload = () => {
      const { status, responseText } = xhr;
      if (status < 200 || status >= 300) {
        try {
          parseUploadBody(responseText, status);
        } catch (error) {
          reject(error);
        }
        return;
      }

      try {
        const json = JSON.parse(responseText) as { data?: Record<string, unknown> };
        resolve((json.data ?? json) as Record<string, unknown>);
      } catch {
        resolve({});
      }
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(formData);
  });
}

export async function postMultipartFile(
  path: string,
  fieldName: string,
  file: UploadFilePart
): Promise<Record<string, unknown>> {
  const headers = await buildUploadHeaders();
  const url = `${API_BASE_URL}${path}`;
  return uploadViaXhr(url, fieldName, file, headers);
}

export async function postMultipartWithFieldFallback(
  path: string,
  file: UploadFilePart,
  fieldCandidates: string[]
): Promise<Record<string, unknown>> {
  let lastError: unknown;

  for (const fieldName of fieldCandidates) {
    try {
      return await postMultipartFile(path, fieldName, file);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : '';
      if (!isUnexpectedFieldError(message)) throw error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('Upload failed');
}
