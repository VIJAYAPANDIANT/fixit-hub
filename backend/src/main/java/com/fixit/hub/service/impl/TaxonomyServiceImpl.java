package com.fixit.hub.service.impl;

import com.fixit.hub.dto.TaxonomyResponse;
import com.fixit.hub.repository.jpa.CategoryRepository;
import com.fixit.hub.repository.jpa.FrameworkRepository;
import com.fixit.hub.repository.jpa.ProgrammingLanguageRepository;
import com.fixit.hub.repository.jpa.TagRepository;
import com.fixit.hub.service.TaxonomyService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxonomyServiceImpl implements TaxonomyService {

    private final ProgrammingLanguageRepository languageRepository;
    private final FrameworkRepository frameworkRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    @Override
    @Cacheable(value = "languages")
    public List<TaxonomyResponse> getLanguages() {
        return languageRepository.findAll().stream()
                .map(l -> new TaxonomyResponse(l.getId(), l.getName(), l.getSlug()))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "frameworks")
    public List<TaxonomyResponse> getFrameworks() {
        return frameworkRepository.findAll().stream()
                .map(f -> new TaxonomyResponse(f.getId(), f.getName(), f.getSlug()))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "categories")
    public List<TaxonomyResponse> getCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new TaxonomyResponse(c.getId(), c.getName(), c.getSlug()))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "tags")
    public List<TaxonomyResponse> getTags() {
        return tagRepository.findAll().stream()
                .map(t -> new TaxonomyResponse(t.getId(), t.getName(), t.getSlug()))
                .collect(Collectors.toList());
    }
}
