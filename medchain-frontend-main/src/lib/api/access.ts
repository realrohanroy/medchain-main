import apiClient from './client';

export interface BriefUserDetails {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface AccessRequestModel {
    id: string;
    doctor: string;
    patient: string;
    reason: string;
    status: string;
    created_at: string;
    doctor_details: BriefUserDetails;
    patient_details?: BriefUserDetails;
}

export interface AccessGrantModel {
    id: string;
    patient: string;
    doctor: string;
    created_at: string;
    doctor_details: BriefUserDetails;
    patient_details?: BriefUserDetails;
}

export const accessApi = {
    getRequests: async (): Promise<AccessRequestModel[]> => {
        const response = await apiClient.get<any>('/share/access/requests/');
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    approveRequest: async (id: string) => {
        const response = await apiClient.post(`/share/access/requests/${id}/approve/`);
        return response.data;
    },
    declineRequest: async (id: string) => {
        const response = await apiClient.post(`/share/access/requests/${id}/decline/`);
        return response.data;
    },
    getGrants: async (): Promise<AccessGrantModel[]> => {
        const response = await apiClient.get<any>('/share/access/grants/');
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    createRequest: async (params: { patient_email: string; reason?: string }) => {
        const response = await apiClient.post('/share/access/requests/', params);
        return response.data;
    },
    getGrantedRecords: async (patientId: string): Promise<any[]> => {
        const response = await apiClient.get(`/share/access/grants/${patientId}/records/`);
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    revokeGrant: async (id: string) => {
        const response = await apiClient.delete(`/share/access/grants/${id}/`);
        return response;
    }
};
