export interface Cliente {
  id: number;
  nif: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null; // ISO date string YYYY-MM-DD
}

export interface ClienteForm {
  nif: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
}
