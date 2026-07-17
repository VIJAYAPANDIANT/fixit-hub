-- =========================================================================
-- FLYWAY SEED MIGRATION: V2__seed_data.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================



-- 2. Seed Programming Languages
INSERT INTO programming_languages (name, slug) VALUES
('Java', 'java'),
('Go', 'go'),
('Python', 'python'),
('JavaScript', 'javascript'),
('TypeScript', 'typescript');

-- 3. Seed Frameworks
INSERT INTO frameworks (language_id, name, slug) VALUES
((SELECT id FROM programming_languages WHERE slug = 'java'), 'Spring Boot', 'spring-boot'),
((SELECT id FROM programming_languages WHERE slug = 'go'), 'Gin Web Framework', 'gin'),
((SELECT id FROM programming_languages WHERE slug = 'python'), 'Django', 'django'),
((SELECT id FROM programming_languages WHERE slug = 'typescript'), 'Next.js', 'nextjs'),
((SELECT id FROM programming_languages WHERE slug = 'javascript'), 'Express', 'express');

-- 4. Seed Categories
INSERT INTO categories (name, slug, description) VALUES
('Database Connection', 'database', 'Failures acquiring connection pool sockets, transaction timeouts, and SQL syntax exceptions'),
('Network / Transport', 'network', 'Socket timeouts, DNS resolution failures, and CORS handshake issues'),
('Security & Authentication', 'authentication', 'Token validation errors, expired certificates, and forbidden authorization accesses'),
('Memory Allocation', 'memory', 'Out of memory leaks, garbage collection threshold spikes, and heap limits exceeded'),
('Concurrency / Multithreading', 'concurrency', 'Thread lock contentions, deadlock events, and race conditions');

-- 5. Seed Tags
INSERT INTO tags (name, slug) VALUES
('NullPointerException', 'nullpointer'),
('OutOfMemoryError', 'oom'),
('ConnectionTimeout', 'timeout'),
('CORSPolicy', 'cors'),
('Deadlock', 'deadlock'),
('ProductionCrash', 'prod-crash');

-- 6. Seed Default Administrator (Bcrypt Hash for 'adminpassword')
INSERT INTO users (email, password_hash, name, avatar_url, role, status) VALUES
('admin@fixit.hub', '$2a$12$N9qo8uLOqp.Pshw23wE.VOnBw98127qYkG3yOQf1F.27uA1S4Yy2G', 'Global Admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin', 'ADMIN', 'ACTIVE');

-- 7. Seed Sample Errors
INSERT INTO errors (id, project_id, fingerprint, title, message, stacktrace, environment, release_version, language_id, framework_id, category_id, user_id, status, severity, occurrences_count) VALUES
-- Error 1: NullPointerException in Spring Boot
('d3b07384-d113-4a00-bf5c-d38a2e5e1e12', 
 'c84a5f09-e030-4842-81bc-5f37029ad98e', 
 'fp_spring_npe_1092',
 'NullPointerException: Cannot invoke "com.fixit.hub.domain.entity.User.getRole()" because "user" is null',
 'Cannot invoke "com.fixit.hub.domain.entity.User.getRole()" because "user" is null at line 42 of SecurityConfig.java',
 'java.lang.NullPointerException: Cannot invoke "com.fixit.hub.domain.entity.User.getRole()" because "user" is null
	at com.fixit.hub.config.SecurityConfig.lambda$securityFilterChain$0(SecurityConfig.java:42)
	at org.springframework.security.web.DefaultSecurityFilterChain.doFilter(DefaultSecurityFilterChain.java:80)',
 'production',
 'v1.0.0',
 (SELECT id FROM programming_languages WHERE slug = 'java'),
 (SELECT id FROM frameworks WHERE slug = 'spring-boot'),
 (SELECT id FROM categories WHERE slug = 'authentication'),
 (SELECT id FROM users WHERE email = 'admin@fixit.hub'),
 'UNRESOLVED',
 'HIGH',
 342),

-- Error 2: OutOfMemory in Next.js
('e4a18293-e112-4f32-8dfc-e39a3e5e2f23',
 'c84a5f09-e030-4842-81bc-5f37029ad98e',
 'fp_node_oom_3920',
 'FatalError: JavaScript heap out of memory',
 'JavaScript heap out of memory. Allocation failed - JavaScript heap limit reached',
 'Fatal error in , line 0
	# Fatal error in V8: Garbage collector: write barrier allocation failed JavaScript heap out of memory
	#
	#FailureMessage Object: 0x7fff56a29e20
	at async renderPage (node_modules/next/dist/server/render.js:410:18)',
 'staging',
 'v1.2.1',
 (SELECT id FROM programming_languages WHERE slug = 'typescript'),
 (SELECT id FROM frameworks WHERE slug = 'nextjs'),
 (SELECT id FROM categories WHERE slug = 'memory'),
 (SELECT id FROM users WHERE email = 'admin@fixit.hub'),
 'UNRESOLVED',
 'CRITICAL',
 18);

-- 8. Seed Error Tags
INSERT INTO error_tags (error_id, tag_id) VALUES
('d3b07384-d113-4a00-bf5c-d38a2e5e1e12', (SELECT id FROM tags WHERE slug = 'nullpointer')),
('d3b07384-d113-4a00-bf5c-d38a2e5e1e12', (SELECT id FROM tags WHERE slug = 'prod-crash')),
('e4a18293-e112-4f32-8dfc-e39a3e5e2f23', (SELECT id FROM tags WHERE slug = 'oom'));

-- 9. Seed AI Solutions
INSERT INTO ai_solutions (error_id, model_name, summary, root_cause, fix_suggestion, confidence_score) VALUES
('d3b07384-d113-4a00-bf5c-d38a2e5e1e12',
 'gemini-1.5-flash',
 'A NullPointerException is thrown during authentication intercept mapping because the custom UserDetailsService returned null instead of throwing UsernameNotFoundException.',
 'Inside SecurityConfig.java, the Principal user context is checked without verifying if the user object exists in the session context, resulting in a method invocation on a null reference.',
 'Wrap the statement in an Optional check or throw a UsernameNotFoundException in your custom UserDetailsService implementation:\n\n```java\nUser user = userRepository.findByEmail(email)\n    .orElseThrow(() -> new UsernameNotFoundException("User not found"));\n```',
 0.95),

('e4a18293-e112-4f32-8dfc-e39a3e5e2f23',
 'gemini-1.5-pro',
 'Next.js rendering worker ran out of V8 heap memory during Static Site Generation (SSG) processes.',
 'A massive memory leak occurred during static build loops due to circular module importing and caching excessively large mock datasets in global objects.',
 'Increase the Node.js memory boundaries using environment flags or optimize bundle sizes:\n\n```bash\nexport NODE_OPTIONS="--max-old-space-size=4096"\n```',
 0.88);

-- 10. Seed Sample Human Solutions
INSERT INTO solutions (id, error_id, user_id, content, upvotes_count, downvotes_count, is_accepted) VALUES
('fa829831-f192-4912-8df1-fc28e382f129',
 'd3b07384-d113-4a00-bf5c-d38a2e5e1e12',
 (SELECT id FROM users WHERE email = 'admin@fixit.hub'),
 'I fixed this locally by implementing the Optional pattern in UserDetailsService. The AI suggestion is correct and was merged into main branches.',
 12,
 0,
 TRUE);

-- 11. Seed Sample Comments
INSERT INTO comments (error_id, user_id, content) VALUES
('d3b07384-d113-4a00-bf5c-d38a2e5e1e12',
 (SELECT id FROM users WHERE email = 'admin@fixit.hub'),
 'Triage assigned. We are pushing the patch in release v1.0.1 tonight.');
