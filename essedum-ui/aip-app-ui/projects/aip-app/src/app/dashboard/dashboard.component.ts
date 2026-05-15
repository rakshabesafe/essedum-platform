import { Component, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatasourceService } from '../datasource/datasource.service';
import { DatasetServices } from '../dataset/dataset-service';
import { Services } from '../services/service';
import { PipelineService } from '../services/pipeline.service';

interface ModuleStat {
  label: string;
  count: number;
  sub: string;
  icon: string;
  accent: string;
  route: string;
}

interface PipelineCard {
  alias: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  moduleStats: ModuleStat[] = [
    { label: 'Connections',     count: 0, sub: 'Loading...', icon: 'fa-plug',          accent: '#3b82f6', route: 'connections' },
    { label: 'Datasets',        count: 0, sub: 'Loading...', icon: 'fa-database',      accent: '#10b981', route: 'datasets' },
    { label: 'Models',          count: 0, sub: 'Loading...', icon: 'fa-cubes',         accent: '#8b5cf6', route: 'models' },
    { label: 'Agent Pipelines', count: 0, sub: 'Loading...', icon: 'fa-code-fork',     accent: '#fb923c', route: 'agent-pipeline' },
    { label: 'MCP Pipelines',   count: 0, sub: 'Loading...', icon: 'fa-server',        accent: '#06b6d4', route: 'agent-pipeline' },
    { label: 'App Pipelines',   count: 0, sub: 'Loading...', icon: 'fa-window-restore',accent: '#fbbf24', route: 'agent-pipeline' },
  ];

  topAgentPipelines: PipelineCard[] = [];
  topMcpPipelines: PipelineCard[]   = [];
  topAppPipelines: PipelineCard[]   = [];

  constructor(
    private datasourceService: DatasourceService,
    private datasetService: DatasetServices,
    private services: Services,
    private pipelineService: PipelineService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    const modelParams = new HttpParams();
    const datasetParams = new HttpParams()
      .set('project', sessionStorage.getItem('organization') || '')
      .set('search', '');

    forkJoin({
      connections:      this.datasourceService.getDatasources().pipe(catchError(() => of([]))),
      datasets:         this.datasetService.getDatasetsLenBySearch('').pipe(catchError(() => of(0))),
      models:           this.services.getCountModels(modelParams).pipe(catchError(() => of(0))),
      agentCount:       this.pipelineService.getPipelinesCount('pipeline-agent').pipe(catchError(() => of(0))),
      mcpCount:         this.pipelineService.getPipelinesCount('mcp-pipeline', 'mcpServer').pipe(catchError(() => of(0))),
      appCount:         this.pipelineService.getPipelinesCount('app-pipeline', 'appPipeline').pipe(catchError(() => of(0))),
      agentPipelines:   this.pipelineService.getPipelinesByInterfaceType('pipeline-agent', null, 1, 3).pipe(catchError(() => of([]))),
      mcpPipelines:     this.pipelineService.getPipelinesByInterfaceType('mcp-pipeline', 'mcpServer', 1, 3).pipe(catchError(() => of([]))),
      appPipelines:     this.pipelineService.getPipelinesByInterfaceType('app-pipeline', 'appPipeline', 1, 3).pipe(catchError(() => of([]))),
    }).subscribe(results => {
      const connCount = Array.isArray(results.connections) ? results.connections.length : 0;
      this.moduleStats[0].count = connCount;
      this.moduleStats[0].sub   = `${connCount} total`;

      const dsetCount = Number(results.datasets) || 0;
      this.moduleStats[1].count = dsetCount;
      this.moduleStats[1].sub   = `${dsetCount} total`;

      const mdlCount = Number(results.models) || 0;
      this.moduleStats[2].count = mdlCount;
      this.moduleStats[2].sub   = `${mdlCount} total`;

      const agentCount = Number(results.agentCount) || 0;
      this.moduleStats[3].count = agentCount;
      this.moduleStats[3].sub   = `${agentCount} total`;

      const mcpCount = Number(results.mcpCount) || 0;
      this.moduleStats[4].count = mcpCount;
      this.moduleStats[4].sub   = `${mcpCount} total`;

      const appCount = Number(results.appCount) || 0;
      this.moduleStats[5].count = appCount;
      this.moduleStats[5].sub   = `${appCount} total`;

      this.topAgentPipelines = this.mapToPipelineCards(results.agentPipelines, 'fa-code-fork');
      this.topMcpPipelines   = this.mapToPipelineCards(results.mcpPipelines,   'fa-server');
      this.topAppPipelines   = this.mapToPipelineCards(results.appPipelines,   'fa-window-restore');
    });
  }

  private mapToPipelineCards(pipelines: any[], defaultIcon: string): PipelineCard[] {
    if (!Array.isArray(pipelines)) return [];
    return pipelines.slice(0, 3).map(p => {
      const status = this.mapStatus(p.status || p.jobStatus || p.state);
      return {
        alias:  p.alias || p.cname || 'Unknown',
        name:   p.name  || p.jobName || '',
        status: status,
        icon:   status === 'running' ? defaultIcon : status === 'failed' ? 'fa-exclamation-circle' : 'fa-check-circle',
        accent: status === 'running' ? '#22c55e'  : status === 'failed'  ? '#ef4444'              : '#94a3b8'
      };
    });
  }

  private mapStatus(raw: string): 'running' | 'completed' | 'failed' {
    if (!raw) return 'completed';
    const s = raw.toLowerCase();
    if (s === 'running' || s === 'active' || s === 'inprogress') return 'running';
    if (s === 'failed'  || s === 'error'  || s === 'failure')    return 'failed';
    return 'completed';
  }
}
