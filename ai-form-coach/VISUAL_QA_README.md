# Visual QA & Mobile Testing Guide

This guide explains how to perform visual QA and mobile testing for AI Form Coach.

## Quick Access

- **Component Demo**: [http://localhost:3000/demo](http://localhost:3000/demo)
- **Main Landing**: [http://localhost:3000/](http://localhost:3000/)
- **Auth Pages**: [http://localhost:3000/signin](http://localhost:3000/signin)

## Component Demo Route

Visit `/demo` to access the interactive component demo with the following sections:

### 1. Buttons & Badges
- All button variants (primary, secondary, ghost)
- Button states (normal, disabled, with icons)
- Badge variations and colors
- Icon library showcase

### 2. Header States  
- Live header component with mobile menu
- Authentication state variations
- Theme toggle functionality

### 3. Footer
- Complete footer layout
- Link organization and accessibility

### 4. Auth Cards
- Sign in and sign up forms
- Responsive card layouts
- Form field styling

### 5. Landing Sections
- Social proof band with testimonials
- Pricing section with toggle
- FAQ with expandable items
- Final CTA section

### 6. Mobile Breakpoints
- Breakpoint reference guide
- Testing instructions
- Key pages to verify

## Mobile Testing Process

### Manual Testing (Recommended)

1. **Open Developer Tools**
   ```
   - Chrome/Edge: F12 or Ctrl+Shift+I
   - Firefox: F12 or Ctrl+Shift+I
   - Safari: Cmd+Option+I
   ```

2. **Enable Device Toolbar**
   ```
   - Chrome/Edge: Ctrl+Shift+M (Cmd+Shift+M on Mac)
   - Firefox: Ctrl+Shift+M (Cmd+Shift+M on Mac)
   ```

3. **Test Common Breakpoints**

   | Device | Width | Height | Notes |
   |--------|-------|--------|-------|
   | iPhone SE | 375px | 667px | Smallest modern iPhone |
   | iPhone SE (Landscape) | 667px | 375px | Landscape testing |
   | iPhone 11 Pro | 414px | 896px | Current iPhone standard |
   | iPad | 768px | 1024px | Tablet portrait |
   | iPad (Landscape) | 1024px | 768px | Tablet landscape |
   | Desktop | 1280px | 800px | Standard desktop |

### Automated Screenshots (Optional)

1. **Install Dependencies**
   ```bash
   npm install --save-dev puppeteer
   ```

2. **Run Screenshot Script**
   ```bash
   # Make sure dev server is running first
   npm run dev

   # In another terminal
   node scripts/screenshot-mobile.js
   ```

3. **View Results**
   Screenshots will be saved to `screenshots/` directory with naming pattern:
   ```
   landing_mobile-portrait.png
   signin_tablet-landscape.png
   etc.
   ```

## Key Areas to Test

### Header Menu (Critical)
- [ ] Menu button appears on mobile (< 768px)
- [ ] Drawer slides in from right
- [ ] All navigation links work
- [ ] Close button and backdrop work
- [ ] Menu items stack properly
- [ ] Theme toggle functions in mobile menu

### Responsive Layout
- [ ] Hero section stacks on mobile
- [ ] Feature grid adjusts columns
- [ ] Pricing cards stack vertically
- [ ] Footer columns collapse appropriately
- [ ] Text remains readable at all sizes

### Touch Interactions
- [ ] Buttons have adequate touch targets (44px minimum)
- [ ] Form fields are easy to tap
- [ ] FAQ items expand/collapse smoothly
- [ ] Drawer menu slides smoothly

### Content Readability
- [ ] Headlines don't break awkwardly
- [ ] Body text has sufficient line height
- [ ] No horizontal scrolling required
- [ ] Images scale appropriately

## Seed Data for Testing

The app includes realistic seed data for visual testing:

### Testimonials
- 3 user testimonials with names and roles
- Realistic quotes about the product
- Avatar initials for visual consistency

### Social Proof
- Sample metrics (session minutes, reps counted, ROM improved)
- Scrolling testimonial band
- Company logos for trust signals

### FAQ Content
- 6 common questions with clear answers
- Expandable/collapsible interface
- Keyboard navigation support

## Accessibility Testing

While testing visually, also verify:

- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards
- [ ] Text is readable without images
- [ ] Interactive elements have proper labels
- [ ] Skip links work correctly

## Browser Testing Matrix

Test on these browsers for comprehensive coverage:

| Browser | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Chrome | ✓ | ✓ | ✓ |
| Safari | ✓ | ✓ | ✓ |
| Firefox | - | ✓ | ✓ |
| Edge | - | ✓ | ✓ |

## Troubleshooting

### Screenshots Not Working
- Ensure dev server is running on port 3000
- Check that all pages load without errors
- Verify puppeteer installation: `npm list puppeteer`

### Mobile Menu Issues
- Check viewport meta tag in layout.tsx
- Verify Tailwind breakpoints are correct
- Test with actual devices when possible

### Layout Breaking
- Check for fixed widths that don't scale
- Verify grid/flexbox implementations
- Test with very long content

## Performance Notes

- Mobile devices have slower processors
- Test with throttled CPU in dev tools
- Verify smooth animations and transitions
- Check that images load efficiently

---

For questions about visual QA, check the component demo at `/demo` or refer to the design system in `src/ui/DS.tsx`.
