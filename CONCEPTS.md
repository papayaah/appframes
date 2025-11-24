# ScreensStudio - Key Concepts

## Understanding Canvas Size vs Device Frame

ScreensStudio has two independent settings that work together to create your mockups:

### 1. Canvas Size (Export Dimensions)

**Location**: Layout tab → Canvas Size dropdown

**What it is**: The actual dimensions of your exported image, based on App Store and Google Play Store requirements.

**Examples**:
- iOS: iPhone 6.5" → Exports as 1242×2688 pixels
- iOS: iPad Pro 12.9" → Exports as 2048×2732 pixels
- Android: Phone → Exports as 1080×1920 pixels

**Why it matters**: 
- App stores require specific dimensions for screenshots
- This determines the exact size of your final PNG file
- The visible canvas boundary shows this size

**When to change it**:
- When submitting to different app stores
- When targeting different device categories (phone vs tablet)
- When you need specific export dimensions

---

### 2. Device Frame (Visual Mockup)

**Location**: Device tab → Select from device list

**What it is**: The visual frame/mockup that wraps around your screenshot for presentation.

**Examples**:
- iPhone 14 Pro → Shows notch and rounded corners
- Pixel 7 → Shows punch-hole camera
- MacBook Pro → Shows laptop frame with notch

**Why it matters**:
- Makes your screenshots look professional
- Shows context of which device the app runs on
- Purely visual - doesn't affect export dimensions

**When to change it**:
- To match your target device aesthetic
- To show different device styles in marketing
- To create variety in your screenshots

---

## How They Work Together

### Example 1: iPhone App Store Screenshot

```
Canvas Size: iOS: iPhone 6.5" (1242×2688)
Device Frame: iPhone 14 Pro
Result: A 1242×2688 image with an iPhone 14 Pro frame inside
```

### Example 2: Android Play Store Screenshot

```
Canvas Size: Android: Phone (1080×1920)
Device Frame: Pixel 7
Result: A 1080×1920 image with a Pixel 7 frame inside
```

### Example 3: iPad Marketing Material

```
Canvas Size: iOS: iPad Pro 12.9" (2048×2732)
Device Frame: iPad Pro
Result: A 2048×2732 image with an iPad Pro frame inside
```

---

## Common Workflows

### Workflow 1: App Store Submission
1. Go to **Layout tab**
2. Select **Canvas Size** based on store requirements
3. Go to **Device tab**
4. Select matching **Device Frame** for visual appeal
5. Add your screenshots
6. Export

### Workflow 2: Marketing Materials
1. Choose **Canvas Size** based on where you'll use it
2. Choose **Device Frame** that looks best
3. Adjust composition and styling
4. Export

### Workflow 3: Multi-Platform App
1. Create one mockup with iOS canvas size + iPhone frame
2. Export
3. Change to Android canvas size + Pixel frame
4. Export
5. Now you have both versions!

---

## Visual Guide

```
┌─────────────────────────────────────┐
│  Canvas (Export Dimensions)         │  ← Set in Layout tab
│  1242 × 2688 pixels                 │
│                                     │
│    ┌─────────────────────┐         │
│    │  Device Frame       │         │  ← Set in Device tab
│    │  (iPhone 14 Pro)    │         │
│    │                     │         │
│    │  [Your Screenshot]  │         │
│    │                     │         │
│    │                     │         │
│    └─────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

---

## FAQ

**Q: Why are these separate?**
A: Because you might want to export at iPad dimensions (2048×2732) but show an iPhone frame inside for comparison shots.

**Q: Do I need to match them?**
A: Not necessarily! You can mix and match. For example, use iPhone canvas size with any phone frame you like.

**Q: What if my device frame is too big for the canvas?**
A: Use the Composition Scale slider to make the frame smaller so it fits within the canvas boundaries.

**Q: Can I change canvas size after adding screenshots?**
A: Yes! Your screenshots and composition will remain, just the canvas dimensions will change.

**Q: Which should I set first?**
A: Start with Canvas Size (based on where you'll use the image), then choose a Device Frame that looks good.

**Q: Does the device frame affect export quality?**
A: No, only the Canvas Size affects the export dimensions. The device frame is just visual styling.

---

## Quick Reference

| Setting | Location | Purpose | Affects Export |
|---------|----------|---------|----------------|
| Canvas Size | Layout tab | Export dimensions | ✅ Yes |
| Device Frame | Device tab | Visual frame style | ❌ No |
| Composition | Layout tab | Layout arrangement | ❌ No |
| Composition Scale | Layout tab | Frame size | ❌ No |
| Background Color | Layout tab | Canvas background | ✅ Yes |
| Caption | Layout tab | Text overlay | ✅ Yes |

---

## Tips

1. **Always check the canvas boundary** - The visible border shows exactly what will be exported
2. **Use Composition Scale** - Adjust frame size to fit within canvas
3. **Mix and match freely** - Canvas size and device frame are independent
4. **Check OUTPUT dimensions** - Top-right of header shows current export size
5. **Test different combinations** - Try different frames with the same canvas size

---

Need more help? Check USAGE_GUIDE.md for step-by-step instructions.
