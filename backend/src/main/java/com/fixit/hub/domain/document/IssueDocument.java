package com.fixit.hub.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.time.Instant;
import java.util.List;

@Document(indexName = "issues")
@Setting(settingPath = "elasticsearch/settings.json")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String projectId;

    @Field(type = FieldType.Keyword)
    private String fingerprint;

    @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String message;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String stacktrace;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String rootCause;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String verifiedFix;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String codeSnippet;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Keyword)
    private String severity;

    @Field(type = FieldType.Keyword)
    private String difficulty;

    @Field(type = FieldType.Integer)
    private int popularity;

    @Field(type = FieldType.Integer)
    private int views;

    @Field(type = FieldType.Integer)
    private int occurrencesCount;

    @Field(type = FieldType.Date)
    private Instant createdAt;

    @Field(type = FieldType.Date)
    private Instant firstSeen;

    @Field(type = FieldType.Date)
    private Instant lastSeen;

    @Field(type = FieldType.Keyword)
    private String languageName;

    @Field(type = FieldType.Keyword)
    private String languageSlug;

    @Field(type = FieldType.Keyword)
    private String frameworkName;

    @Field(type = FieldType.Keyword)
    private String frameworkSlug;

    @Field(type = FieldType.Keyword)
    private String categoryName;

    @Field(type = FieldType.Keyword)
    private String categorySlug;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String aiAnalysis;

    @Field(type = FieldType.Keyword)
    private String assignedToUserId;

    @Field(type = FieldType.Keyword)
    private String assignedToName;
}
