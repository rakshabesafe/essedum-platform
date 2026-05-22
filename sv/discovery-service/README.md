# Discovery Service (Eureka Server)

## Overview

The Discovery Service is the **service registry** for the ESSEDUM microservices platform. It uses **Netflix Eureka Server** to enable service discovery, allowing microservices to find and communicate with each other without hardcoded URLs.

## Technical Details

| Property          | Value                  |
|-------------------|------------------------|
| **Port**          | `8761`                 |
| **Service Name**  | `discovery-service`    |
| **Framework**     | Spring Cloud Netflix Eureka Server |
| **Main Class**    | `com.lfn.discovery.DiscoveryServiceApplication` |

## Responsibilities

- **Service Registration** — All microservices register themselves on startup.
- **Service Discovery** — Services query Eureka to locate other services by name.
- **Health Monitoring** — Tracks heartbeat from registered services and evicts unhealthy instances.
- **Load Balancing** — Provides instance lists for client-side load balancing.

## Registered Services

| Service         | Port   | Service ID       |
|-----------------|--------|------------------|
| API Gateway     | `8080` | `api-gateway`    |
| USM Service     | `8081` | `usm-service`    |
| ICIP Service    | `8082` | `icip-service`   |
| Data Service    | `8083` | `data-service`   |
| Vibe Service    | `8084` | `vibe-service`   |

## Running

```bash
# From project root
mvn spring-boot:run -pl discovery-service

# Or with Maven wrapper
cd discovery-service
mvn spring-boot:run
```

## Eureka Dashboard

Once running, the Eureka dashboard is available at:

```
http://localhost:8761
```

## Configuration

Configuration is in `src/main/resources/application.yml`.

Key properties:
```yaml
server:
  port: 8761

eureka:
  client:
    register-with-eureka: false    # Eureka server does not register with itself
    fetch-registry: false          # Eureka server does not fetch registry from itself
```

