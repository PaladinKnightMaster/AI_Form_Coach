# AI Form Coach 💪

A comprehensive fitness application that combines AI-powered form coaching with nutrition tracking. Perfect your workout form in real-time and track your nutrition goals all in one place.

![AI Form Coach](https://img.shields.io/badge/AI-Form%20Coach-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)

## ✨ Features

### 🤖 AI Form Coaching
- **Real-time pose detection** using MediaPipe for squats, push-ups, and planks
- **Instant form feedback** with voice coaching cues
- **Automatic rep counting** with accuracy tracking
- **Form quality scoring** and progress visualization
- **Auto-pause functionality** when you step out of view
- **Privacy-first design** - all processing happens on your device

### 🥗 Nutrition Tracking
- **Smart food database** with thousands of verified nutritional entries
- **Macro tracking** with visual progress rings (calories, protein, carbs, fat)
- **Quick meal logging** with one-click food addition
- **Daily nutrition overview** with meal breakdown
- **Date navigation** to track progress over time
- **Real-time macro calculations** as you add foods

### 🎯 Additional Features
- **Progress tracking** with detailed charts and analytics
- **Workout history** with session summaries
- **Export functionality** for data portability
- **Offline support** with data synchronization
- **Responsive design** for mobile and desktop
- **Dark/light theme** support
- **Accessibility features** with keyboard navigation

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
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**
   ```bash
   # Run the nutrition schema setup
   npm run seed:nutrition
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
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

### Development Tools
- **ESLint** for code linting
- **Vitest** for testing
- **Puppeteer** for automated screenshots
- **TypeScript** for type safety

## 📱 Usage

### AI Form Coaching
1. Navigate to the **Coach** page
2. Select your exercise (squats, push-ups, or planks)
3. Position yourself in the camera view
4. Start your workout and receive real-time feedback
5. View your session summary and progress

### Nutrition Tracking
1. Go to the **Nutrition** page
2. Click **"Add Food"** to search and log meals
3. Use the date navigator to track different days
4. Monitor your macro progress with visual rings
5. View detailed meal breakdowns

## 🗄️ Database Schema

### Core Tables
- **`profiles`** - User profile information
- **`sessions`** - Workout session data
- **`foods`** - Nutritional database
- **`meals`** - Daily meal records
- **`meal_items`** - Individual food items in meals

### Views & Functions
- **`daily_totals`** - Materialized view for nutrition summaries
- **Macro calculation triggers** - Automatic nutrition calculations
- **Progress tracking functions** - Analytics and reporting

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

## 🎨 Design System

The application uses a custom design system with:
- **Consistent color palette** with dark/light theme support
- **Fluid typography** that scales across devices
- **Accessible components** with proper ARIA labels
- **Smooth animations** that respect reduced motion preferences
- **Responsive breakpoints** for all screen sizes

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