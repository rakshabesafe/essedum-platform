# ESSEDUM

## 1. Project Description

Essedum is a modular, microservices-based framework designed to simplify the development, training, and deployment of AI-powered applications. It enables seamless connectivity between systems via REST APIs, Azure OpenAI, and AWS Bedrock, and supports data ingestion from sources like PostgreSQL, MySQL, S3, and Azure Blob Storage. Users can build and execute training and inference pipelines using Python-based services, manage models across platforms like SageMaker, Azure ML, and GCP Vertex AI, and deploy them as endpoints. The architecture includes a Java Spring Boot backend, Angular frontend, and containerized pipeline executors managed by Kubernetes for scalability and high availability.

## 2. Installation 


###  Required Software’s and tools
#### Backend:
  •	JDK version 21 or higher
  •	Maven 3.9.6
  •	Mysql server V 8.3 or higher
  •	Mysql workbench V 8.3 pr higher
  •	Eclipse or STS IDE for Code editing
  •	keycloak 26.2.3 (OPTIONAL)

#### Front End:
  •	Noje Js 
  •	VS Code

#### Pyjob Executor:
  • Python 3.12

### 2.1. NGINX Ingress Controller:
   •	Goto path essedum-platform/aks-deployment. Deploy nginx ingress controller with file ingress-nginx-deploy.yaml.

### 2.2 . Backend Setup Steps
    #### 2.2.1 MySQL deployment
      •	Goto path essedum-platform/aks-deployment. create PV and PVC for mysql using file mysql_file_pv.yaml
      •	Deploy mysql using file mysql_deployment_v3.yaml. Default password is root user is password.
      •	create databases with name core_dbb, leap2_8000_quartz, telemetrydb, keycloak in mysql server.

    #### 2.2.2 Keycloak deployment
      •	Goto path essedum-platform/aks-deployment. will be using keycloak_deployment.yaml for deployment.
      •	we are using login.lfn.essedum.anuket.iol.unh.edu for keycloak domain in deployment file, update it accordingly before deployment. 
      •	we need to have ssl certificate for the domain. Use that ssl certificate to create kubernetes secret essedum-secret.
      •	Deploy keycloak server with file keycloak_deployment.yaml.
      •	map the domain with the keycloak service ip.
      •	Access the admin console browsing https://login.lfn.essedum.anuket.iol.unh.edu:8443. Default username and password is admin and admin.
      •	In admin console, go to manage realm and create realm with name 'ESSEDUM', make sure its enabled and create same.
      •	Select ESSEDUM realm and create client with name 'essedum' and clientid 'essedum-45' and client type 'OpenID Connect'.
      •	Select 'Standard flow' in Authentication flow, Set ROOT URL, Web origins to essedum-ui domain (eg: https://lfn.essedum.anuket.iol.unh.edu)  and add Valid redirect URLs to essedum-ui domain with wild card (eg: https://lfn.essedum.anuket.iol.unh.edu/*).

    #### 2.2.3 Backend deployment
      •	Go to path essedum-platform/sv.
      •	copy keycloak ssl cert file(crt file) at essedum/sv. currently we have wildcard.lfn.crt we created for domain login.lfn.essedum.anuket.iol.unh.edu.
      •	update reference of wildcard.lfn.crt with new keycloak cert file name in Dockerfile_oauth2 file. Later Use Dockerfile_oauth2 to create docker image with name essedum_app_backend:latest.
      •	Push this image in the local docker registry.
      •	Goto path essedum-platform/aks-deployment. Update the docker registry and image name in essedum-backend.yaml
      •	Deploy essedum-backend.yaml in kubernetes cluster.

    #### 2.2.3 qdrant db deployment
      •	Goto path essedum-platform/aks-deployment. create PV for qdrant using file qdrantfilepv.yaml
      •	Deploy qdrant db using qdrant_deployment.yaml.

### 2.3. Front End Setup Steps

    #### 2.3.1 Frontend deployment
      •	Go to path essedum-platform/essedum-ui.
      •	Use Dockerfile to build docker image with name essedum_app_frontend:latest. push this image in the local docker registry.
      •	Goto path essedum-platform/aks-deployment. Update the docker registry and image name in essedum-ui.yaml
      •	Deploy essedum-ui.yaml and essedum-ui-service.yaml in kubernetes cluster.

    #### 2.3.2 ingress deployment
      •	Goto path essedum-platform/aks-deployment. will be using ingress.yaml for deployment.
      •	create domain and ssl cert for application access. currently we have used lfn.essedum.anuket.iol.unh.edu. Update ingress.yaml with the new domain.
      •	since we used wild card cert which was common for both keycloak and application domain hence will be using previous created kubernetes secret essedum-secret in our ingress.yaml. if we have different ssl certs for keycloak and application domain, we will have to create new ssl cert with different name and have to update that in ingress.yaml.
      •	Deploy ingress using ingress.yaml.
      •	map domain with the ingress ip. 

### 2.4. Pyjob Executor:
    • Go to pyjob-executor folder and run below command
        pip install -r requirements.txt
    • Run python app.py
    • Pyjob Executor will be running in port 5000. 


### 2.5. Docker Build and Deployment :
#### 2.5.1 create local docker registry:
sudo docker run -d -p 5000:5000 --name registry registry:2
Enable Insecure Registry Configuration on Docker Daemon:
Edit or create the daemon.json file in the Docker configuration directory (e.g., /etc/docker/daemon.json on Linux)
Add the registry's address to the insecure-registries array.
    {
      "insecure-registries": ["your-registry-address:port"]
    }
Restart the Docker daemon for the changes to take effect. 

#### 2.5.2 create namespace:
we are using namespace aipns in our deployment yaml file. 
kubectl create namespace aipns

#### 2.5.3 Backend:
##### sudo docker build   --platform=linux/amd64   --tag essedum_app_backend:latest   --build-arg TARGETPLATFORM=linux/amd64   --no-cache   -f Dockerfile_oauth2 .
##### sudo docker tag essedum_app_backend:latest <registry-ip>:5000/essedum_app_backend:latest
##### sudo docker push <registry-ip>:5000/essedum_app_backend:latest
##### kubectl apply -f essedum-backend.yaml

#### 2.5.4 Frontend:
##### sudo docker build   --platform=linux/amd64   --tag essedum_app_frontend:latest   --build-arg TARGETPLATFORM=linux/amd64   --no-cache   -f Dockerfile .
##### sudo docker tag essedum_app_frontend:latest <registry-ip>:5000/essedum_app_backend:latest
##### sudo docker push <registry-ip>:5000/essedum_app_backend:latest
##### kubectl apply -f essedum-ui.yaml
##### kubectl apply -f essedum-ui-service.yaml

#### 2.5.5 mysql:
kubectl apply -f mysql_file_pv.yaml
kubectl apply -f mysql_deployment_v3.yaml

#### 2.5.6 qdrant:
kubectl apply -f qdrantfilepv.yaml
kubectl apply -f qdrant_deployment.yaml

#### 2.5.7 keycloak:
kubectl apply -f keycloak_deployment.yaml

#### 2.5.8 NGINX Ingress Controller:
kubectl apply -f ingress-nginx-deploy.yaml

#### 2.5.9 ingress:
kubectl apply -f ingress.yaml

## 3. Usage

  ### 3.1. Connection
  This module allows users to configure and manage connections to various resources essential for pipeline execution. These include:
  Pipeline Execution Environment: Choose where your ML pipeline will run (e.g., local, cloud, or containerized environments).
  Log Storage: Define where logs generated during pipeline execution will be stored for monitoring and debugging.
  Dataset Storage: Connect to data sources or storage systems where training and inference datasets are located.
  
  ### 3.2. Dataset
  The dataset module enables users to:
  Create and manage datasets used in ML pipelines.
  Upload, preprocess, and organize data for training and evaluation.
  Ensure datasets are versioned and accessible for reproducibility.
  
  ### 3.3. Pipeline
  This is the core of the application where users can:
  Create and configure ML pipelines for training models, performing inference, and deploying applications.
  Integrate Python scripts to define custom steps in the pipeline.
  Automate workflows including data loading, model training, evaluation, and deployment.
  
  ### 3.4. Apps
  This module hosts interactive applications built using:
  Streamlit and Gradio: These apps provide intuitive UIs for model interaction, visualization, and testing.
  Users can launch these apps directly from the platform to explore model predictions, adjust parameters, and share results.
 
  To use this application:
  Set up your connections to data sources and execution environments.
  Create or upload datasets for training.
  Build your ML pipeline using Python scripts or predefined templates.
  Deploy and interact with your models through Streamlit or Gradio apps.


## 4. Change Log:
  Initial Version

 
## 5. License Info:
The MIT License (MIT)
Copyright © 2025 Infosys Limited

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
