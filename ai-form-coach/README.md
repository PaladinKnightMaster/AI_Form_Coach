# AI Form Coach 💪

A revolutionary fitness application that combines AI-powered form coaching with comprehensive nutrition tracking and personalized workout planning. Transform your fitness journey with real-time feedback, smart planning, and professional-grade health monitoring.

![AI Form Coach](https://img.shields.io/badge/AI-Form%20Coach-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)

## ✨ Features

### 🎯 AI Form Coaching
- **Real-time pose detection** using MediaPipe for squats, push-ups, and planks
- **Instant form feedback** with voice coaching cues
- **Automatic rep counting** with precision accuracy tracking
- **Form quality scoring** and progress visualization
- **Auto-pause functionality** when you step out of view
- **Injury prevention alerts** based on form analysis
- **Privacy-first design** - all processing happens on your device

### 🥗 Smart Nutrition Tracking
- **AI food recognition** with camera-based food scanning
- **Smart food database** with thousands of verified nutritional entries
- **Macro tracking** with visual progress rings (calories, protein, carbs, fat)
- **Goals and streaks** with personalized calorie and macro targets
- **Quick meal logging** with barcode scanning and search
- **Daily nutrition overview** with meal breakdown and insights
- **Date navigation** to track progress over time
- **Protein advisory** with gentle reminders for optimal intake

### 🗓️ AI-Powered Workout Plans
- **AI-generated workout plans** using Google Gemini with quiz-style wizard
- **Featured workout programs** for different fitness levels and goals
- **Progressive overload engine** with automatic progression rules
- **Smart plan adjustments** based on readiness and performance metrics
- **Plan management** with pause, resume, and customization options
- **Weekly calendar view** with regeneration capabilities
- **Readiness-based modifications** (volume reduction, mobility days, finisher sets)

### 📊 Health Monitoring & Readiness
- **Daily readiness assessment** based on sleep, stress, soreness, and motivation
- **Health data integration** with Apple HealthKit, Google Fit, and Health Connect
- **Smart workout recommendations** based on health metrics and readiness scores
- **Readiness scoring algorithm** with weighted calculations
- **Health baseline tracking** for personalized insights
- **Manual input options** when device data is unavailable
- **Training load monitoring** to prevent overtraining

### 🎨 Professional UI/UX
- **World-class design** with diagonal slash layout and rainbow animations
- **Auto-swiping feature carousel** showcasing key capabilities
- **Professional imagery** from Unsplash with optimized loading
- **Glass morphism effects** with backdrop blur and gradient overlays
- **Smooth animations** and hover effects throughout
- **Responsive design** optimized for all screen sizes
- **Modern navigation** with FAQ and Pricing in header

### 🎯 Additional Features
- **Progress tracking** with detailed charts and analytics
- **Workout history** with session summaries and demo mode
- **Export functionality** for data portability
- **Offline support** with data synchronization queue
- **Dark/light theme** support with system preference detection
- **Accessibility features** with keyboard navigation and ARIA labels
- **Toast notifications** with professional styling and animations
- **Loading states** with blur effects and progress indicators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account for database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-form-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI Features (Required)
   GEMINI_API_KEY=your_gemini_api_key
   
   # Payment Processing (Required for Pro features)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PRICE_MONTHLY_ID=your_stripe_monthly_price_id
   STRIPE_PRICE_YEARLY_ID=your_stripe_yearly_price_id
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Hero Images (Optional - fallback to local images)
   NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   NEXT_PUBLIC_PIXABAY_API_KEY=your_pixabay_api_key
   
   # Monitoring & Analytics (Optional)
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
   NEXT_PUBLIC_UMAMI_SRC=your_umami_src_url
   
   # SEO & Site Configuration (Optional)
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   GOOGLE_SITE_VERIFICATION=your_google_verification_code
   
   # MediaPipe Configuration (Optional - uses CDN by default)
   NEXT_PUBLIC_MEDIAPIPE_WASM_URL=your_mediapipe_wasm_url
   
   # Vercel Deployment (Auto-set by Vercel)
   NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=auto_set_by_vercel
   ```

4. **Environment Variables Reference**

   **Required Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database connection
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-side database operations
   - `GEMINI_API_KEY` - AI features (workout plans, food analysis)

   **Payment Processing (Required for Pro features):**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` & `STRIPE_SECRET_KEY` - Stripe payment processing
   - `STRIPE_PRICE_MONTHLY_ID` & `STRIPE_PRICE_YEARLY_ID` - Subscription pricing
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification

   **Optional Enhancements:**
   - **Hero Images**: `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` & `NEXT_PUBLIC_PIXABAY_API_KEY`
   - **Monitoring**: `NEXT_PUBLIC_SENTRY_DSN` for error tracking
   - **Analytics**: `NEXT_PUBLIC_UMAMI_WEBSITE_ID` for privacy-focused analytics
   - **SEO**: `NEXT_PUBLIC_BASE_URL` & `GOOGLE_SITE_VERIFICATION`

5. **Set up the database**
   ```bash
   # Run the nutrition schema setup
   npm run seed:nutrition
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
ai-form-coach/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── coach/             # AI form coaching interface
│   │   ├── nutrition/         # Nutrition tracking pages
│   │   ├── history/           # Workout history
│   │   ├── account/           # User account management
│   │   └── api/               # API routes
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility libraries
│   │   ├── pose/             # MediaPipe pose detection
│   │   ├── validators/       # Exercise form validation
│   │   ├── nutrition/        # Nutrition tracking logic
│   │   └── supabase/         # Database client
│   ├── ui/                    # UI components and design system
│   └── types/                 # TypeScript type definitions
├── supabase/                  # Database schema and functions
├── public/                    # Static assets and images
└── scripts/                   # Utility scripts
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router and Turbopack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **MediaPipe** for on-device pose detection
- **Web Speech API** for voice coaching

### Backend
- **Supabase** for authentication and database
- **PostgreSQL** with custom functions and triggers
- **Row Level Security (RLS)** for data protection
- **Edge Functions** for serverless operations
- **Google Gemini AI** for workout plan generation
- **Unsplash & Pixabay APIs** for dynamic hero images

### Development Tools
- **ESLint** for code linting
- **Vitest** for testing
- **Puppeteer** for automated screenshots
- **TypeScript** for type safety

## 📱 Usage

### 🏠 Home Page Experience
1. **Discover Features**: Auto-swiping carousel showcases AI capabilities
2. **See Social Proof**: View user testimonials and success stats
3. **Quick Start**: Click "Start Free Workout" for immediate access
4. **Learn Process**: 3-step guide shows how the AI coaching works

### 🎯 AI Form Coaching
1. Navigate to the **Coach** page from header or hero CTA
2. Select your exercise (squats, push-ups, or planks)
3. Position yourself in the camera view for optimal detection
4. Start your workout and receive real-time form feedback
5. View your session summary with detailed progress analytics

### 🥗 Smart Nutrition Tracking
1. Go to the **Nutrition** page from the main navigation
2. Use **AI Camera** to scan food or **Add Food** to search manually
3. Set your daily goals in the **Goals Panel** with macro targets
4. Use the date navigator to track progress over time
5. Monitor macro progress with visual rings and protein advisory

### 🗓️ AI Workout Plans
1. Navigate to the **Plans** page from header navigation
2. Browse **Featured Plans** or click **Generate AI Plan**
3. Complete the quiz-style wizard for personalized recommendations
4. Select and activate plans to add to **My Plans**
5. Follow daily workouts with readiness-based adjustments

### 📊 Health Monitoring & Readiness
1. Access **Health** page from navigation or Coach sidebar
2. Connect health data (Apple Health, Google Fit, Health Connect)
3. Complete daily readiness assessments for optimal training
4. View readiness dashboard with health insights and trends
5. Get smart workout recommendations based on your metrics

### 💰 Pricing & Support
1. Check **Pricing** page for subscription options and features
2. Visit **FAQ** page for common questions and detailed answers
3. Access **Account** page when signed in for profile management
4. View **History** page for complete workout and nutrition tracking

## 🗄️ Database Schema

### Core Tables
- **`profiles`** - User profile information and preferences
- **`sessions`** - Workout session data with pose tracking
- **`foods`** - Comprehensive nutritional database with AI recognition
- **`meals`** - Daily meal records with macro calculations
- **`meal_items`** - Individual food items in meals with quantities
- **`user_plans`** - Personal workout plans with AI-generated content
- **`plan_templates`** - Featured workout programs and templates
- **`nutrition_goals`** - Daily calorie and macro targets with streaks
- **`progression`** - Workout progression tracking with readiness scores
- **`health_baselines`** - Personal health metrics and baseline values

### Advanced Features
- **`workout_targets`** - Recommended workout parameters based on progression
- **Row Level Security (RLS)** - Secure data access policies
- **Materialized views** - Optimized nutrition and progress summaries
- **Database triggers** - Automatic calculations and data consistency
- **JSONB storage** - Flexible plan data and health metrics storage

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Generate mobile screenshots
npm run screenshots
```

## 📊 Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run seed         # Seed workout data
npm run seed:nutrition # Seed nutrition data

# Quality Assurance
npm run screenshots  # Generate mobile screenshots
npm run demo         # View component demo
```

## 🎨 Design System & UI/UX

The application features a world-class design system with:

### ✨ Modern Design Patterns
- **Diagonal slash layout** with unique asymmetric positioning
- **Rainbow text animations** for dynamic visual effects
- **Glass morphism effects** with backdrop blur and transparency
- **Gradient overlays** and smooth color transitions
- **Auto-swiping carousel** with interactive navigation
- **Curved section separators** using SVG for smooth transitions

### 🎯 Professional Visual Elements
- **Consistent color palette** with green-blue-purple gradient themes
- **Fluid typography** with gradient text effects and proper hierarchy
- **Professional imagery** from Unsplash with optimized loading states
- **Hover animations** with scale effects and shadow enhancements
- **Floating elements** with ping, pulse, and bounce animations
- **Responsive breakpoints** optimized for all screen sizes

### 🚀 Performance & Accessibility
- **Hardware-accelerated animations** using CSS transforms
- **Accessible components** with proper ARIA labels and keyboard navigation
- **Smooth transitions** that respect reduced motion preferences
- **Optimized loading states** with shimmer effects and progress indicators
- **Error handling** with graceful fallbacks for all external resources
- **SEO optimized** with proper meta tags and semantic HTML

### 🖼️ Professional Image System
- **High-quality fitness imagery** from Unsplash API
- **Optimized loading** with Next.js Image component
- **Error handling** with local fallbacks
- **Responsive sizing** for all device types
- **Professional presentation** with rounded corners and shadows

## 🔒 Privacy & Security

- **On-device processing** - Video never leaves your device
- **Row Level Security** - Users can only access their own data
- **Encrypted connections** - All data transmission is secure
- **No video storage** - Pose detection happens in real-time only
- **GDPR compliant** - Full data control and export capabilities

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe** for pose detection capabilities
- **Supabase** for backend infrastructure
- **Next.js** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

For support, email support@aiformcoach.com or join our Discord community.

---

**Built with ❤️ for fitness enthusiasts who want to train smarter, not harder.**