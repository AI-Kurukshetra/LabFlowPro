# Skills Configuration

## Available Skills

### /build
Run the Next.js production build to verify compilation.
```bash
npm run build
```

### /lint
Run ESLint across the project.
```bash
npm run lint
```

### /seed
Seed the remote Supabase database with comprehensive test data.
```bash
npx tsx supabase/seed-full.ts
```

### /migrate
Push pending migrations to the remote Supabase database.
```bash
supabase db push
```

### /dev
Start the development server.
```bash
npm run dev
```

### /test-auth
Test authentication with different roles:
- Admin: mike.johnson@labflow.dev / LabFlow@2026
- Intake: sarah.williams@labflow.dev / LabFlow@2026
- Technician: brian.davis@labflow.dev / LabFlow@2026
- Reviewer: jessica.miller@labflow.dev / LabFlow@2026
- Patient: james.wilson@email.com / Patient@2026

### /add-component
Add a new shadcn/ui component:
```bash
npx shadcn@latest add <component-name> --overwrite
```
