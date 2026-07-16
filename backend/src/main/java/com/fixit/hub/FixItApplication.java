package com.fixit.hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.fixit.hub.repository.jpa")
@EnableElasticsearchRepositories(basePackages = "com.fixit.hub.repository.es")
public class FixItApplication {

    public static void main(String[] args) {
        // Enforce virtual thread support on Tomcat/Executors if running on Java 21+
        System.setProperty("jdk.virtualThreadScheduler.parallelism", "10");
        SpringApplication.run(FixItApplication.class, args);
    }
}
