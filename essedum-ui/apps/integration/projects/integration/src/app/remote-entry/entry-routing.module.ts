import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdapterComponent } from '../features/adapter/adapter.component';
import { AdapterCreateEditComponent } from '../features/adapter/adapter-create-edit/adapter-create-edit.component';
import { AdapterDescriptionComponent } from '../features/adapter/adapter-description/adapter-description.component';

import { PipelineComponent } from '../features/pipeline/pipeline.component';

import { AppListComponent } from '../features/apps/app-list/app-list.component';
import { ViewAppComponent } from '../features/apps/view-app/view-app.component';

import { InstanceComponent } from '../features/instance/instance.component';
import { InstanceCreateEditComponent } from '../features/instance/instance-create-edit/instance-create-edit.component';
import { InstanceDescriptionComponent } from '../features/instance/instance-description/instance-description.component';

import { JobsComponent } from '../features/jobs/jobs.component';

// Migrated from legacy aip-app-ui (2026-05-25): salus iframe wrapper.
// Dashboard moved to host (shell-app-ui/landing/dashboard) per MFE plan §1.
import { SalusComponent } from '../features/salus/salus.component';

// Routes mount under `/integration/**` per the host manifest (integration.routePath = 'integration').
const routes: Routes = [
  { path: '', redirectTo: 'pipelines', pathMatch: 'full' },

  { path: 'salus', component: SalusComponent },

  {
    path: 'implementations',
    children: [
      { path: '', component: AdapterComponent },
      { path: 'create', component: AdapterCreateEditComponent },
      { path: ':adapter', component: AdapterDescriptionComponent },
    ],
  },

  {
    path: 'pipelines',
    children: [
      { path: '', component: PipelineComponent },
    ],
  },

  {
    path: 'apps',
    children: [
      { path: '', component: AppListComponent },
      { path: ':name/:type', component: ViewAppComponent },
    ],
  },

  {
    path: 'instances',
    children: [
      { path: '', component: InstanceComponent },
      { path: 'create', component: InstanceCreateEditComponent },
      { path: ':instance', component: InstanceDescriptionComponent },
    ],
  },

  {
    path: 'jobs',
    children: [
      { path: '', component: JobsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntryRoutingModule {}
