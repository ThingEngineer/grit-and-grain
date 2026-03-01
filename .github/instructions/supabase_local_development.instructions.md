---
applyTo: "**"
---

# Supabase Local Development Instructions

## CRITICAL: Local Development Only

**YOU MUST ONLY WORK WITH THE LOCAL SUPABASE INSTANCE. NEVER INTERACT WITH PRODUCTION.**

### Database Querying

- **ALWAYS** use the `#mcp_supabase_query` tool to query the local Supabase database
- This tool connects directly to the local instance and is safe for all read operations
- Use this for testing queries, inspecting data, and verifying database state

### Forbidden Commands

**NEVER run these commands - they interact with remote/production:**

- `supabase db pull` - pulls schema from remote
- `supabase db reset` - resets database (risky)
- `supabase db remote commit` - commits to remote
- `supabase migration up --local` - applies migrations to local
- Any command with `--db-url` pointing to production

### Allowed Local Operations

**Safe commands for local development:**

- `supabase status` - check local services status
- `supabase start` - start local instance
- `supabase stop` - stop local instance
- `supabase migration new <file_name>` - create new migration file
- `supabase migration list` - list migrations
- `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/migrations/20251126100000_migration_file_name.sql` - manually apply specific migration file to local if migration up --local fails
- supabase gen types typescript --local > types/database.types.ts - generate/update types from local database

### Database Changes Workflow

**When adding or updating Postgres functions/SQL:**

- Refer to the `.github/instructions/supabase_local_development.instructions.md` file for detailed steps on how to safely create and test migrations and database functions locally.

1. Create a new migration file:

   ```bash
   supabase migration new descriptive_file_name
   ```

2. Write your SQL changes in the generated migration file in `supabase/migrations/`

3. Test locally using `#mcp_supabase_query` tool to verify the changes work

### Testing Database Functions

When testing new or modified Postgres functions:

1. Use `#mcp_supabase_query` to call the function with test parameters
2. Verify the results match expectations
3. Test edge cases and error conditions
4. Document any findings in your response

### Safety Reminders

- Local instance runs on `http://127.0.0.1:54321` by default
- All changes stay local until the user manually promotes them
- You can freely query and test without affecting production
- When in doubt, use `#mcp_supabase_query` to inspect before making changes
