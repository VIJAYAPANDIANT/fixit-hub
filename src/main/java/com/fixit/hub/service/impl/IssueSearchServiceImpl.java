package com.fixit.hub.service.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.*;
import com.fixit.hub.domain.document.IssueDocument;
import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.dto.IssueResponse;
import com.fixit.hub.dto.IssueSearchResponse;
import com.fixit.hub.mapper.IssueMapper;
import com.fixit.hub.service.IssueSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueSearchServiceImpl implements IssueSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final IssueMapper issueMapper;

    @Override
    public IssueSearchResponse searchIssues(
            UUID projectId,
            String query,
            IssueStatus status,
            IssueSeverity severity,
            IssueDifficulty difficulty,
            String language,
            String framework,
            String category,
            List<String> tags,
            String sortBy
    ) {
        log.info("Performing Elasticsearch search for project: {}, query: {}", projectId, query);

        try {
            BoolQuery.Builder boolQuery = new BoolQuery.Builder();

            // Filter by Project ID
            boolQuery.filter(f -> f.term(t -> t.field("projectId").value(projectId.toString())));

            // Additional filters (Run in filter context for maximum search performance and caching)
            if (status != null) {
                boolQuery.filter(f -> f.term(t -> t.field("status").value(status.name())));
            }
            if (severity != null) {
                boolQuery.filter(f -> f.term(t -> t.field("severity").value(severity.name())));
            }
            if (difficulty != null) {
                boolQuery.filter(f -> f.term(t -> t.field("difficulty").value(difficulty.name())));
            }
            if (language != null && !language.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("languageSlug").value(language.toLowerCase())));
            }
            if (framework != null && !framework.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("frameworkSlug").value(framework.toLowerCase())));
            }
            if (category != null && !category.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("categorySlug").value(category.toLowerCase())));
            }
            if (tags != null && !tags.isEmpty()) {
                for (String tag : tags) {
                    if (tag != null && !tag.isBlank()) {
                        boolQuery.filter(f -> f.term(t -> t.field("tags").value(tag.toLowerCase())));
                    }
                }
            }

            Query queryBuilder;

            if (query != null && !query.isBlank()) {
                // Keyword Search & Typo Correction: MultiMatchQuery with fuzziness
                Query multiMatch = Query.of(q -> q.multiMatch(mm -> mm
                        .query(query)
                        .fields(List.of("title^3", "message^1.5", "description^1.0", "stacktrace^0.5"))
                        .fuzziness("AUTO")
                ));

                boolQuery.must(multiMatch);

                // Autocomplete Query: Match title to boost exact matches
                Query autocompleteMatch = Query.of(q -> q.match(m -> m
                        .field("title")
                        .query(query)
                ));
                boolQuery.should(autocompleteMatch);

                // Ranking Optimization: Function Score Query (boost by popularity)
                Query mainQuery = Query.of(q -> q.bool(boolQuery.build()));

                queryBuilder = Query.of(q -> q.functionScore(fs -> fs
                        .query(mainQuery)
                        .functions(List.of(
                                new FunctionScore.Builder()
                                        .fieldValueFactor(new FieldValueFactorScoreFunction.Builder()
                                                .field("popularity")
                                                .factor(1.2)
                                                .modifier(FieldValueFactorModifier.Log1p)
                                                .missing(0.0)
                                                .build())
                                        .build()
                        ))
                        .scoreMode(FunctionScoreMode.Multiply)
                        .boostMode(FunctionBoostMode.Multiply)
                ));
            } else {
                queryBuilder = Query.of(q -> q.bool(boolQuery.build()));
            }

            // Suggestions block (Term suggester on title for typo checking)
            Suggester suggester = null;
            if (query != null && !query.isBlank()) {
                suggester = new Suggester.Builder()
                        .suggesters("title-suggest", new FieldSuggester.Builder()
                                .text(query)
                                .term(new TermSuggester.Builder()
                                        .field("title")
                                        .size(3)
                                        .build())
                                .build())
                        .build();
            }

            SearchRequest.Builder searchRequest = new SearchRequest.Builder()
                    .index("issues")
                    .query(queryBuilder)
                    .size(50); // Cap at 50 results

            if (suggester != null) {
                searchRequest.suggest(suggester);
            }

            // Apply Sort Order (Popularity, Newest, Views, or Relevance Score)
            if ("popularity".equalsIgnoreCase(sortBy)) {
                searchRequest.sort(s -> s.field(f -> f.field("popularity").order(SortOrder.Desc)));
            } else if ("views".equalsIgnoreCase(sortBy)) {
                searchRequest.sort(s -> s.field(f -> f.field("views").order(SortOrder.Desc)));
            } else if ("newest".equalsIgnoreCase(sortBy) || "lastSeen".equalsIgnoreCase(sortBy)) {
                searchRequest.sort(s -> s.field(f -> f.field("lastSeen").order(SortOrder.Desc)));
            } else {
                // relevance (default)
                searchRequest.sort(s -> s.score(sc -> sc.order(SortOrder.Desc)));
            }

            SearchResponse<IssueDocument> response = elasticsearchClient.search(searchRequest.build(), IssueDocument.class);

            // 1. Map Search hits to DTO response
            List<IssueResponse> issues = response.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(issueMapper::toResponseFromDocument)
                    .collect(Collectors.toList());

            // 2. Extract suggestions
            List<String> suggestions = new ArrayList<>();
            if (response.suggest() != null && response.suggest().containsKey("title-suggest")) {
                List<Suggestion<IssueDocument>> suggestionList = response.suggest().get("title-suggest");
                for (Suggestion<IssueDocument> sug : suggestionList) {
                    for (co.elastic.clients.elasticsearch.core.search.TermSuggestOption option : sug.term().options()) {
                        suggestions.add(option.text());
                    }
                }
            }

            // 3. Extract autocomplete prefixes from matches
            List<String> autocomplete = response.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(IssueDocument::getTitle)
                    .distinct()
                    .collect(Collectors.toList());

            return new IssueSearchResponse(issues, suggestions, autocomplete);

        } catch (Exception e) {
            log.error("Elasticsearch query failed: {}", e.getMessage(), e);
            throw new RuntimeException("Search failed due to an Elasticsearch error: " + e.getMessage(), e);
        }
    }
}
