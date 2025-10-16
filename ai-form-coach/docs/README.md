# AI Form Coach Documentation

Welcome to AI Form Coach documentation.

## 📚 Main Documentation

- **[Pose Tracking System](./pose/README.md)** - Complete pose detection, analysis, and coaching system
  - Features, testing, deployment guides
  - Real-time skeleton sync and performance optimization
  - Database schema and API documentation

## 📁 Documentation Structure

```
docs/
├── pose/                  # Pose detection and coaching system
│   ├── README.md         # Pose system overview
│   ├── QUICK_REFERENCE.md
│   ├── TESTING_CHECKLIST.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── ... (other pose docs)
├── development/          # Development guides
├── features/             # Feature documentation
├── systems/              # System implementations
├── technical/            # Technical details
└── verification/         # Verification procedures
```

## 🚀 Quick Start

1. Start with [Pose System README](./pose/README.md)
2. Review [Quick Reference](./pose/QUICK_REFERENCE.md)
3. Check [Testing Guide](./pose/TESTING_CHECKLIST.md)
4. Deploy with [Deployment Checklist](./pose/DEPLOYMENT_CHECKLIST.md)

## 🔧 Database

- SQL migrations are organized in `supabase/migrations/`
  - All migrations follow sequential naming: `NNN_system_name.sql`
  - Run with: `supabase db push`

## ❓ Need Help?

- **Pose tracking?** → See [Pose README](./pose/README.md)
- **Testing?** → See [Testing Checklist](./pose/TESTING_CHECKLIST.md)
- **Deployment?** → See [Deployment Checklist](./pose/DEPLOYMENT_CHECKLIST.md)
- **Database?** → Check `supabase/migrations/`

---

**For comprehensive pose system documentation, see [pose/README.md](./pose/README.md)**
