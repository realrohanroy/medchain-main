import apiClient from './client';
import type { RecordItem } from './records';

export interface GenerateShareResponse {
    token: string;
    share_url: string;
    expires_at: string;
    record_id: string | null;
}

export const sharingApi = {
    generateToken: async (recordId?: string): Promise<GenerateShareResponse> => {
        const response = await apiClient.post<GenerateShareResponse>('/share/generate/', {
            ...(recordId ? { record_id: recordId } : {}),
        });
        return response.data;
    },

    accessSharedRecords: async (token: string): Promise<RecordItem[]> => {
        const response = await apiClient.get<RecordItem[]>(`/share/${token}/`);
        return response.data;
    },
};
