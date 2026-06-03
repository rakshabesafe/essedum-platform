import { api } from './api';
import type {
  FlowCreateRequest,
  FlowUpdateRequest,
  FlowResponse,
} from '../models/api';

const BASE = '/api/v1/flows';

export const flowService = {
  list(skip = 0, limit = 50): Promise<FlowResponse[]> {
    return api.get<FlowResponse[]>(BASE, { skip, limit });
  },

  get(flowId: string): Promise<FlowResponse> {
    return api.get<FlowResponse>(`${BASE}/${flowId}`);
  },

  create(data: FlowCreateRequest): Promise<FlowResponse> {
    return api.post<FlowResponse>(BASE, data);
  },

  update(flowId: string, data: FlowUpdateRequest): Promise<FlowResponse> {
    return api.put<FlowResponse>(`${BASE}/${flowId}`, data);
  },

  delete(flowId: string): Promise<void> {
    return api.delete(`${BASE}/${flowId}`);
  },
};
