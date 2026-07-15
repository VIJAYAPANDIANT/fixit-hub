package com.fixit.hub.config;

import com.fixit.hub.domain.document.IssueDocument;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.mapper.IssueMapper;
import com.fixit.hub.repository.es.IssueDocumentRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ElasticsearchIndexInitializer implements ApplicationRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final IssueRepository issueRepository;
    private final IssueDocumentRepository issueDocumentRepository;
    private final IssueMapper issueMapper;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting Elasticsearch index initialization and seeding...");

        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(IssueDocument.class);
            if (!indexOps.exists()) {
                log.info("Elasticsearch index 'issues' does not exist. Creating index with custom settings & mappings...");
                indexOps.create();
                indexOps.putMapping();
                log.info("Elasticsearch index 'issues' successfully created.");
            } else {
                log.info("Elasticsearch index 'issues' already exists.");
            }

            // Sync database records to Elasticsearch to guarantee warmed state
            long dbCount = issueRepository.count();
            long esCount = issueDocumentRepository.count();

            log.info("Database issues count: {}, Elasticsearch issues count: {}", dbCount, esCount);

            if (dbCount > esCount || esCount == 0) {
                log.info("Syncing issues from database to Elasticsearch...");
                List<Issue> issues = issueRepository.findAll();
                List<IssueDocument> documents = issues.stream()
                        .map(issueMapper::toDocument)
                        .collect(Collectors.toList());

                issueDocumentRepository.saveAll(documents);
                log.info("Synchronized {} issues to Elasticsearch successfully.", documents.size());
            } else {
                log.info("Elasticsearch search index is already up to date.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize or warm Elasticsearch index on startup: {}", e.getMessage(), e);
        }
    }
}
