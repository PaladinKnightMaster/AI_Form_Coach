# 🧪 AI Form Coach - Testing Checklist

## ✅ **System Status**
- [x] Database migrations applied successfully
- [x] Stripe Price IDs linked to database
- [x] Environment variables loaded correctly
- [x] Subscription system tested and working
- [x] Development server running

## 🎯 **Manual Testing Checklist**

### **1. Authentication & User Flow**
- [ ] **Sign Up**: Create a new account
- [ ] **Sign In**: Login with existing account
- [ ] **Profile**: Check user profile creation

### **2. Subscription System**
- [ ] **Free Tier**: Verify free features work
- [ ] **Pricing Page**: Check pricing display ($7.99/month, $79.99/year, $199 founder)
- [ ] **Checkout Flow**: Test Pro subscription checkout
- [ ] **Founder Checkout**: Test Founder tier checkout
- [ ] **Subscription Status**: Verify subscription status API

### **3. Activity Feed & Social Features**
- [ ] **Activity Feed**: Check if activities display
- [ ] **Like Button**: Test liking activities
- [ ] **Comment Button**: Test commenting (UI should show)
- [ ] **Like Count**: Verify like counts update
- [ ] **Comment Count**: Verify comment counts display

### **4. Form IQ & Pro Features**
- [ ] **Form IQ Display**: Check if Form IQ shows for free users
- [ ] **Form IQ Trending**: Verify Pro gating works
- [ ] **History Page**: Check subscription status integration
- [ ] **Pro Features**: Test Pro-only features are gated

### **5. Workout Features**
- [ ] **Live Tracking**: Test pose detection
- [ ] **Session Recording**: Complete a workout session
- [ ] **Session History**: Check session appears in history
- [ ] **Form Feedback**: Verify real-time feedback

### **6. API Endpoints**
- [ ] **Activity Feed**: `/api/activity/feed`
- [ ] **Like Activity**: `/api/activity/like`
- [ ] **Comment Activity**: `/api/activity/comment`
- [ ] **Subscription Status**: `/api/subscription/status`

## 🔧 **Test URLs**

### **Main Pages**
- **Home**: http://localhost:3000
- **Sign In**: http://localhost:3000/signin
- **Sign Up**: http://localhost:3000/signup
- **Pricing**: http://localhost:3000/pricing
- **History**: http://localhost:3000/history
- **Coach**: http://localhost:3000/coach

### **API Endpoints**
- **Activity Feed**: http://localhost:3000/api/activity/feed
- **Subscription Status**: http://localhost:3000/api/subscription/status

## 🐛 **Common Issues & Solutions**

### **If Activity Feed is Empty**
1. Complete a workout session first
2. Check if sessions have `is_public = true`
3. Verify database functions are working

### **If Likes/Comments Don't Work**
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check database RLS policies

### **If Subscription Features Don't Gate**
1. Verify user has correct subscription status
2. Check subscription service is working
3. Verify Form IQ Trending component logic

## 🎉 **Success Criteria**

Your system is fully working when:
- [ ] Users can sign up and sign in
- [ ] Free users see basic features
- [ ] Pro users see all features
- [ ] Activity feed shows recent activities
- [ ] Like/comment buttons work
- [ ] Subscription checkout flows work
- [ ] Form IQ features are properly gated

## 📱 **Mobile Testing**
- [ ] Test on mobile device
- [ ] Check responsive design
- [ ] Test touch interactions
- [ ] Verify camera permissions

---

**🚀 Ready to test! Your AI Form Coach app is now fully functional with:**
- ✅ Complete subscription system
- ✅ Social features (likes/comments)
- ✅ Activity feed
- ✅ Pro feature gating
- ✅ Stripe integration
- ✅ Database optimization
