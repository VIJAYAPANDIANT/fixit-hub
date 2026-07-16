package com.fixit.hub.repository.es;

import com.fixit.hub.domain.document.EventLog;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventLogRepository extends ElasticsearchRepository<EventLog, String> {
    List<EventLog> findByIssueIdOrderByTimestampDesc(String issueId);
    List<EventLog> findByProjectIdOrderByTimestampDesc(String projectId);
}
