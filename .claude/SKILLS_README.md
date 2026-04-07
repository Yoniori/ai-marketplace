# 🎨 AI Marketplace Custom Skills

Your project now includes **5 professional custom skills** integrated into Claude Code.

## 📦 Installed Skills

### 1. 📊 Analytics Inspector
- **Trigger**: Mention earnings, sales, views, metrics, conversion rates, performance
- **Use case**: Analyze creator earnings trends and identify insights
- **Example**: "Why did my earnings drop this month?"
- **File**: `analytics-inspector.skill`

### 2. 🚀 Listing Optimizer
- **Trigger**: Ask about improving listings, boosting sales, pricing strategy
- **Use case**: Get data-driven suggestions to improve product performance
- **Example**: "My listing has 200 views but only 1 sale. What's wrong?"
- **File**: `listing-optimizer.skill`

### 3. 🗄️ Database Doctor
- **Trigger**: Mention schema, RLS, database, performance, Supabase
- **Use case**: Audit database schema for security and performance issues
- **Example**: "Is my RLS set up correctly?"
- **File**: `database-doctor.skill`

### 4. 📈 Earnings Report Generator
- **Trigger**: Ask for reports, summaries, exports, accounting statements
- **Use case**: Generate professional earnings reports for creators
- **Example**: "Generate my Q1 earnings report for my accountant"
- **File**: `earnings-report-generator.skill`

### 5. 🔍 Code Auditor
- **Trigger**: Request code review, security audit, performance review
- **Use case**: Review code for security, performance, and best practices
- **Example**: "Review this API endpoint for security issues"
- **File**: `code-auditor.skill`

---

## 🚀 How to Use

### In Claude Code (CLI)
Skills auto-trigger when relevant keywords appear in your prompt. You can also invoke directly:

```bash
claude -p "Analyze my earnings: 100 views, 5 sales, $500 revenue"
# → Analytics Inspector triggers automatically
```

### In Claude.ai
Just mention relevant topics and the skills will auto-trigger:
- "Why are my earnings down?" → **Analytics Inspector**
- "How can I improve this listing?" → **Listing Optimizer**
- "Check my database schema" → **Database Doctor**
- "Create an earnings report" → **Earnings Report Generator**
- "Review this code" → **Code Auditor**

---

## 📋 Examples for Each Skill

### Analytics Inspector
```
User: "I want to understand why my top product's sales dropped 50% last month"
→ Skill analyzes trends, identifies patterns, suggests optimization
```

### Listing Optimizer
```
User: "My 'Design Template' has 800 views but only 2 sales. Can you help?"
→ Skill suggests title changes, description improvements, pricing adjustments
```

### Database Doctor
```
User: "Is my Supabase schema optimized? Are there any security issues?"
→ Skill audits tables, indexes, RLS policies, suggests improvements
```

### Earnings Report Generator
```
User: "I need my Q4 earnings report for my accountant as a PDF"
→ Skill generates professional report with tax estimates
```

### Code Auditor
```
User: "Review this API endpoint for security vulnerabilities"
→ Skill checks SQL injection, auth, error handling, suggests fixes
```

---

## 🎯 Pro Tips

1. **Be specific** — The more context you provide, the better the analysis
   - ✓ "I have 5 listings. Top one: 200 sales, 4.8★, $99 price. Lowest: 2 sales, 2.5★, $149"
   - ✗ "My listings aren't selling well"

2. **Share data** — Copy-paste your dashboard metrics or code snippets
   - The skills work best with actual numbers and code

3. **Ask follow-ups** — Skills improve with context
   - "Why is the conversion rate so low?" → "What's my typical pricing range?"

4. **Combine skills** — Use multiple skills for complex analysis
   - Database Doctor → Code Auditor → Listing Optimizer

---

## 📚 Additional Resources

- **Earnings Dashboard**: `/dashboard/earnings` — Live analytics for creators
- **Creator Analytics**: `lib/analytics.ts` — Server-side data aggregation
- **Database Schema**: `supabase/migrations/` — All schema definitions

---

**Created**: April 7, 2026  
**Updated**: April 7, 2026
