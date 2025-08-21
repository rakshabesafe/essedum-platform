# ESSEDUM

## 1. Project Description

Essedum is a modular, microservices-based framework designed to simplify the development, training, and deployment of AI-powered applications. It enables seamless connectivity between systems via REST APIs, Azure OpenAI, and AWS Bedrock, and supports data ingestion from sources like PostgreSQL, MySQL, S3, and Azure Blob Storage. Users can build and execute training and inference pipelines using Python-based services, manage models across platforms like SageMaker, Azure ML, and GCP Vertex AI, and deploy them as endpoints.

## 2. Platform Components

The Essedum platform is composed of four main components that work together to provide a comprehensive AI development and deployment solution.

### 2.1. Backend (`sv/`)

The backend is a Java Spring Boot application that forms the core of the Essedum platform. It provides RESTful APIs for the frontend, manages business logic, and handles data persistence. It is a multi-module Maven project located in the `sv/` directory. For more details, see the [backend documentation](sv/README.md).

### 2.2. Frontend (`essedum-ui/`)

The frontend is an Angular-based single-page application that provides the user interface for the Essedum platform. It allows users to interact with the platform's features, such as creating pipelines, managing datasets, and deploying models. The frontend code is located in the `essedum-ui/` directory.

### 2.3. Nginx (`nginx/`)

Nginx is used as a reverse proxy to serve the frontend application and route API requests to the backend services. This decouples the frontend from the backend and simplifies deployment. The Nginx configuration is located in the `nginx/` directory. For more details, see the [Nginx documentation](nginx/README.md).

### 2.4. Python Job Executor (`py-job-executer/`)

The Python Job Executor is a separate service responsible for executing Python-based jobs, such as data processing and machine learning tasks. It listens for job requests from the backend and executes them in a controlled environment. The code for this component is in the `py-job-executer/` directory. For more details, see the [Python Job Executor documentation](py-job-executer/README.md).

## 3. Platform Design

The Essedum platform is designed with a modular and extensible architecture that allows for seamless integration of various AI/ML tools and services. The following components represent the core concepts of the platform's design.

### 3.1. Connections

Connections establish a communication link or interface between different software systems. This allows for the exchange of data, the ability to perform actions, and access to resources from various environments.

### 3.2. Datasets

Datasets allow you to ingest and manage training data from a variety of sources, including Storage Buckets, databases, and REST APIs.

### 3.3. Adapters

Adapters integrate and utilize various services and capabilities of endpoints without needing to provide host details. Adapters simplify the process of interacting with different services.

### 3.4. Pipelines

Pipelines allow you to create and manage both training and inferencing pipelines. These pipelines are essential for fine-tuning, training, deploying, and registering models as endpoints.

### 3.5. Remote Executor

The Remote Executor executes pipelines or programs on a remote server or virtual machine. This powerful tool allows for the efficient use of computational resources for demanding AI/ML tasks.

### 3.6. Models

Models provide access to and management of all your models from configured connections.

### 3.7. Endpoints

Endpoints allow you to view and manage all endpoints from your connected services. This includes REST APIs, model endpoints, and more, providing a centralized view of your deployed services.

## 4. Installation

There are two ways to install and run the Essedum platform: a manual developer setup or a containerized setup using Docker.

### 4.1. Developer Setup

This setup is ideal for developers who want to work on the source code and contribute to the platform.

#### Prerequisites

- **Backend**:
  - JDK 21 or higher
  - Maven 3.9.6 or higher
  - MySQL Server 8.3 or higher
- **Frontend**:
  - Node.js and npm
- **Python Job Executor**:
  - Python 3.12 or higher

#### Step-by-Step Guide

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd essedum-platform
   ```

2. **Backend Setup**:
   - Navigate to the `sv/` directory.
   - Configure your MySQL database credentials in `common-app/src/main/resources/application.yml`.
   - Build the backend services:
     ```bash
     cd sv
     mvn clean install -Dmaven.test.skip=true -Dlicense.skip=true
     ```
   - Run the main application from your IDE or using the generated JAR file.

3. **Frontend Setup**:
   - Navigate to the `essedum-ui/shell-app-ui` and `essedum-ui/aip-app-ui` directories and install the dependencies:
     ```bash
     npm install
     npm run build
     ```

4. **Nginx Setup**:
   - Configure the `nginx/nginx.conf` file to point to the `dist` folders of the frontend applications.
   - Start the Nginx server.

5. **Python Job Executor Setup**:
   - Navigate to the `py-job-executer/` directory.
   - Install the required Python packages:
     ```bash
     pip install -r requirements.txt
     ```
   - Start the executor service:
     ```bash
     python app.py
     ```

### 3.2. Containerized Setup

This section describes two ways to deploy the Essedum platform in a containerized environment: using Docker Compose for a simple, local setup, or using Kubernetes for a more robust, scalable deployment.

#### 3.2.1. Docker Compose Setup

This setup is recommended for users who want to quickly deploy and run the Essedum platform on a local machine.

##### Prerequisites

- Docker
- Docker Compose

##### Deployment Steps

1. **Navigate to the `docker` directory**:
   ```bash
   cd docker
   ```

2. **Build and run the services**:
   ```bash
   docker-compose up --build
   ```
   This command will build the Docker images for all the services and start them in the correct order.

3. **Accessing the application**:
   - Once all the services are running, you can access the frontend application in your browser at `http://localhost:8084`.
   - The backend API will be available at `http://localhost:8082`.
   - The Keycloak admin console will be available at `http://localhost:8180`.

4. **Stopping the application**:
   - To stop the services, press `Ctrl+C` in the terminal where `docker-compose` is running, or run the following command from the `docker` directory:
   ```bash
   docker-compose down
   ```

#### 3.2.2. Kubernetes Setup

This setup is ideal for deploying the Essedum platform to a production-like environment.

##### Prerequisites

- Docker
- Kubernetes (e.g., Docker Desktop, Minikube, or a cloud-based provider like AKS)

##### Deployment Steps

1. **Build Docker Images**:
   - For each component (backend, frontend, py-job-executor), build the Docker image using the provided `Dockerfile`.
   - **Backend**:
     ```bash
     docker build -t essedum_app_backend:latest ./sv
     ```
   - **Frontend**:
     ```bash
     docker build -t essedum_app_ui:latest ./essedum-ui
     ```
   - **Python Job Executor**:
     ```bash
     docker build -t essedum_py_job_executor:latest ./py-job-executer
     ```

2. **Push Images to a Registry**:
   - Tag and push the images to a container registry (e.g., Docker Hub, Azure Container Registry).
     ```bash
     docker tag essedum_app_backend:latest <your-registry>/essedum_app_backend:latest
     docker push <your-registry>/essedum_app_backend:latest
     ```

3. **Deploy to Kubernetes**:
   - The `aks-deployment/` directory contains sample Kubernetes manifests for deploying the Essedum platform.
   - Update the manifests to use your container registry and image tags.
   - Apply the manifests to your Kubernetes cluster:
     ```bash
     kubectl apply -f aks-deployment/
     ```

## 5. Usage

Once the platform is up and running, you can access the frontend in your browser. The application allows you to:

- **Manage Connections**: Configure connections to data sources and execution environments.
- **Handle Datasets**: Create, upload, and manage datasets for your ML pipelines.
- **Build Pipelines**: Design and execute ML pipelines for training, inference, and deployment.
- **Interact with Apps**: Use Streamlit and Gradio applications to interact with your deployed models.

## 6. Change Log

- **v1.0.0**: Initial version of the Essedum platform.

## 7. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
