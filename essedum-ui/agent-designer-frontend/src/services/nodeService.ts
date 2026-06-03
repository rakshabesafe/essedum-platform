import { api } from './api';
import type { ApiNodeDefinition } from '../models/api';

const BASE = '/api/v1/nodes';

export const nodeService = {
  list(): Promise<ApiNodeDefinition[]> {
    return api.get<ApiNodeDefinition[]>(BASE);
  },
};
