import * as Sentry from "@sentry/nextjs";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

Sentry.init(getSentryInitOptions());
