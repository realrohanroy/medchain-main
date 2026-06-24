import apiClient from './client';

export interface RecordItem {
    id: string;
    record_type: string;
    doctor_name: string;
    record_date: string;
    file_url: string | null;
    blockchain_status: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const recordsApi = {
    getTimeline: async (page = 1): Promise<PaginatedResponse<RecordItem>> => {
        const response = await apiClient.get<PaginatedResponse<RecordItem>>('/records/', {
            params: { page },
        });
        return response.data;
    },

    upload: async (file: File, recordType: string, doctorName: string, recordDate?: string): Promise<RecordItem> => {
        const formData = new FormData();
        formData.append('file_url', file);
        formData.append('record_type', recordType);
        formData.append('doctor_name', doctorName);
        if (recordDate) formData.append('record_date', recordDate);

        const response = await apiClient.post('/records/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getPatientRecordsByDoctor: async (patientId: string, page = 1): Promise<PaginatedResponse<RecordItem>> => {
        const response = await apiClient.get<PaginatedResponse<RecordItem>>(`/records/patient/${patientId}/`, {
            params: { page },
        });
        return response.data;
    },
};
