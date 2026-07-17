package com.fixit.hub.service;

import com.fixit.hub.dto.TaxonomyResponse;
import java.util.List;

public interface TaxonomyService {
    List<TaxonomyResponse> getLanguages();
    List<TaxonomyResponse> getFrameworks();
    List<TaxonomyResponse> getCategories();
    List<TaxonomyResponse> getTags();
}
