# Docker Setup

This directory contains the Docker Compose setup for running the Essedum platform in a containerized environment.

## Overview

The `docker-compose.yml` file in this directory defines all the services required to run the Essedum platform, including the backend, frontend, Nginx, and the Python Job Executor. This setup is ideal for quickly deploying and running the platform on a local machine.

## Prerequisites

- Docker
- Docker Compose

## Usage

1. **Configure your environment**:
   - Create a copy of the `.env.sample` file and name it `.env`.
     ```bash
     cp .env.sample .env
     ```
   - Open the `.env` file and customize the variables as needed. You can change the external ports for the services, update credentials, etc.

2. **Build and run the services**:
   - Once you have configured your `.env` file, you can build and run the services using Docker Compose.
     ```bash
     docker-compose up --build
     ```
   This command will build the Docker images for all the services and start them in the correct order.

3. **Accessing the application**:
   - Once all the services are running, you can access the frontend application in your browser at `http://localhost:8084`.
   - The backend API will be available at `http://localhost:8082`.
   - The Keycloak admin console will be available at `http://localhost:8180`.

4. **Stopping the application**:
   - To stop the services, press `Ctrl+C` in the terminal where `docker-compose` is running, or run the following command from this directory:
   ```bash
   docker-compose down
   ```
