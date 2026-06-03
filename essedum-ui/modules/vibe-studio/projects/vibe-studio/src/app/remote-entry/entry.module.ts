import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatError, MatHint, MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTreeModule } from '@angular/material/tree';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';

// CDK
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule as CdkDragDropModule } from '@angular/cdk/drag-drop';

// Third-party (NOTE: ngx-quill, ang-jsoneditor are MFE-private — bundled here, not shared)
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { JsonFormsModule } from '@jsonforms/angular';
import { JsonFormsAngularMaterialModule } from '@jsonforms/angular-material';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MarkdownModule } from 'ngx-markdown';
import { QuillModule } from 'ngx-quill';
import { NgBusyModule } from 'ng-busy';
import { FileUploadModule } from 'ng2-file-upload';

// Routing
import { EntryRoutingModule } from './entry-routing.module';

// Features: vibe-studio (the only feature this MFE owns post-2026-06-03 refactor)
import { VibeStudioComponent } from '../features/vibe-studio/vibe-studio/vibe-studio.component';
import { VibeLeftPanelComponent } from '../features/vibe-studio/vibe-left-panel/vibe-left-panel.component';
import { VibeRightPanelComponent } from '../features/vibe-studio/vibe-right-panel/vibe-right-panel.component';
import { VibeStudioService } from '../features/vibe-studio/services/vibe-studio.service';

// 2026-06-03 refactor:
// - native-script, spec-template, scripts route → integration-hub
// - enl-code-editor → @essedum/shared-lib (declared by SharedLibUiModule)
// - pipeline, pipeline.description, swagger-custom stub folders → deleted
// - sharedModule (aip-filter, aip-swagger-custom, aip-method-create-edit) → deleted with
//   their consuming features. VibeStudio's panel doesn't use them.
// - features/services/* and features/dataset/* → deleted (vibe panels don't need them)

// Shared-lib: services, UI primitives, API config, auth interceptor
import {
  API_CONFIG,
  ApiConfig,
  AuthInterceptor,
  SharedLibUiModule,
  Services,
  AdapterServices,
  TagsService,
  DashConstantService,
  encKey,
  AipSnackbarCustomService,
} from '@essedum/shared-lib';

// Environment is only a fallback if the host hasn't provided API_CONFIG.
import { environment } from '../../environments/environment';

@NgModule({
  declarations: [
    VibeStudioComponent,
    VibeLeftPanelComponent,
    VibeRightPanelComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    EntryRoutingModule,
    MatCardModule,
    MatToolbarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatError,
    MatHint,
    MatDialogModule,
    MatRadioModule,
    MatExpansionModule,
    MatTreeModule,
    MatSidenavModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggle,
    MatSliderModule,
    MatSnackBarModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    ScrollingModule,
    CdkDragDropModule,
    NgbModule,
    JsonFormsModule,
    JsonFormsAngularMaterialModule,
    NgJsonEditorModule,
    FileUploadModule,
    NgxPaginationModule,
    NgxMatSelectSearchModule,
    MarkdownModule.forRoot(),
    QuillModule,
    NgBusyModule,
    SharedLibUiModule,
  ],
  providers: [
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.baseUrl ?? '/api/aip',
        datasetsUrl: environment.datasetsUrl ?? '/api/aip',
        sandboxUrl: '/api/exp',
      } as ApiConfig,
    },
    { provide: 'envi',     useFactory: (cfg: ApiConfig) => cfg.baseUrl,     deps: [API_CONFIG] },
    { provide: 'dataSets', useFactory: (cfg: ApiConfig) => cfg.datasetsUrl, deps: [API_CONFIG] },
    { provide: 'sbx',      useFactory: (cfg: ApiConfig) => cfg.sandboxUrl,  deps: [API_CONFIG] },
    Services,
    AdapterServices,
    TagsService,
    DashConstantService,
    encKey,
    AipSnackbarCustomService,
    VibeStudioService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MatDialogRef, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: {} },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EntryModule {}
