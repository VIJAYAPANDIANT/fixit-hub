package com.fixit.hub.service;

import com.fixit.hub.domain.entity.User;
import java.util.List;
import java.util.UUID;

public interface BookmarkService {
    void bookmarkIssue(UUID issueId, User user);
    void unbookmarkIssue(UUID issueId, User user);
    List<String> getBookmarkedIssueIds(User user);
}
