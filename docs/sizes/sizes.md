# App Store Screenshot Size Requirements

**Last Updated:** November 24, 2024

This directory contains comprehensive documentation for screenshot requirements across different app stores.

---

## Quick Links

- [Apple App Store Requirements](./apple-app-store.md)
- [Google Play Store Requirements](./google-play-store.md)

---

## Overview

### Apple App Store
- **Exact dimensions required** for each device category
- Specific sizes for iPhone, iPad, and Apple Watch
- Up to 10 screenshots per device size
- See [apple-app-store.md](./apple-app-store.md) for complete details

### Google Play Store
- **Flexible dimensions** within specified ranges
- Aspect ratio requirements (16:9 or 9:16)
- Different requirements for Phone, Tablet, Chromebook, and Android XR
- See [google-play-store.md](./google-play-store.md) for complete details

---

## Quick Reference

### Apple App Store (Exact Dimensions)

| Device | Portrait | Landscape |
|--------|----------|-----------|
| iPhone 6.5" | 1242×2688, 1284×2778 | 2688×1242, 2778×1284 |
| iPad 13" | 2064×2752, 2048×2732 | 2752×2064, 2732×2048 |
| Watch Ultra 3 | 422×514, 410×502 | - |
| Watch Series 11 | 416×496 | - |
| Watch Series 9 | 396×484 | - |
| Watch Series 6 | 368×448 | - |
| Watch Series 3 | 312×390 | - |

### Google Play Store (Flexible Ranges)

| Category | Aspect Ratio | Dimension Range | File Size |
|----------|--------------|-----------------|-----------|
| Phone | 16:9 or 9:16 | 320px - 3,840px | 8 MB |
| 7" Tablet | 16:9 or 9:16 | 320px - 3,840px | 8 MB |
| 10" Tablet | 16:9 or 9:16 | 1,080px - 7,680px | 8 MB |
| Chromebook | 16:9 or 9:16 | 1,080px - 7,680px | 8 MB |
| Android XR | 16:9 or 9:16 | 720px - 7,680px | 15 MB |

**Recommended Google Play Dimensions:**
- Phone: 1080×1920 (portrait), 1920×1080 (landscape)
- Tablet: 1600×2560 (portrait), 2560×1600 (landscape)

---

## Key Differences

### Apple App Store
✅ Exact dimensions required  
✅ Device-specific sizes  
✅ Up to 10 screenshots per size  
✅ PNG or JPEG format  
❌ Less flexible  

### Google Play Store
✅ Flexible dimension ranges  
✅ Aspect ratio based (16:9 or 9:16)  
✅ 2-8 screenshots (phone), up to 8 (others)  
✅ PNG or JPEG format  
✅ More flexible  

---

## Using ScreensStudio

### For Apple App Store
1. Go to **Layout** tab
2. Select exact dimension from **Canvas Size** dropdown
3. All Apple dimensions are pre-configured
4. Export is ready for immediate submission

### For Google Play Store
1. Choose a common resolution (e.g., 1080×1920 for phone)
2. Ensure aspect ratio is 16:9 or 9:16
3. Verify dimensions are within allowed range
4. Export and verify file size is under limit

---

## Best Practices

### Both Platforms
- Use high-resolution screenshots
- Show actual app functionality
- Localize for different markets
- Keep UI elements readable
- Update screenshots with app updates

### Apple-Specific
- Provide screenshots for all required device sizes
- First 3 screenshots appear on installation sheets
- Use exact dimensions specified

### Google-Specific
- Minimum 2 screenshots required for phone
- Use common resolutions (1080p, 2K)
- Avoid device frames in screenshots
- Ensure 16:9 or 9:16 aspect ratio

---

## File Format Guidelines

### Supported Formats
- **PNG:** Best for UI screenshots with text
- **JPEG:** Good for photographic content

### File Size Limits
- **Apple:** No specific limit (keep reasonable)
- **Google Phone/Tablet/Chromebook:** 8 MB max
- **Google Android XR:** 15 MB max

### Color Space
- Use RGB color space
- No alpha channels (transparency) for Apple
- Standard sRGB recommended

---

## Workflow Tips

### Multi-Platform Submission
1. Create mockup in ScreensStudio
2. Export Apple dimensions first (exact sizes)
3. Export Google dimensions (flexible, use common sizes)
4. Organize exports by platform and device
5. Upload to respective stores

### Batch Export Strategy
1. Design one mockup with all screenshots
2. Change canvas size for each required dimension
3. Export each size
4. Repeat for landscape if needed
5. Keep organized folder structure

---

## Common Resolutions

### Portrait (9:16)
- 1080 × 1920 (Full HD) - Google Phone ✓
- 1242 × 2688 - Apple iPhone 6.5" ✓
- 1284 × 2778 - Apple iPhone 6.5" ✓
- 1440 × 2560 (2K) - Google Phone ✓
- 2048 × 2732 - Apple iPad ✓
- 2064 × 2752 - Apple iPad ✓

### Landscape (16:9)
- 1920 × 1080 (Full HD) - Google Phone ✓
- 2560 × 1440 (2K) - Google Tablet ✓
- 2688 × 1242 - Apple iPhone 6.5" ✓
- 2732 × 2048 - Apple iPad ✓
- 2752 × 2064 - Apple iPad ✓
- 2778 × 1284 - Apple iPhone 6.5" ✓

---

## Troubleshooting

### Screenshot Rejected by Apple
- Verify exact dimensions match requirements
- Check file format (PNG or JPEG)
- Ensure no transparency
- Verify content shows actual app

### Screenshot Rejected by Google
- Check aspect ratio is 16:9 or 9:16
- Verify dimensions are within allowed range
- Ensure file size is under limit
- Check minimum screenshot count (2 for phone)

---

## Updates and Changes

This documentation is current as of **November 24, 2024**.

Store requirements may change. Always verify current requirements:
- **Apple:** [App Store Connect](https://appstoreconnect.apple.com)
- **Google:** [Play Console](https://play.google.com/console)

---

## Contributing

If you notice outdated information or have suggestions:
1. Check official store documentation
2. Update the relevant markdown file
3. Update the "Last Updated" date
4. Document the changes in CHANGELOG.md

---

## Additional Resources

### Official Documentation
- [Apple App Store Connect Guidelines](https://developer.apple.com/app-store/product-page/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### ScreensStudio Documentation
- [README.md](../../README.md) - Getting started
- [USAGE_GUIDE.md](../../USAGE_GUIDE.md) - How to use
- [CONCEPTS.md](../../CONCEPTS.md) - Canvas size vs device frame
- [APP_STORE_SIZES.md](../../APP_STORE_SIZES.md) - Apple sizes quick reference

---

**Note:** These requirements are documented as of November 24, 2024. Always verify current requirements before submission.
