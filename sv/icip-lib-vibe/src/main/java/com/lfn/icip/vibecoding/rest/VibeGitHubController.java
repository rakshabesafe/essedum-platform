package com.lfn.icip.vibecoding.rest;

import com.lfn.icip.vibecoding.config.VibeGitHubProperties;
import com.lfn.icip.vibecoding.model.VibeGitHubConfig;
import com.lfn.icip.vibecoding.service.VibeGitHubService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST controller for pushing vibe-coding session generated code to GitHub.
 * <p>
 * Supports both legacy (database) and GitHub storage modes.
 * When {@code vibe.github.enabled=true}, the push-to-github endpoint is active.
 */
@RestController
@RequestMapping("/${icip.pathPrefix}/service/v1/vibe-coding")
public class VibeGitHubController {

    private static final Logger logger = LoggerFactory.getLogger(VibeGitHubController.class);

    private final VibeGitHubService vibeGitHubService;
    private final VibeGitHubProperties vibeGitHubProperties;

    public VibeGitHubController(VibeGitHubService vibeGitHubService,
                                VibeGitHubProperties vibeGitHubProperties) {
        this.vibeGitHubService = vibeGitHubService;
        this.vibeGitHubProperties = vibeGitHubProperties;
    }

    /**
     * Push generated code of a session to GitHub.
     * Creates a new branch per session in the configured (or request-specified) repo.
     * <p>
     * Request body (optional fields):
     * <pre>
     * {
     *   "repoUrl": "https://github.com/org/repo.git",  // optional override
     *   "org": "myOrg"                                   // required
     * }
     * </pre>
     */
    @PostMapping(value = "/sessions/{sessionId}/push-to-github",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> pushToGitHub(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> request) {

        if (!vibeGitHubProperties.isEnabled()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "GitHub integration is disabled. Set vibe.github.enabled=true to enable."));
        }

        String org = (String) request.get("org");
        if (org == null || org.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Field 'org' is required."));
        }

        String repoUrl = (String) request.get("repoUrl");
        String user = getCurrentUser();

        logger.info("Push to GitHub request: session={}, org={}, user={}", sessionId, org, user);

        vibeGitHubService.pushSessionToGitHub(sessionId, org, user, repoUrl);

        return ResponseEntity.accepted()
                .body(Map.of(
                        "message", "Push to GitHub initiated",
                        "sessionId", sessionId,
                        "branchName", vibeGitHubProperties.getBranchPrefix() + sessionId,
                        "status", "IN_PROGRESS"
                ));
    }

    /**
     * Get the GitHub push status for a session.
     */
    @GetMapping(value = "/sessions/{sessionId}/github-status",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getGitHubStatus(
            @PathVariable String sessionId,
            @RequestParam String org) {

        Optional<VibeGitHubConfig> config = vibeGitHubService.getStatus(sessionId, org);
        if (config.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config.get());
    }

    /**
     * List all GitHub push records for an organisation.
     */
    @GetMapping(value = "/github-configs",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<VibeGitHubConfig>> listGitHubConfigs(
            @RequestParam String org) {
        return ResponseEntity.ok(vibeGitHubService.listByOrg(org));
    }

    private String getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "system";
        } catch (Exception e) {
            return "system";
        }
    }
}

