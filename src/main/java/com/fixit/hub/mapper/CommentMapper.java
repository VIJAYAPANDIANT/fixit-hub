package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Comment;
import com.fixit.hub.dto.CommentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "issue.id", target = "issueId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.name", target = "userName")
    CommentResponse toResponse(Comment comment);
}
