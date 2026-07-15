package com.fixit.hub.service;

import com.fixit.hub.dto.EventIngestionRequest;

public interface IngestionService {
    void ingestEvent(String dsnKey, EventIngestionRequest request);
}
