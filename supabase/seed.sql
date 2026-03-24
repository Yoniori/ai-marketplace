-- ============================================================
-- seed.sql
-- Vibe Code Market — Seed Data
-- ============================================================
-- Run after all migrations to populate:
--   • categories (product taxonomy)
--   • tags       (built_with vibe coding tools + general tags)
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- ============================================================

-- ── Categories ───────────────────────────────────────────────

INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('AI Agent',         'ai-agent',         'Autonomous AI agents and assistants that run tasks on your behalf.',         '🤖', 10),
  ('Automation',       'automation',        'Workflow automations, bots, and no-code integrations.',                      '⚡', 20),
  ('SaaS Template',    'saas-template',     'Full SaaS starter kits with auth, billing, and dashboard.',                  '🚀', 30),
  ('Chrome Extension', 'chrome-extension',  'Browser extensions that add AI superpowers to your workflow.',               '🧩', 40),
  ('API Tool',         'api-tool',          'Standalone API services, wrappers, and developer utilities.',                '🔌', 50),
  ('Prompt Pack',      'prompt-pack',       'Curated prompt libraries and templates for LLMs.',                           '💬', 60),
  ('Dashboard',        'dashboard',         'Analytics dashboards, admin panels, and reporting tools.',                   '📊', 70),
  ('Mobile App',       'mobile-app',        'Mobile applications built and shipped with AI coding tools.',                '📱', 80),
  ('CLI Tool',         'cli-tool',          'Command-line tools and developer utilities.',                                 '💻', 90),
  ('Other',            'other',             'Everything else built with vibe coding tools.',                               '📦', 100)
ON CONFLICT (slug) DO NOTHING;

-- ── Built With Tags (vibe coding tools) ──────────────────────

INSERT INTO public.tags (name, slug, tag_type) VALUES
  -- Core vibe coding platforms
  ('Claude Code',  'claude-code',  'built_with'),
  ('Cursor',       'cursor',       'built_with'),
  ('Lovable',      'lovable',      'built_with'),
  ('Bolt',         'bolt',         'built_with'),
  ('Replit',       'replit',       'built_with'),
  ('v0',           'v0',           'built_with'),
  ('Windsurf',     'windsurf',     'built_with'),
  ('Devin',        'devin',        'built_with'),
  ('GitHub Copilot','github-copilot','built_with'),
  ('Cline',        'cline',        'built_with'),
  ('Aider',        'aider',        'built_with'),
  ('Continue',     'continue',     'built_with'),

  -- Technology tags
  ('Next.js',      'nextjs',       'technology'),
  ('React',        'react',        'technology'),
  ('Supabase',     'supabase',     'technology'),
  ('Firebase',     'firebase',     'technology'),
  ('Stripe',       'stripe',       'technology'),
  ('OpenAI',       'openai',       'technology'),
  ('Anthropic',    'anthropic',    'technology'),
  ('LangChain',    'langchain',    'technology'),
  ('n8n',          'n8n',          'technology'),
  ('Zapier',       'zapier',       'technology'),
  ('Make',         'make',         'technology'),
  ('Vercel',       'vercel',       'technology'),
  ('Tailwind CSS', 'tailwind-css', 'technology'),

  -- General / topic tags
  ('Productivity',  'productivity',  'general'),
  ('Marketing',     'marketing',     'general'),
  ('Sales',         'sales',         'general'),
  ('Finance',       'finance',       'general'),
  ('Developer Tools','developer-tools','general'),
  ('Education',     'education',     'general'),
  ('E-commerce',    'ecommerce',     'general'),
  ('Social Media',  'social-media',  'general'),
  ('Content Creation','content-creation','general'),
  ('Analytics',     'analytics',     'general'),
  ('SEO',           'seo',           'general'),
  ('Customer Support','customer-support','general')
ON CONFLICT (slug) DO NOTHING;
