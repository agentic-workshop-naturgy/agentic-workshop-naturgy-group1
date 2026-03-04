import { getStoredToken } from '../../features/auth/AuthContext';

const BASE_URL = '/api/gas';

function mapError(status: number, message?: string): string {
  if (status === 401) return 'Sesión expirada. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para esta acción';
  if (status === 400) return message ?? 'Solicitud inválida';
  if (status === 404) return 'Recurso no encontrado';
  if (status === 409) return message ?? 'Conflicto: el recurso ya existe';
  if (status === 500) return 'Error interno del servidor';
  return message ?? `Error HTTP ${status}`;
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options?.headers ?? {}) },
    ...options,
  });

  // Auto-redirect to login on 401
  if (res.status === 401) {
    localStorage.removeItem('gas_jwt_token');
    localStorage.removeItem('gas_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    let msg: string | undefined;
    try {
      const body = (await res.json()) as { message?: string };
      msg = body.message;
    } catch {
      // ignore parse error
    }
    throw new Error(mapError(res.status, msg));
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function del(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' });
}

export async function getBlob(path: string): Promise<Blob> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(mapError(res.status));
  return res.blob();
}
