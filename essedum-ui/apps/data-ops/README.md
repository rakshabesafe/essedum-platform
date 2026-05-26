# @essedum/data-ops

> Path: `apps/data-ops/` (renamed from `data-ops-mfe/` 2026-05-22 when MFE folders moved under `apps/`).

Module 2 of the Essedum MFE platform. Owns: **Datasets, Models, Connections (datasource), Schema**.

- Dev port: `8087`
- Mount path in host: `/data/**`
- Federation name: `data-ops` — exposes `./Module` (the `EntryModule`)

## Routes (mounted at `/data`)

| Path                                   | Component                       |
|----------------------------------------|---------------------------------|
| `/data` → redirect → `/data/datasets`  | —                               |
| `/data/datasets`                       | `DatasetByNameComponent`        |
| `/data/datasets/create`                | `ModalConfigDatasetComponent`   |
| `/data/datasets/data`                  | `DatasetEditComponent`          |
| `/data/datasets/:type`                 | `DatasetByNameComponent`        |
| `/data/datasets/view/:cname`           | `DatasetDescriptionComponent`   |
| `/data/models`                         | `ModelComponent`                |
| `/data/models/create`                  | `ModalConfigComponent`          |
| `/data/models/edit-model/:id`          | `ModalConfigComponent`          |
| `/data/models/preview/:id`             | `ModelDescriptionComponent`     |
| `/data/connections`                    | `DatasourceComponent`           |
| `/data/connections/create*`            | `DatasourceConfigComponent`     |
| `/data/connections/view/:name/:view`   | `ConnectionViewComponent`       |
| `/data/connections/edit/:name/:edit`   | `ConnectionViewComponent`       |
| `/data/connections/preview/:name`      | `ConnectionViewComponent`       |
| `/data/core-datasources/*`             | same shape as `/connections`    |
| `/data/schemas`                        | `SchemaComponent`               |
| `/data/schemas/create\|view\|edit`     | `ModalConfigSchemaComponent`    |
