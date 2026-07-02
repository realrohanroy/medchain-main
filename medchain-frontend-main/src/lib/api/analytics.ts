import apiClient from './client';

export interface DoctorAnalyticsResponse {
    total_patients: number;
    total_appointments: number;
    total_records: number;
    record_types: Record<string, number>;
}

export const analyticsApi = {
    getDoctorAnalytics: async (): Promise<DoctorAnalyticsResponse> => {
        const response = await apiClient.get<DoctorAnalyticsResponse>('/auth/analytics/');
        return response.data;
    }
};
