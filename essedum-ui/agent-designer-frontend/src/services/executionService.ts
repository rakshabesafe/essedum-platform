import { api } from './api';
import type {
  ExecutionRunRequest,
  ExecutionRunResponse,
  ExecutionResponse,
} from '../models/api';

const BASE = '/api/v1/executions';

export const executionService = {
  run(flowId: string, data: ExecutionRunRequest): Promise<ExecutionRunResponse> {
    return api.post<ExecutionRunResponse>(`${BASE}/flows/${flowId}/run`, data);
  },

  list(flowId?: string, skip = 0, limit = 50): Promise<ExecutionResponse[]> {
    return api.get<ExecutionResponse[]>(BASE, {
      ...(flowId ? { flow_id: flowId } : {}),
      skip,
      limit,
    });
  },
};
