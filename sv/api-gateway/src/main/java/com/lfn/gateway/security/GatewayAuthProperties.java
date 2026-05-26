package com.lfn.gateway.security;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the Gateway JWT authentication filter.
 * Bound from the 'gateway.auth' prefix in application.yml.
 */
@Configuration
@ConfigurationProperties(prefix = "gateway.auth")
public class GatewayAuthProperties {

    /**
     * Whether JWT authentication is enabled at the gateway level.
     */
    private boolean enabled = true;

    /**
     * List of path patterns that do NOT require authentication.
     * Supports Ant-style patterns (e.g., /api/authenticate, /actuator/**).
     */
    private List<String> openPaths = new ArrayList<>();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public List<String> getOpenPaths() {
        return openPaths;
    }

    public void setOpenPaths(List<String> openPaths) {
        this.openPaths = openPaths;
    }
}

