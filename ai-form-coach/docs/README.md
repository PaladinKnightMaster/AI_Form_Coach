# AI Form Coach Documentation

Welcome to AI Form Coach documentation. This folder contains all documentation for the pose detection system, features, and architecture.

## 📚 Main Documentation

- **[Pose Tracking System](./pose/README.md)** - Complete pose detection, analysis, and coaching system
  - Features, architecture, and implementation guides
  - Real-time skeleton sync and performance optimization
  - Database schema and analytics documentation
  - All 6 phases (A-F) implemented and production-ready

## 📁 Documentation Structure

```
docs/
├── INDEX.md                   # Master navigation & index
├── README.md                  # This file
├── CHANGELOG.md               # Version history & updates
│
├── pose/                      # Pose Detection & Coaching System
│   ├── README.md             # Pose system overview
│   ├── QUICK_REFERENCE.md    # Complete reference (Phases A-F)
│   ├── README_3D_POSE_SYSTEM.md
│   ├── pose3DIntegrationGuide.md
│   └── INDEX.md              # Pose docs index
│
├── development/               # Development Guides
│   ├── POSE_ENGINE2_INTEGRATION_STATUS.md
│   └── VALIDATION_CHECKLIST.md
│
├── features/                  # Feature Documentation
│   ├── ASYNC_FORM_REPORT.md
│   ├── COPY_TRUST_PASS.md
│   ├── METRICS_GUARDRAILS.md
│   └── ORGANIZATION_DASHBOARD.md
│
├── systems/                   # System Implementations
│   ├── READINESS_SYSTEM_IMPLEMENTATION.md
│   ├── READINESS_TYPE_ARCHITECTURE.md
│   └── VERIFICATION_SYSTEM.md
│
├── technical/                 # Technical Details
│   ├── LEADERBOARDS.md
│   ├── METRICS_GUARDRAILS_DOCUMENTATION.md
│   ├── METRICS_GUARDRAILS_IMPLEMENTATION.md
│   ├── MICRO_MODEL.md
│   ├── MOVEMENT_EMBEDDINGS.md
│   └── PHASE_DETECTION.md
│
└── verification/              # Verification & Testing
    ├── ASYNC_FORM_REPORT_VERIFICATION.md
    ├── COPY_TRUST_PASS_VERIFICATION.md
    ├── MICRO_MODEL_VERIFICATION.md
    ├── MOVEMENT_EMBEDDINGS_VERIFICATION.md
    ├── ORGANIZATION_DASHBOARD_VERIFICATION.md
    ├── PACING_BAR_COMPLETE.md
    └── PACING_BAR_VERIFICATION.md
```

## 🚀 Quick Start

1. **Understand the System** → Start with [Pose System README](./pose/README.md)
2. **All Features Overview** → Review [QUICK_REFERENCE](./pose/QUICK_REFERENCE.md) (Phases A-F)
3. **3D Implementation** → Check [3D Pose System](./pose/README_3D_POSE_SYSTEM.md)
4. **Integration Guide** → Use [Integration Guide](./pose/pose3DIntegrationGuide.md)

## 🔧 Database

- SQL migrations are organized in `supabase/migrations/`
- All 9 consolidated files organized by domain
- For complete reference: **[SQL Migrations Index](../supabase/SQL_MIGRATIONS_INDEX.md)**

## ❓ Need Help?

- **Learning about pose detection?** → See [Pose README](./pose/README.md)
- **Quick reference needed?** → Check [QUICK_REFERENCE](./pose/QUICK_REFERENCE.md)
- **Understanding 3D rendering?** → See [3D Pose System](./pose/README_3D_POSE_SYSTEM.md)
- **Integration help?** → Use [Integration Guide](./pose/pose3DIntegrationGuide.md)
- **Database schema?** → Check `supabase/migrations/`
- **Feature details?** → Browse [features/](./features/)
- **System architecture?** → See [systems/](./systems/)
- **Navigation?** → Use [Documentation Index](./INDEX.md)

---

**For comprehensive documentation navigation, see [INDEX.md](./INDEX.md)**
