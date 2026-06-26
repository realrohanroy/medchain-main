import apiClient from './client';

export interface RAGQueryRequest {
    query: string;
    patient_id?: string;
    top_k?: number;
    question_category?: string;
}

export interface SourceChunk {
    text: string;
    source_type: 'profile' | 'record' | 'appointment' | 'vital' | 'diagnosis' | 'prescription' | 'parsed_data' | 'access_grant' | 'access_request';
    source_id: string;
    patient_id: string;
    score: number;
}

export interface RAGQueryResponse {
    answer: string;
    sources: SourceChunk[];
    query: string;
    answer_mode: 'record_grounded' | 'general_medical';
    follow_up_questions: string[];
}

export interface QuestionInfo {
    id: number;
    question_text: string;
    requires_records: boolean;
    category: string;
}

export interface QuestionCategory {
    category_name: string;
    questions: QuestionInfo[];
}

export interface QuestionBankResponse {
    categories: QuestionCategory[];
}

export interface RAGHealthResponse {
    status: string;
    index_loaded: boolean;
    total_vectors: number;
    llm_provider: string;
    embedding_model: string;
}


const RAG_BASE_URL = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:8001/api/v1';

// Get the JWT token from wherever it's stored in the Django auth flow
function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('access_token') || 
                  sessionStorage.getItem('access_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ragApi = {
    query: async (params: RAGQueryRequest): Promise<RAGQueryResponse> => {
        const res = await fetch(`${RAG_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(params),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Query failed');
        }
        return res.json();
    },

    reindex: async (): Promise<{ status: string; total_chunks: number; message: string }> => {
        const res = await fetch(`${RAG_BASE_URL}/reindex`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Reindex failed');
        }
        return res.json();
    },

    health: async (): Promise<RAGHealthResponse> => {
        const res = await fetch(`${RAG_BASE_URL}/health`, {
            headers: { ...getAuthHeaders() },
        });
        return res.json();
    },

    fetchQuestionBank: async (): Promise<QuestionBankResponse> => {
        const res = await fetch(`${RAG_BASE_URL}/questions`, {
            headers: { ...getAuthHeaders() },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Failed to fetch question bank');
        }
        return res.json();
    },

    synthesize: async (params: { patient_id: string }): Promise<{ answer: string; sources: SourceChunk[] }> => {
        const res = await fetch(`${RAG_BASE_URL}/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(params),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Synthesize failed');
        }
        return res.json();
    },
};
