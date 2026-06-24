import apiClient from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    role: string;
    email: string;
    first_name?: string;
    last_name?: string;
    user_id?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role?: 'PATIENT' | 'DOCTOR';
    first_name?: string;
    last_name?: string;
}

export interface RegisterResponse {
    message: string;
    user_id: string;
}

export interface GoogleLoginRequest {
    credential: string;
    flow: 'login' | 'register';
    role?: 'PATIENT' | 'DOCTOR';
}

const storeAuthTokens = (data: LoginResponse) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_email', data.email);
        if (data.first_name) localStorage.setItem('user_first_name', data.first_name);
        if (data.last_name) localStorage.setItem('user_last_name', data.last_name);
        if (data.user_id) localStorage.setItem('user_id', String(data.user_id));
    }
};

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login/', data);
        storeAuthTokens(response.data);
        return response.data;
    },

    googleLogin: async (data: GoogleLoginRequest): Promise<any> => {
        const response = await apiClient.post<any>('/auth/google/', data);
        if (data.flow === 'login') {
            storeAuthTokens(response.data);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        const response = await apiClient.post<RegisterResponse>('/auth/register/', data);
        return response.data;
    },

    logout: async () => {
        // Clear the real httpOnly session cookie via the server-side route.
        // (JS cannot clear httpOnly cookies directly via document.cookie.)
        await fetch('/api/auth/logout', { method: 'POST' });

        // Clear all locally-stored auth data used by the Axios client.
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_first_name');
        localStorage.removeItem('user_last_name');
        localStorage.removeItem('user_id');
    },

    getRole: (): 'patient' | 'doctor' => {
        const role = localStorage.getItem('user_role') || 'PATIENT';
        return role === 'DOCTOR' ? 'doctor' : 'patient';
    },

    getProfile: async () => {
        const response = await apiClient.get('/auth/me/');
        return response.data;
    },

    getDoctors: async (): Promise<Array<{ id: string; email: string; name: string; specialty: string }>> => {
        const response = await apiClient.get('/auth/doctors/');
        return response.data;
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('access_token');
    },
};
