import { Component } from '@angular/core';

// API requirements (replace mock data with real calls):
// GET /api/models/summary          → { count, activeCount, recentlyAdded }
// GET /api/connections/summary     → { count, activeCount, errorCount }
// GET /api/datasets/summary        → { count, totalSizeMb }
// GET /api/agents/summary          → { count, activeCount }
// GET /api/agent-pipelines/summary → { count, runningCount }
// GET /api/pipelines/summary       → { count, runs24h, failureRate }
// GET /api/apps/summary            → { count, deployedCount }
// GET /api/mcp-servers/summary     → { count, onlineCount }
// GET /api/activity/recent         → ActivityItem[] (last 10 events)
// GET /api/models/top-traffic      → ModelTraffic[] (top 5 by request count)

interface StatCard {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean | null;
  trendColor: string;
  icon: string;
}

interface ModuleStat {
  label: string;
  count: number;
  sub: string;
  icon: string;
  accent: string;
  route: string;
}

interface PipelineCard {
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  runs: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  // Routes are absolute paths under /landing so each card navigates into the
  // owning MFE (data-ops, agent, integration). The dashboard lives in the
  // integration MFE but its cards reach across MFE boundaries.
  moduleStats: ModuleStat[] = [
    { label: 'Connections',    count: 12, sub: '10 active · 2 error',       icon: 'fa-plug',         accent: '#3b82f6', route: '/landing/data/connections' },
    { label: 'Datasets',       count: 28, sub: '45 GB total · 5 new',        icon: 'fa-database',     accent: '#10b981', route: '/landing/data/datasets' },
    { label: 'Models',         count: 34, sub: '12 deployed · 22 available', icon: 'fa-cubes',        accent: '#8b5cf6', route: '/landing/data/models' },
    { label: 'Agent Pipelines',count: 9,  sub: '5 running · 4 idle',         icon: 'fa-code-fork',    accent: '#fb923c', route: '/landing/agent/pipeline' },
    { label: 'MCP Pipelines',  count: 6,  sub: '4 active · 2 paused',        icon: 'fa-server',       accent: '#06b6d4', route: '/landing/integration/pipelines' },
    { label: 'App Pipelines',  count: 11, sub: '8 deployed · 3 staging',     icon: 'fa-window-restore',accent: '#fbbf24', route: '/landing/integration/apps' },
  ];

 

  // Top Agent Pipelines
  topAgentPipelines: PipelineCard[] = [
    { name: 'data-extraction-v3', status: 'running', runs: '2.4K', icon: 'fa-code-fork', accent: '#22c55e' },
    { name: 'inference-batch-daily', status: 'completed', runs: '1.8K', icon: 'fa-check-circle', accent: '#22c55e' },
    { name: 'sentiment-analysis', status: 'failed', runs: '890', icon: 'fa-exclamation-circle', accent: '#f59e0b' },
  ];

  // Top MCP Pipelines
  topMcpPipelines: PipelineCard[] = [
    { name: 'tools-integration', status: 'running', runs: '3.2K', icon: 'fa-code-fork', accent: '#22c55e' },
    { name: 'resource-sync', status: 'completed', runs: '1.2K', icon: 'fa-check-circle', accent: '#22c55e' },
    { name: 'cache-cleanup', status: 'pending', runs: '456', icon: 'fa-hourglass', accent: '#818cf8' },
  ];

  // Top App Pipelines
  topAppPipelines: PipelineCard[] = [
    { name: 'analytics-portal', status: 'running', runs: '5.1K', icon: 'fa-code-fork', accent: '#22c55e' },
    { name: 'dashboard-sync', status: 'completed', runs: '2.9K', icon: 'fa-check-circle', accent: '#22c55e' },
    { name: 'report-generator', status: 'running', runs: '678', icon: 'fa-code-fork', accent: '#22c55e' },
  ];
}
