import * as http from '../../shared/api/httpClient';
import type { Cliente, ClienteForm } from './types';

export const clientesApi = {
  getAll: (): Promise<Cliente[]> => http.get<Cliente[]>('/clientes'),
  create: (data: ClienteForm): Promise<Cliente> => http.post<Cliente>('/clientes', data),
  update: (id: number, data: ClienteForm): Promise<Cliente> =>
    http.put<Cliente>(`/clientes/${id}`, data),
  delete: (id: number): Promise<void> => http.del(`/clientes/${id}`),
};
