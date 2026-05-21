import { api } from './api';
import type { KnowledgeBaseResponse } from '../models/api';

const BASE = '/api/v1/knowledge-bases';

export const knowledgeBaseService = {
  list(skip = 0, limit = 50): Promise<KnowledgeBaseResponse[]> {
    return api.get<KnowledgeBaseResponse[]>(BASE, { skip, limit });
  },
};
