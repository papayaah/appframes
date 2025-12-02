# Design Document

## Overview

The landing page serves as the entry point for AppFrames, providing new users with an immediate understanding of the product's value proposition through a combination of marketing content and an interactive demo. The page follows a single-page layout with distinct sections: hero, interactive demo, features showcase, and call-to-action.

The interactive demo is a simplified, self-contained version of the core canvas functionality, allowing users to drag an image and see it displayed within a device frame. This provides immediate hands-on experience without requiring navigation to the full application or account creation.

## Architecture

### Component Structure

```
app/
├── landing/
│   └── page.tsx                    # Landing page route
components/
├── Landing/
│   ├── LandingPage.tsx             # Main container component
│   ├── HeroSection.tsx             # Hero with headline and CTA
│   ├── DemoSection.tsx             # Interactive demo container
│   ├── DemoCanvas.tsx              # Simplified canvas with drag-drop
│   ├── DemoControls.tsx            # Device frame and color controls
│   ├── FeaturesSection.tsx         # Features showcase grid
│   ├── FeatureCard.tsx             # Individual feature display
│   └── CTASection.tsx              # Final call-to-action
```

### Routing Strategy

The landing page will be accessible at the root path `/`, with the main application moved to `/app`. This requires:

1. Moving current `app/page.tsx` to `app/app/page.tsx`
2. Creating new `app/page.tsx` for landing page
3. Updating navigation links throughout the application

### State Management

The demo section maintains minimal local state:
- `demoImage: string | null` - Currently displayed image (base64 or blob URL)
- `selectedFrame: string` - Selected device frame type (subset of available frames)
- `backgroundColor: string` - Canvas background color

No global state or persistence is required for the demo. The full app maintains its existing state management through FramesContext.

## Components and Interfaces

### LandingPage Component

Main container that orchestrates all sections.

```typescript
export function LandingPage() {
  return (
    <Box>
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <CTASection />
    </Box>
  );
}
```

### HeroSection Component

Displays headline, subtitle, and primary CTA.

```typescript
interface HeroSectionProps {
  // No props - static content
}

export function HeroSection() {
  // Renders:
  // - Headline: "Create Beautiful App Screenshots"
  // - Subtitle: "Professional device mockups for App Store and Google Play"
  // - Primary button: "Try AppFrames" -> navigates to /app
  // - Secondary button: "See Demo" -> scrolls to demo section
}
```

### DemoSection Component

Container for the interactive demo with controls.

```typescript
interface DemoSectionProps {
  // No props - manages own state
}

export function DemoSection() {
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('iphone-14-pro');
  const [backgroundColor, setBackgroundColor] = useState<string>('#F9FAFB');

  // Renders:
  // - Section heading
  // - DemoCanvas with current state
  // - DemoControls for customization
  // - CTA button to open full app
}
```

### DemoCanvas Component

Simplified canvas that accepts drag-drop and displays image in device frame.

```typescript
interface DemoCanvasProps {
  image: string | null;
  deviceFrame: string;
  backgroundColor: string;
  onImageDrop: (file: File) => void;
}

export function DemoCanvas({
  image,
  deviceFrame,
  backgroundColor,
  onImageDrop,
}: DemoCanvasProps) {
  // Handles:
  // - Drag and drop events
  // - File validation (images only)
  // - Converting File to displayable URL
  // - Rendering DeviceFrame component
  // - Empty state with instructions
}
```

### DemoControls Component

Provides UI controls for customizing the demo.

```typescript
interface DemoControlsProps {
  selectedFrame: string;
  backgroundColor: string;
  onFrameChange: (frame: string) => void;
  onBackgroundColorChange: (color: string) => void;
}

export function DemoControls({
  selectedFrame,
  backgroundColor,
  onFrameChange,
  onBackgroundColorChange,
}: DemoControlsProps) {
  // Renders:
  // - Device frame selector (limited to 3-4 popular options)
  // - Background color picker
  // - Labels and descriptions
}
```

### FeaturesSection Component

Grid layout showcasing key features with icons.

```typescript
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeaturesSection() {
  const features: Feature[] = [
    {
      icon: <IconDeviceMobile />,
      title: 'Multiple Device Frames',
      description: 'iPhone, iPad, Android, and more',
    },
    // ... more features
  ];

  // Renders grid of FeatureCard components
}
```

## Data Models

### DemoState

```typescript
interface DemoState {
  image: string | null;           // Base64 or blob URL
  deviceFrame: string;             // Device frame identifier
  backgroundColor: string;         // Hex color code
}
```

### Feature

```typescript
interface Feature {
  icon: React.ReactNode;           // Tabler icon component
  title: string;                   // Feature name
  description: string;             // Brief description
}
```

### DeviceFrameOption

```typescript
interface DeviceFrameOption {
  id: string;                      // Frame identifier (e.g., 'iphone-14-pro')
  label: string;                   // Display name (e.g., 'iPhone 14 Pro')
  thumbnail?: string;              // Optional preview image
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Image file acceptance

*For any* valid image file (JPEG, PNG, WebP, GIF), when dropped onto the demo canvas, the system should accept the file and display it within the device frame.
**Validates: Requirements 2.2**

### Property 2: Image scaling and positioning

*For any* image with arbitrary dimensions, when displayed in the demo canvas, the image should be scaled and positioned such that it fits within the device frame boundaries without overflow.
**Validates: Requirements 2.3**

### Property 3: Visual feedback on image addition

*For any* successful image drop operation, the system should provide visual feedback (such as removing the empty state or showing the image) confirming the action.
**Validates: Requirements 2.5**

### Property 4: Device frame update

*For any* device frame selection from the available options, when selected, the canvas display should update to show the new frame style while preserving the current image.
**Validates: Requirements 3.2**

### Property 5: Background color update

*For any* valid color value (hex, rgb, or named color), when the background color is changed, the canvas background should update immediately to reflect the new color.
**Validates: Requirements 3.5**

### Property 6: Responsive layout adaptation

*For any* viewport width below the mobile breakpoint (768px), the landing page should display a responsive layout with appropriately stacked content.
**Validates: Requirements 5.1**

### Property 7: Mobile canvas sizing

*For any* mobile viewport width, the demo canvas should adapt its size to fit within the viewport width without horizontal scrolling.
**Validates: Requirements 5.3**

### Property 8: Touch target sizing

*For all* interactive elements (buttons, links, inputs) on mobile viewports, the touch target size should meet or exceed 44×44 pixels as per accessibility guidelines.
**Validates: Requirements 5.4**

### Property 9: ARIA label presence

*For all* interactive elements (buttons, links, form controls), the rendered HTML should include appropriate ARIA labels or accessible names.
**Validates: Requirements 6.1**

### Property 10: Focus indicator visibility

*For all* focusable elements, when focused via keyboard navigation, a visible focus indicator should be present with sufficient contrast.
**Validates: Requirements 6.2**

### Property 11: Image alt text presence

*For all* img elements rendered on the landing page, the element should include a non-empty alt attribute.
**Validates: Requirements 6.3**

### Property 12: Color contrast compliance

*For all* text and interactive elements, the color contrast ratio between foreground and background should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 6.5**

### Property 13: Image optimization

*For all* images loaded on the landing page, the images should use optimized formats (WebP, AVIF, or appropriately compressed JPEG/PNG) and have dimensions appropriate for their display size.
**Validates: Requirements 8.2**

## Error Handling

### File Upload Errors

**Invalid File Type**
- User drops a non-image file onto demo canvas
- System should reject the file silently or show a brief error message
- Canvas should remain in its current state

**File Too Large**
- User drops an extremely large image file (>10MB)
- System should show a warning message
- Optionally: attempt to load anyway with performance warning

**File Read Errors**
- Browser fails to read the dropped file
- System should show an error message: "Unable to load image. Please try again."
- Canvas should remain in previous state

### Navigation Errors

**Failed Navigation to Main App**
- User clicks CTA button but navigation fails
- System should retry navigation or show error message
- Fallback: provide direct link to /app route

### Rendering Errors

**Device Frame Rendering Failure**
- Selected device frame fails to render
- System should fall back to default frame (iPhone 14 Pro)
- Log error for debugging

**Image Display Failure**
- Dropped image fails to display in canvas
- System should show error state with retry option
- Clear the failed image from state

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and component behavior:

**Component Rendering**
- HeroSection renders with correct headline and CTA buttons
- DemoSection initializes with empty state and default frame
- FeaturesSection displays minimum required features (3+)
- DemoControls renders frame selector and color picker

**User Interactions**
- Clicking "Try AppFrames" button navigates to /app
- Clicking "See Demo" scrolls to demo section
- Selecting a device frame updates the canvas
- Changing background color updates the canvas

**Edge Cases**
- Empty demo canvas displays instructional text (Requirement 2.4)
- Keyboard-accessible file input is present (Requirement 6.4)
- Static generation is enabled for landing page (Requirement 8.1)
- Demo section loads minimal JavaScript (Requirement 8.3)
- Above-the-fold content is prioritized (Requirement 8.4)
- Network requests are minimized (Requirement 8.5)

**Responsive Behavior**
- Hero section stacks vertically on mobile (Requirement 5.2)
- Features section uses single column on mobile (Requirement 5.5)

**Content Presence**
- Hero section includes subtitle (Requirement 1.2)
- Demo section has button to open main app (Requirement 4.1)
- Demo section includes text about additional features (Requirement 4.4)
- Features section includes sample screenshots (Requirement 7.1)
- Samples showcase multiple composition styles (Requirement 7.2)

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript property testing library). Each test will run a minimum of 100 iterations.

**Image Handling Properties**
- Property 1: Image file acceptance - Generate random valid image files and verify all are accepted
- Property 2: Image scaling and positioning - Generate images with random dimensions and verify proper scaling
- Property 3: Visual feedback - Generate random image drops and verify feedback is provided

**UI Update Properties**
- Property 4: Device frame update - Generate random frame selections and verify display updates
- Property 5: Background color update - Generate random valid colors and verify immediate updates

**Responsive Properties**
- Property 6: Responsive layout - Generate random mobile viewport widths and verify layout adaptation
- Property 7: Mobile canvas sizing - Generate random mobile widths and verify canvas fits
- Property 8: Touch target sizing - Generate random interactive elements and verify minimum sizes

**Accessibility Properties**
- Property 9: ARIA labels - Generate random interactive elements and verify ARIA presence
- Property 10: Focus indicators - Generate random focusable elements and verify visibility
- Property 11: Alt text - Generate random images and verify alt attributes
- Property 12: Color contrast - Generate random color combinations and verify contrast ratios

**Performance Properties**
- Property 13: Image optimization - Generate random images and verify format/size optimization

### Integration Testing

Integration tests will verify the interaction between components:

**Demo Workflow**
- User drops image → image displays → user changes frame → frame updates
- User drops image → user changes color → color updates
- User completes demo → clicks CTA → navigates to main app

**Navigation Flow**
- Landing page loads → user clicks "Try AppFrames" → navigates to /app
- Landing page loads → user clicks "See Demo" → scrolls to demo section

**State Preservation**
- User drops image in demo → navigates to main app → image is preserved (if feasible)

### Accessibility Testing

**Automated Accessibility Checks**
- Run axe-core or similar tool on rendered landing page
- Verify no critical accessibility violations
- Check keyboard navigation flow

**Manual Testing Checklist**
- Tab through all interactive elements
- Verify focus indicators are visible
- Test with screen reader (VoiceOver/NVDA)
- Verify color contrast in all states

### Performance Testing

**Lighthouse Metrics**
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1

**Bundle Analysis**
- Landing page JavaScript bundle < 100KB (gzipped)
- Demo section code-split from main app
- Images use next/image optimization

## Implementation Notes

### Reusing Existing Components

The demo will reuse the existing `DeviceFrame` component from the main app with minimal modifications:
- Import DeviceFrame from `components/AppFrames/DeviceFrame`
- Use a simplified subset of device frame options
- Remove features not needed for demo (pan, zoom, frame positioning)
- Maintain visual consistency with main app

### Device Frame Subset

Limit demo to 3-4 popular device frames:
- iPhone 14 Pro (default)
- iPad Pro
- Samsung Galaxy
- MacBook Pro (optional)

This provides variety while keeping the demo simple and fast-loading.

### Image Handling

For the demo, use simple client-side image handling:
- Convert dropped File to blob URL using `URL.createObjectURL()`
- No OPFS or IndexedDB storage needed
- No thumbnail generation required
- Clean up blob URLs on component unmount

### Styling Consistency

Use the same Mantine theme and design tokens as the main app:
- Import theme from `theme.ts`
- Use consistent colors, spacing, and typography
- Maintain brand consistency across landing and app

### Performance Optimizations

**Static Generation**
- Use Next.js static generation for landing page
- Pre-render all content at build time
- No server-side rendering needed

**Code Splitting**
- Lazy load demo section components
- Separate landing page bundle from main app
- Use dynamic imports for heavy components

**Image Optimization**
- Use next/image for all static images
- Provide multiple sizes for responsive images
- Use WebP format with JPEG fallback

**Font Loading**
- Preload critical fonts
- Use font-display: swap
- Subset fonts to reduce file size

### Accessibility Implementation

**Semantic HTML**
- Use proper heading hierarchy (h1, h2, h3)
- Use semantic elements (nav, main, section, article)
- Use button elements for clickable actions

**ARIA Attributes**
- Add aria-label to icon-only buttons
- Use aria-describedby for form inputs
- Add role="region" to major sections with aria-labelledby

**Keyboard Navigation**
- Ensure all interactive elements are keyboard accessible
- Implement proper focus management
- Add skip links for screen reader users

**Screen Reader Support**
- Provide descriptive alt text for images
- Use aria-live regions for dynamic content updates
- Test with VoiceOver (macOS) and NVDA (Windows)

### Mobile Considerations

**Touch Interactions**
- Increase touch target sizes to 44×44px minimum
- Add appropriate spacing between interactive elements
- Support both drag-drop and file input for image upload

**Responsive Breakpoints**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile-Specific Features**
- Simplified demo controls for smaller screens
- Reduced device frame sizes for mobile viewports
- Touch-optimized color picker

### Browser Compatibility

**Target Browsers**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Fallbacks**
- Provide file input fallback for drag-drop
- Use CSS feature detection for modern features
- Polyfill critical features if needed

### Analytics Considerations

Track key user interactions:
- Landing page views
- Demo interactions (image drops, frame changes)
- CTA button clicks
- Navigation to main app
- Time spent on landing page

Use privacy-respecting analytics (e.g., Plausible, Fathom) or configure Google Analytics with appropriate privacy settings.
