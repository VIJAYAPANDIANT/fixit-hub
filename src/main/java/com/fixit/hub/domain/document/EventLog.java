package com.fixit.hub.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;
import java.util.Map;

@Document(indexName = "event_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventLog {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String projectId;

    @Field(type = FieldType.Keyword)
    private String issueId;

    @Field(type = FieldType.Date)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String environment;

    @Field(type = FieldType.Keyword)
    private String release;

    @Field(type = FieldType.Keyword)
    private String exceptionType;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String exceptionMessage;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String stacktrace;

    @Field(type = FieldType.Text)
    private String breadcrumbs; // JSON string payload

    @Field(type = FieldType.Object)
    private Map<String, String> tags;

    @Field(type = FieldType.Object)
    private Map<String, String> userContext;

    @Field(type = FieldType.Keyword)
    private String fingerprint;
}
