import apiClient from './client';

export interface Appointment {
    id: string;
    doctor_name: string;
    specialty: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    status: string;
    patient_id?: string;
    patient_email?: string;
    patient_first_name?: string;
    patient_last_name?: string;
    doctor_id?: string;
    created_at?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const appointmentsApi = {
    getAppointments: async (page = 1, status?: string): Promise<PaginatedResponse<Appointment>> => {
        const params: any = { page };
        if (status) params.status = status;

        const response = await apiClient.get<any>('/appointments/', { params });
        const data = response.data;
        if (Array.isArray(data)) {
            return { count: data.length, next: null, previous: null, results: data };
        }
        return data;
    },

    // Fetch all appointments for doctor schedule (no status filter, all pages)
    getDoctorSchedule: async (): Promise<Appointment[]> => {
        const response = await apiClient.get<any>('/appointments/', { params: { page_size: 100 } });
        const data = response.data;
        if (Array.isArray(data)) return data;
        return data.results || [];
    },

    bookAppointment: async (data: Omit<Appointment, 'id' | 'status' | 'created_at' | 'patient_id' | 'patient_email' | 'patient_first_name' | 'patient_last_name' | 'doctor_id'>): Promise<Appointment> => {
        const response = await apiClient.post('/appointments/', data);
        return response.data;
    },

    confirmAppointment: async (id: string): Promise<Appointment> => {
        const response = await apiClient.post(`/appointments/${id}/confirm/`);
        return response.data;
    },

    cancelAppointment: async (id: string): Promise<Appointment> => {
        const response = await apiClient.post(`/appointments/${id}/cancel/`);
        return response.data;
    }
};
