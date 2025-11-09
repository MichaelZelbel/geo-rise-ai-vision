-- ============================================
-- GEORISE DATABASE EXPORT
-- Exported from Lovable Cloud
-- Date: 2025-11-09
-- ============================================

-- ============================================
-- TABLE: profiles
-- ============================================
INSERT INTO profiles (id, email, role, plan, tenant_id, created_at, updated_at) VALUES
('c29e0c42-bdef-4707-8c77-771dc31a3766', 'michael@zelbel.de', 'user', 'free', NULL, '2025-11-06 16:25:04.987312+00', '2025-11-06 16:25:04.987312+00'),
('f63cd67c-a5d9-4dd1-a8b3-cb5e4af6d74b', 'fred@free.com', 'user', 'free', NULL, '2025-11-06 19:18:51.672998+00', '2025-11-06 19:18:51.838761+00'),
('88a4bc35-1241-4ddd-9fff-e92c3a6f8817', 'peter@pro.com', 'user', 'giftedPro', NULL, '2025-11-06 19:18:52.124474+00', '2025-11-06 19:18:52.211094+00'),
('7f078493-f4de-491b-8156-6f7f8f425936', 'benny@business.com', 'user', 'giftedAgency', NULL, '2025-11-06 19:18:52.46513+00', '2025-11-06 19:18:52.538766+00'),
('eda6f1a4-99fe-4782-8f01-e69186bc62bb', 'alice@admin.com', 'user', 'giftedPro', NULL, '2025-11-06 19:18:52.75753+00', '2025-11-06 19:18:52.817917+00')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  plan = EXCLUDED.plan,
  tenant_id = EXCLUDED.tenant_id,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- TABLE: brands
-- ============================================
INSERT INTO brands (id, user_id, name, topic, visibility_score, last_run, created_at, updated_at) VALUES
('08203798-9aee-4b8a-82ab-165d70afbe22', 'c29e0c42-bdef-4707-8c77-771dc31a3766', 'Michael Zelbel', 'Photography', 0, NULL, '2025-11-06 17:11:01.389732+00', '2025-11-06 17:11:01.389732+00'),
('86e7f549-096f-4a33-a7c5-35d3c18441ea', 'f63cd67c-a5d9-4dd1-a8b3-cb5e4af6d74b', 'Gary Vaynerchuck', 'Social Media', 0, NULL, '2025-11-06 19:18:51.946679+00', '2025-11-06 19:18:51.946679+00'),
('b07d19d0-5bba-4f03-8be6-eb048d2faa30', '88a4bc35-1241-4ddd-9fff-e92c3a6f8817', 'Michael Zelbel', 'Photography', 15, '2025-11-06 22:20:57.618+00', '2025-11-06 19:18:52.311655+00', '2025-11-06 22:20:57.657503+00'),
('bb64f5e7-23e3-48ee-be1d-698201ffad4f', '7f078493-f4de-491b-8156-6f7f8f425936', 'Richard Branson', 'Entrepreneurship', 0, NULL, '2025-11-06 19:18:52.611119+00', '2025-11-06 19:18:52.611119+00'),
('3789510e-f0da-4a46-9b2f-15b259eef2fe', 'eda6f1a4-99fe-4782-8f01-e69186bc62bb', 'Michael Zelbel', 'AI', 0, NULL, '2025-11-06 19:18:52.877816+00', '2025-11-06 19:18:52.877816+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  topic = EXCLUDED.topic,
  visibility_score = EXCLUDED.visibility_score,
  last_run = EXCLUDED.last_run,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- TABLE: user_roles
-- ============================================
INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('d4a901ce-999e-4b62-8aa7-456a2b00b081', 'c29e0c42-bdef-4707-8c77-771dc31a3766', 'user', '2025-11-06 16:25:04.987312+00'),
('ab6e55c8-0486-411d-9879-7e6e77f6e92e', 'f63cd67c-a5d9-4dd1-a8b3-cb5e4af6d74b', 'user', '2025-11-06 19:18:51.672998+00'),
('4652e941-4f2f-4fac-ab53-98fde041009e', '88a4bc35-1241-4ddd-9fff-e92c3a6f8817', 'user', '2025-11-06 19:18:52.124474+00'),
('5b1e50b5-e675-4805-9f89-c57200c5235e', '7f078493-f4de-491b-8156-6f7f8f425936', 'user', '2025-11-06 19:18:52.46513+00'),
('5ca4b878-9729-4124-9ac2-81bc12605759', 'eda6f1a4-99fe-4782-8f01-e69186bc62bb', 'user', '2025-11-06 19:18:52.75753+00'),
('fa4ccfae-69fd-41fb-8eac-b8637db9e837', 'eda6f1a4-99fe-4782-8f01-e69186bc62bb', 'admin', '2025-11-06 19:18:52.954049+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role;

-- ============================================
-- TABLE: analyses
-- ============================================
INSERT INTO analyses (id, brand_id, run_id, ai_engine, query, position, mention_type, sentiment, url, occurred_at) VALUES
('69f8fceb-e407-4149-b784-fca791c099ba', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Who are the leading experts in Photography?', NULL, NULL, NULL, NULL, '2025-11-06 21:31:18.132+00'),
('dfb2cd67-6e7d-4e0f-92cc-c8c5f0d4d516', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'What are the best Photography companies?', NULL, NULL, NULL, NULL, '2025-11-06 21:31:23.843+00'),
('c68e8d73-7e2a-4003-900c-890f9c6b5e12', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Top Photography consultants and advisors', NULL, NULL, NULL, NULL, '2025-11-06 21:31:33.451+00'),
('4847c4da-8e8f-4784-836a-c78a7be3a3e9', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography thought leaders to follow', NULL, NULL, NULL, NULL, '2025-11-06 21:31:41.303+00'),
('9bf2d41a-a566-4578-a268-f7296b6074db', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Best Photography resources and tools', NULL, NULL, NULL, NULL, '2025-11-06 21:31:56.719+00'),
('7853be4f-38a7-4bbd-a555-56bbe02c7045', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography case studies and success stories', NULL, NULL, NULL, NULL, '2025-11-06 21:32:06.667+00'),
('82112021-52fa-48aa-9ea8-22a323236a1b', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'How to find a good Photography consultant', NULL, NULL, NULL, NULL, '2025-11-06 21:32:39.444+00'),
('e458f700-ac56-4a8d-8e7b-28cde685ef3f', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography industry analysis and trends', NULL, NULL, NULL, NULL, '2025-11-06 21:32:49.5+00'),
('ac45f776-ac4c-49fd-b72b-e6fcfcb278e2', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Who should I hire for Photography services?', NULL, NULL, NULL, NULL, '2025-11-06 21:32:57.808+00'),
('05169637-78ca-4638-8c3c-3cb941b25e9f', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography vendor comparison and reviews', NULL, NULL, NULL, NULL, '2025-11-06 21:33:09.84+00'),
('6af5ad94-e772-4eec-b154-4c3d31fcb486', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Michael Zelbel reviews and reputation', 1, 'citation', 'neutral', 'https://journal.phottix.com/photog-friday/cheeky-photographer-michael-zelbel/', '2025-11-06 21:33:16.994+00'),
('f8f6d363-e781-4f6e-952f-d8aad8d487de', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Is Michael Zelbel good at Photography?', 1, 'citation', 'neutral', 'https://journal.phottix.com/photog-friday/cheeky-photographer-michael-zelbel/', '2025-11-06 21:33:54.146+00'),
('f8f6cad8-3f6f-4fd9-94a0-d38cfe9aa3b6', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Michael Zelbel vs competitors in Photography', 1, 'citation', 'neutral', 'https://journal.phottix.com/photog-friday/cheeky-photographer-michael-zelbel/', '2025-11-06 21:34:01.222+00'),
('a73d83a5-4dc7-4492-bc1a-8480578ed6be', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography expert recommendations', NULL, NULL, NULL, NULL, '2025-11-06 21:34:08.266+00'),
('4a0891dc-6913-4c03-9b22-5c97077f155b', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'b91de0d1-ff67-44a8-bfcc-f1d133fca345', 'perplexity', 'Photography consulting firms ranking', NULL, NULL, NULL, NULL, '2025-11-06 21:34:19.237+00')
ON CONFLICT (id) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  run_id = EXCLUDED.run_id,
  ai_engine = EXCLUDED.ai_engine,
  query = EXCLUDED.query,
  position = EXCLUDED.position,
  mention_type = EXCLUDED.mention_type,
  sentiment = EXCLUDED.sentiment,
  url = EXCLUDED.url,
  occurred_at = EXCLUDED.occurred_at;

-- ============================================
-- TABLE: coach_conversations
-- ============================================
INSERT INTO coach_conversations (id, user_id, brand_id, role, message, created_at) VALUES
('53413730-2515-4f5b-b933-7497fbddafd9', '88a4bc35-1241-4ddd-9fff-e92c3a6f8817', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'user', 'Hi', '2025-11-06 19:38:17.222271+00'),
('d49ca0f9-1515-4c96-bb44-96d2d7a93962', '88a4bc35-1241-4ddd-9fff-e92c3a6f8817', 'b07d19d0-5bba-4f03-8be6-eb048d2faa30', 'assistant', 'Hello Michael! I''m your GEORISE Optimization Coach.

Currently, your brand, Michael Zelbel, has a visibility score of 0/100, meaning you''re not yet appearing in our test queries across various AI search engines. This isn''t uncommon for new optimizations, and it gives us a clear starting point.

**Why you''re not being mentioned yet:**
AI engines, like traditional search engines, primarily surface information that is readily available, well-structured, and frequently referenced. Since your brand hasn''t appeared in our initial scans, it suggests a need to establish or strengthen your online presence in ways AI can easily process.

**Actionable Recommendation:**
Let''s start by focusing on building foundational content. Create dedicated pages or articles on your website that clearly define:
1.  **"Who is Michael Zelbel?"**: A professional bio highlighting your expertise in photography.
2.  **"Michael Zelbel''s Photography Style/Philosophy"**: Describe your unique approach.
3.  **"Michael Zelbel''s Photography Workshops/Courses"**: Detail any educational offerings.

**Next Steps:**
Ensure these pages use clear, descriptive headings and include relevant keywords like "photography," "portrait photography," "lighting techniques," etc., naturally within the text. This structured content will make it easier for AI to identify and categorize information about Michael Zelbel.

We''ll re-run queries once you''ve had a chance to implement these initial steps. Let''s get Michael Zelbel on the AI map!', '2025-11-06 19:38:17.303645+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  brand_id = EXCLUDED.brand_id,
  role = EXCLUDED.role,
  message = EXCLUDED.message;

-- ============================================
-- NOTES:
-- ============================================
-- Tables with no data: competitors, insights, subscriptions
-- Total records exported:
--   - profiles: 5
--   - brands: 5
--   - user_roles: 6
--   - analyses: 15
--   - coach_conversations: 2
--
-- Next steps after running this dump on your new Supabase instance:
-- 1. You'll also need to create the corresponding auth.users records
--    (use Supabase dashboard or auth.admin.createUser API)
-- 2. Run all migrations from supabase/migrations/ directory
-- 3. Update .env file with new Supabase credentials
-- 4. Update src/integrations/supabase/client.ts with new credentials
-- ============================================
