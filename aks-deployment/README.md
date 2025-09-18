# AKS Deployment

This directory contains the Kubernetes manifests for deploying the Essedum platform to Azure Kubernetes Service (AKS).

## Overview

The manifests in this directory are designed to deploy all the components of the Essedum platform, including the backend, frontend, Nginx, and the Python Job Executor. There are two ways to deploy the platform: using plain Kubernetes manifests or using Helm charts.

### Plain Manifests

The plain Kubernetes manifests are located in the root of this directory. They provide a straightforward way to deploy the platform, but they are less flexible than Helm charts.

### Helm Charts

The Helm charts are located in the `helm-deployment/` directory. Helm is a package manager for Kubernetes that allows you to define, install, and upgrade complex Kubernetes applications. The Helm charts in this directory provide a more flexible and customizable way to deploy the Essedum platform.

## Usage

To deploy the platform using the plain manifests, you can use the `kubectl apply` command:

```bash
kubectl apply -f aks-deployment/
```

To deploy the platform using the Helm charts, you can use the `helm install` command:

```bash
helm install essedum aks-deployment/helm-deployment/
```

For more detailed instructions on how to deploy the platform to AKS, please refer to the main `README.md` file in the root of the repository.
