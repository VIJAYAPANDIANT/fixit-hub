package com.fixit.hub.repository.es;

import com.fixit.hub.domain.document.IssueDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueDocumentRepository extends ElasticsearchRepository<IssueDocument, String> {
    List<IssueDocument> findByProjectId(String projectId);
}
