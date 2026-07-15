package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Comment;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.CommentResponse;
import java.time.LocalDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T18:28:44+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260624-0231, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class CommentMapperImpl implements CommentMapper {

    @Override
    public CommentResponse toResponse(Comment comment) {
        if ( comment == null ) {
            return null;
        }

        UUID issueId = null;
        UUID userId = null;
        String userName = null;
        UUID id = null;
        String content = null;
        LocalDateTime createdAt = null;

        issueId = commentIssueId( comment );
        userId = commentUserId( comment );
        userName = commentUserName( comment );
        id = comment.getId();
        content = comment.getContent();
        createdAt = comment.getCreatedAt();

        CommentResponse commentResponse = new CommentResponse( id, issueId, userId, userName, content, createdAt );

        return commentResponse;
    }

    private UUID commentIssueId(Comment comment) {
        if ( comment == null ) {
            return null;
        }
        Issue issue = comment.getIssue();
        if ( issue == null ) {
            return null;
        }
        UUID id = issue.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private UUID commentUserId(Comment comment) {
        if ( comment == null ) {
            return null;
        }
        User user = comment.getUser();
        if ( user == null ) {
            return null;
        }
        UUID id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String commentUserName(Comment comment) {
        if ( comment == null ) {
            return null;
        }
        User user = comment.getUser();
        if ( user == null ) {
            return null;
        }
        String name = user.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
