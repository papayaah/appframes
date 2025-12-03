# Implementation Plan

- [ ] 1. Set up routing structure for landing page
  - Move current app/page.tsx to app/app/page.tsx to make room for landing page
  - Create new app/page.tsx that renders the LandingPage component
  - Update any internal navigation links to point to /app instead of /
  - Configure Next.js to use static generation for the landing page route
  - _Requirements: 8.1_

- [ ] 2. Create landing page component structure
  - Create components/Landing directory
  - Create LandingPage.tsx as main container component
  - Set up basic layout with sections for hero, demo, features, and CTA
  - Import and apply Mantine theme for consistent styling
  - _Requirements: 1.1_

- [ ] 3. Implement HeroSection component
  - Create HeroSection.tsx component
  - Add headline: "Create Beautiful App Screenshots"
  - Add subtitle explaining App Store and Google Play screenshot creation
  - Add primary CTA button "Try AppFrames" that navigates to /app
  - Add secondary button "See Demo" that scrolls to demo section
  - Style with Mantine components (Title, Text, Button, Group)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 3.1 Write unit test for HeroSection rendering
  - Test that headline and subtitle are displayed
  - Test that CTA buttons are present
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Implement FeaturesSection component
  - Create FeaturesSection.tsx component
  - Create FeatureCard.tsx component for individual features
  - Define at least 3 key features with icons and descriptions
  - Use Tabler icons for feature icons
  - Implement responsive grid layout using Mantine Grid
  - Include sample screenshots showing different device frames
  - Showcase at least 2 different composition styles in examples
  - _Requirements: 1.4, 7.1, 7.2, 7.3_

- [ ]* 4.1 Write unit test for FeaturesSection
  - Test that minimum 3 features are displayed
  - Test that sample screenshots are present
  - _Requirements: 1.4, 7.1_

- [ ] 5. Implement DemoSection container component
  - Create DemoSection.tsx component
  - Add section heading and description
  - Set up local state for demoImage (string | null)
  - Set up local state for selectedFrame (default: 'iphone-14-pro')
  - Set up local state for backgroundColor (default: '#F9FAFB')
  - Add CTA button to open main application
  - Add text explaining additional features available in full app
  - _Requirements: 2.1, 4.1, 4.4_

- [ ]* 5.1 Write unit test for DemoSection initialization
  - Test that demo initializes with empty state
  - Test that default frame is set
  - Test that CTA button is present
  - _Requirements: 2.1, 4.1_

- [ ] 6. Implement DemoCanvas component
  - Create DemoCanvas.tsx component
  - Accept props: image, deviceFrame, backgroundColor, onImageDrop
  - Implement drag and drop event handlers (onDragOver, onDragEnter, onDragLeave, onDrop)
  - Validate dropped files are images (JPEG, PNG, WebP, GIF)
  - Convert dropped File to blob URL using URL.createObjectURL()
  - Display instructional text when canvas is empty
  - Reuse existing DeviceFrame component from components/AppFrames/DeviceFrame
  - Pass image and deviceFrame to DeviceFrame component
  - Apply backgroundColor to canvas container
  - Clean up blob URLs on component unmount
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 6.1 Write property test for image file acceptance
  - **Property 1: Image file acceptance**
  - **Validates: Requirements 2.2**

- [ ]* 6.2 Write property test for image scaling and positioning
  - **Property 2: Image scaling and positioning**
  - **Validates: Requirements 2.3**

- [ ]* 6.3 Write property test for visual feedback on image addition
  - **Property 3: Visual feedback on image addition**
  - **Validates: Requirements 2.5**

- [ ] 7. Implement DemoControls component
  - Create DemoControls.tsx component
  - Accept props: selectedFrame, backgroundColor, onFrameChange, onBackgroundColorChange
  - Create device frame selector with 3-4 popular options (iPhone 14 Pro, iPad Pro, Samsung Galaxy)
  - Implement frame selector using Mantine SegmentedControl or Select
  - Create background color picker using Mantine ColorPicker
  - Add labels and descriptions for controls
  - Limit device frame options to curated subset
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 7.1 Write property test for device frame update
  - **Property 4: Device frame update**
  - **Validates: Requirements 3.2**

- [ ]* 7.2 Write property test for background color update
  - **Property 5: Background color update**
  - **Validates: Requirements 3.5**

- [ ] 8. Implement CTASection component
  - Create CTASection.tsx component
  - Add final call-to-action with compelling copy
  - Add button to navigate to /app
  - Style with Mantine components for visual prominence
  - _Requirements: 4.1, 4.2_

- [ ] 9. Implement responsive layout for mobile devices
  - Add responsive breakpoints (mobile < 768px, tablet 768-1024px, desktop > 1024px)
  - Make HeroSection stack vertically on mobile with appropriate spacing
  - Adapt DemoCanvas size to fit mobile viewport width
  - Arrange FeaturesSection in single column layout on mobile
  - Ensure all interactive elements have minimum 44×44px touch targets
  - Test layout at various viewport widths
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 9.1 Write property test for responsive layout adaptation
  - **Property 6: Responsive layout adaptation**
  - **Validates: Requirements 5.1**

- [ ]* 9.2 Write property test for mobile canvas sizing
  - **Property 7: Mobile canvas sizing**
  - **Validates: Requirements 5.3**

- [ ]* 9.3 Write property test for touch target sizing
  - **Property 8: Touch target sizing**
  - **Validates: Requirements 5.4**

- [ ] 10. Implement accessibility features
  - Add appropriate ARIA labels to all interactive elements
  - Implement visible focus indicators for keyboard navigation
  - Add descriptive alt text to all images
  - Provide keyboard-accessible file input as alternative to drag-drop
  - Ensure color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  - Use semantic HTML (proper heading hierarchy, nav, main, section elements)
  - Add role="region" to major sections with aria-labelledby
  - Implement skip links for screen reader users
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 10.1 Write property test for ARIA label presence
  - **Property 9: ARIA label presence**
  - **Validates: Requirements 6.1**

- [ ]* 10.2 Write property test for focus indicator visibility
  - **Property 10: Focus indicator visibility**
  - **Validates: Requirements 6.2**

- [ ]* 10.3 Write property test for image alt text presence
  - **Property 11: Image alt text presence**
  - **Validates: Requirements 6.3**

- [ ]* 10.4 Write property test for color contrast compliance
  - **Property 12: Color contrast compliance**
  - **Validates: Requirements 6.5**

- [ ] 11. Optimize images and assets
  - Use next/image for all static images
  - Provide multiple image sizes for responsive display
  - Use WebP format with JPEG/PNG fallback
  - Compress and optimize all images
  - Ensure images have appropriate dimensions for display size
  - _Requirements: 7.3, 8.2_

- [ ]* 11.1 Write property test for image optimization
  - **Property 13: Image optimization**
  - **Validates: Requirements 8.2**

- [ ] 12. Implement performance optimizations
  - Configure Next.js static generation for landing page
  - Implement code splitting for demo section components
  - Use dynamic imports for heavy components
  - Preload critical fonts with font-display: swap
  - Minimize number of network requests
  - Prioritize above-the-fold content rendering
  - Separate landing page bundle from main app bundle
  - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [ ] 13. Implement navigation between landing page and main app
  - Add navigation from landing page to /app route
  - Update Header component to handle both landing and app contexts
  - Ensure smooth transition between routes
  - Optionally preserve demo image when navigating to main app (if feasible)
  - _Requirements: 4.2, 4.3_

- [ ] 14. Add error handling for demo interactions
  - Handle invalid file types with user-friendly error message
  - Handle large files (>10MB) with warning
  - Handle file read errors gracefully
  - Implement fallback for device frame rendering failures
  - Add retry option for failed image displays
  - _Requirements: 2.2_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
