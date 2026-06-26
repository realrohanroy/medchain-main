import apiClient from './client';

export interface BriefUserDetails {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface CareRelationshipModel {
    id: string;
    patient: string;
    doctor: string;
    patient_details: BriefUserDetails;
    doctor_details: BriefUserDetails;
    status: string;
    initiated_by: string;
    relationship_type: string;
}

export interface AccessRequestModel {
    id: string;
    care_relationship: string;
    reason: string;
    status: string;
    requested_scope: string;
    created_at: string;
    doctor_details: BriefUserDetails;
    patient_details?: BriefUserDetails;
}

export interface AccessGrantModel {
    id: string;
    care_relationship: string;
    scope: string;
    created_at: string;
    granted_at?: string;
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
    createRequest: async (params: { care_relationship: string; requested_scope?: string; reason?: string; requested_records?: string[] }) => {
        const response = await apiClient.post('/share/access/requests/', params);
        return response.data;
    },
    getGrantedRecords: async (patientId: string): Promise<any[]> => {
        const response = await apiClient.get(`/share/access/grants/${patientId}/records/`);
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    revokeGrant: async (id: string) => {
        const response = await apiClient.patch(`/share/access/grants/${id}/set_scope/`, { scope: 'NONE' });
        return response;
    },
    connectWithDoctor: async (token: string): Promise<CareRelationshipModel> => {
        const response = await apiClient.post('/share/care/connect/', { token });
        return response.data;
    },
    getManifest: async (careRelationshipId: string): Promise<any[]> => {
        const response = await apiClient.get(`/share/care/${careRelationshipId}/manifest/`);
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    }
};
