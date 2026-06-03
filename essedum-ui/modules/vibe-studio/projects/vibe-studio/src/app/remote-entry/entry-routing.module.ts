import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VibeStudioComponent } from '../features/vibe-studio/vibe-studio/vibe-studio.component';

// Routes mount under `/vibe/**` per the host manifest (vibe-studio.routePath = 'vibe').
// After the 2026-06-03 refactor, vibe-studio owns ONLY the /editor route. The
// previous /code-editor, /scripts, /spec-templates routes moved out:
//   - code-editor    -> EnlCodeEditorComponent lives in @essedum/shared-lib
//                        (consumed by any MFE that needs it; no standalone route)
//   - scripts        -> integration-hub /integration/scripts
//   - spec-templates -> integration-hub /integration/spec-templates
const routes: Routes = [
  { path: '', redirectTo: 'editor', pathMatch: 'full' },

  {
    path: 'editor',
    children: [
      { path: '', component: VibeStudioComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntryRoutingModule {}
