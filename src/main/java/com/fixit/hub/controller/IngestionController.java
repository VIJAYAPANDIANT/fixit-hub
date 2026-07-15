package com.fixit.hub.controller;

import com.fixit.hub.dto.EventIngestionRequest;
import com.fixit.hub.service.IngestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/store")
@RequiredArgsConstructor
@Tag(name = "Ingestion SDK Webhook", description = "Public endpoints used by client applications to report failures")
public class IngestionController {

    private final IngestionService ingestionService;

    @PostMapping
    @Operation(summary = "Ingest application exception log", description = "Accepts raw payload containing stacktrace, breadcrumbs, and tags. Authenticates via DSN keys.")
    public ResponseEntity<Map<String, String>> ingestEvent(
            @RequestParam(required = false) String dsn,
            @RequestHeader(value = "X-FixIt-DSN", required = false) String headerDsn,
            @Valid @RequestBody EventIngestionRequest request
    ) {
        String activeDsn = dsn != null && !dsn.isBlank() ? dsn : headerDsn;
        
        if (activeDsn == null || activeDsn.isBlank()) {
            log.warn("Ingestion request rejected: Missing DSN credentials.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing DSN credentials parameter or header."));
        }

        ingestionService.ingestEvent(activeDsn, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "accepted", "message", "Event enqueued for processing."));
    }
}
