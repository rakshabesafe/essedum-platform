import { api } from './api';

export interface HealthResponse {
  status: string;
}

export interface ReadyResponse {
  status: string;
  db: string;
  redis: string;
}

export const healthService = {
  check(): Promise<HealthResponse> {
    return api.get<HealthResponse>('/health');
  },

  ready(): Promise<ReadyResponse> {
    return api.get<ReadyResponse>('/health/ready');
  },
};
