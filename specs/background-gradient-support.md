# Background Gradient Support

## Overview

Currently, the canvas background color picker in `Sidebar.tsx` only supports **solid colors** (plus transparent). This spec adds **gradient colors** to the selection, allowing users to choose from preset gradients or create custom gradients for canvas backgrounds.

## Current state

- **Location**: `components/AppFrames/Sidebar.tsx` (lines ~383-409)
- **Current swatches**: `['transparent', '#E5E7EB', '#F3F4F6', '#DBEAFE', '#E0E7FF', '#FCE7F3', '#FEF3C7', '#D1FAE5']`
- **Storage**: `CanvasSettings.backgroundColor` is a `string` (currently hex colors or `'transparent'`)
- **Rendering**: Applied directly as CSS `backgroundColor` in `Canvas.tsx` and export surfaces

## Goals

- Add **gradient presets** to the background color swatch grid
- Support **CSS linear-gradient strings** in `backgroundColor` field
- Render gradient swatches visually in the picker (showing the gradient, not just a solid color)
- **Allow custom solid color selection** (color picker beyond presets)
- **Allow custom gradient creation** (gradient editor with color stops, angle, type)
- Ensure gradients work in:
  - Main canvas rendering
  - Thumbnails (`ScreensPanel`)
  - Store preview (`StorePreviewRenderer`)
  - Export (`ExportService`)

## Proposed gradient presets

### Horizontal gradients
- `linear-gradient(to right, #667eea, #764ba2)` — Purple to violet
- `linear-gradient(to right, #f093fb, #f5576c)` — Pink to red
- `linear-gradient(to right, #4facfe, #00f2fe)` — Blue to cyan
- `linear-gradient(to right, #43e97b, #38f9d7)` — Green to teal

### Vertical gradients
- `linear-gradient(to bottom, #fa709a, #fee140)` — Pink to yellow
- `linear-gradient(to bottom, #6a11cb, #2575fc)` — Purple to blue
- `linear-gradient(to bottom, #ff0844, #ffb199)` — Red to peach

### Diagonal gradients
- `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` — Diagonal purple
- `linear-gradient(45deg, #f093fb 0%, #f5576c 100%)` — Diagonal pink

### Radial gradients (optional)
- `radial-gradient(circle, #667eea, #764ba2)` — Radial purple

## UX design

### Swatch grid layout

The current 2×4 grid (8 swatches) can be expanded to accommodate gradients:

**Option A: Expand grid** (recommended)
- Keep existing 8 solid colors
- Add 8 gradient presets
- Add "+ Custom" button to open color/gradient editor
- Use a 4×4 grid (or scrollable if needed)
- Group visually: first row = transparent + solid colors, remaining rows = gradients + custom button

**Option B: Replace some solids with gradients**
- Keep 4-5 solid colors
- Add 3-4 gradient presets
- Add "+ Custom" button
- Maintain 2×4 grid

**Option C: Tabbed interface**
- "Solid" tab: current solid colors + custom solid picker
- "Gradient" tab: gradient presets + custom gradient editor
- More scalable but requires more UI changes

### Gradient swatch rendering

Each gradient swatch should:
- Display the actual gradient visually (not a placeholder color)
- Use the same 32×32px size and 8px border radius as solid swatches
- Show selection border (3px solid #228be6) when active
- Use `backgroundImage` CSS property to render the gradient

Example:
```tsx
<Box
  style={{
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundImage: 'linear-gradient(to right, #667eea, #764ba2)',
    cursor: 'pointer',
    border: isSelected ? '3px solid #228be6' : '1px solid #dee2e6',
  }}
/>
```

## Technical design

### Data model

**No schema change needed**: `CanvasSettings.backgroundColor` already accepts any string. We'll store gradient strings directly:

```typescript
// Current (solid)
backgroundColor: '#E5E7EB'

// New (gradient)
backgroundColor: 'linear-gradient(to right, #667eea, #764ba2)'
```

### Rendering

**Canvas rendering** (`Canvas.tsx`):
- Currently uses `backgroundColor: screenSettings.backgroundColor`
- CSS automatically handles gradient strings in `backgroundColor` or `backgroundImage`
- **Update**: Use `backgroundImage` for gradients, `backgroundColor` for solid colors

**Detection logic**:
```typescript
const isGradient = (color: string): boolean => {
  return color.startsWith('linear-gradient') || color.startsWith('radial-gradient');
};

// In render:
style={{
  ...(isGradient(backgroundColor)
    ? { backgroundImage: backgroundColor }
    : { backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor }),
}}
```

**Export** (`ExportService.tsx`, `AppFrames.tsx`):
- html-to-image should capture gradients correctly if they're in the DOM as `backgroundImage`
- Test to ensure gradients export properly to PNG/JPG

### Swatch array structure

Update the swatch array to include both solid colors and gradients:

```typescript
const BACKGROUND_PRESETS = [
  // Solid colors (existing)
  'transparent',
  '#E5E7EB',
  '#F3F4F6',
  '#DBEAFE',
  '#E0E7FF',
  '#FCE7F3',
  '#FEF3C7',
  '#D1FAE5',
  // New gradients
  'linear-gradient(to right, #667eea, #764ba2)',
  'linear-gradient(to right, #f093fb, #f5576c)',
  'linear-gradient(to right, #4facfe, #00f2fe)',
  'linear-gradient(to right, #43e97b, #38f9d7)',
  'linear-gradient(to bottom, #fa709a, #fee140)',
  'linear-gradient(to bottom, #6a11cb, #2575fc)',
  'linear-gradient(to bottom, #ff0844, #ffb199)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
] as const;
```

## Implementation plan

### Phase 1: Preset gradients

1. **Update `Sidebar.tsx`**
   - Expand `BACKGROUND_PRESETS` array to include gradient strings
   - Update swatch rendering to detect gradients and use `backgroundImage` for gradients
   - Adjust grid layout (4×4 or scrollable) if needed

2. **Update rendering logic**
   - `Canvas.tsx`: Detect gradients and use `backgroundImage` instead of `backgroundColor`
   - `ScreensPanel.tsx`: Same detection logic for thumbnails
   - `StorePreviewRenderer.tsx`: Same for preview page
   - `ExportService.tsx`: Verify gradients export correctly

3. **Validation**
   - Test that existing projects with solid colors still work
   - Test gradient rendering in all contexts (canvas, thumbnails, export)
   - Test transparent + gradient combinations (shouldn't conflict)

### Phase 2: Custom solid color picker

4. **Add custom color picker**
   - Create `CustomColorPicker.tsx` component (or use Mantine `ColorInput` in Popover)
   - Add "+ Custom" button to swatch grid
   - Open color picker on click
   - Apply selected color to `backgroundColor`

### Phase 3: Custom gradient editor

5. **Create gradient editor component**
   - Create `GradientEditor.tsx` component
   - Implement gradient state management (type, angle, color stops)
   - Implement color stop UI (add/remove, drag to reposition, color picker per stop)
   - Implement angle control (slider or input)
   - Implement live preview
   - Generate CSS gradient string from state

6. **Integrate gradient editor**
   - Add "+ Custom Gradient" button or tab in custom color modal
   - Open gradient editor on click
   - Parse existing gradient string if editing (extract stops, angle, type)
   - Apply generated gradient string to `backgroundColor`

7. **Gradient string parsing** (for editing existing gradients)
   - Parse CSS gradient string to extract:
     - Type (linear vs radial)
     - Angle (for linear)
     - Color stops (color + position)
   - Populate editor state from parsed data

## Custom color selection

### Custom solid color picker

**UI**: Add a "+ Custom" button or "Custom Color" option in the swatch grid that opens a color picker.

**Implementation**:
- Use Mantine's `ColorInput` component (already used in `TextStylePanel.tsx`)
- Allow hex, rgb, hsl input
- Show live preview of selected color
- Apply immediately when color is selected

**Example UI**:
```tsx
<Popover>
  <Popover.Target>
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '2px dashed #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <IconPlus size={16} />
    </Box>
  </Popover.Target>
  <Popover.Dropdown>
    <ColorInput
      value={customColor}
      onChange={setCustomColor}
      format="hex"
      swatches={COLOR_PRESETS}
    />
  </Popover.Dropdown>
</Popover>
```

### Custom gradient editor

**UI**: Modal or popover with gradient editor controls.

**Features**:
- **Gradient type selector**: Linear (horizontal, vertical, diagonal) vs Radial
- **Color stops**: 
  - Add/remove color stops (minimum 2, maximum 8)
  - Drag stops to reposition along gradient line
  - Click stop to change color (color picker)
  - Show percentage/position for each stop
- **Angle control** (for linear gradients):
  - Slider or input for angle (0-360deg)
  - Visual preview of angle direction
- **Live preview**: Large preview area showing the gradient
- **Apply/Cancel buttons**: Apply saves to `backgroundColor`, Cancel closes without changes

**Gradient editor component structure**:
```tsx
interface GradientEditorProps {
  initialGradient?: string; // CSS gradient string to edit
  onApply: (gradient: string) => void;
  onCancel: () => void;
}

interface ColorStop {
  color: string; // hex color
  position: number; // 0-100 percentage
}

interface GradientState {
  type: 'linear' | 'radial';
  angle: number; // 0-360 for linear
  stops: ColorStop[];
}
```

**Gradient editor UI layout**:
```
┌─────────────────────────────────┐
│  Custom Gradient                │
├─────────────────────────────────┤
│  [Linear] [Radial]              │
│                                 │
│  ┌─────────────────────────┐  │
│  │   Preview Area           │  │
│  │   (large gradient)       │  │
│  └─────────────────────────┘  │
│                                 │
│  Angle: [slider] 135°          │
│                                 │
│  Color Stops:                  │
│  [●] #667eea ──── 0%           │
│  [●] #764ba2 ──── 100%         │
│  [+ Add Stop]                  │
│                                 │
│  [Cancel]  [Apply]             │
└─────────────────────────────────┘
```

**Gradient string generation**:
```typescript
function generateGradientString(state: GradientState): string {
  const stops = state.stops
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  if (state.type === 'linear') {
    return `linear-gradient(${state.angle}deg, ${stops})`;
  } else {
    return `radial-gradient(circle, ${stops})`;
  }
}
```

### Integration with swatch grid

**Option 1: "+ Custom" button in grid**
- Add a "+ Custom" swatch button at the end of the grid
- Clicking opens a modal with tabs: "Solid Color" and "Gradient"
- User selects type, configures, then applies

**Option 2: Separate buttons**
- "+ Custom Color" button (opens color picker)
- "+ Custom Gradient" button (opens gradient editor)

**Option 3: Context menu**
- Right-click on any swatch to "Edit" or "Create Custom"
- Or long-press on mobile

## Edge cases

- **Transparent + gradient**: Transparent should remain a separate option (checkerboard pattern). Gradients can include `transparent` as a color stop if desired.
- **Invalid gradient strings**: Validate gradient strings before applying. Fall back to last valid gradient or default solid color if invalid.
- **Export compatibility**: Verify html-to-image handles gradients correctly (may need to ensure gradients are in DOM before export).
- **Custom color persistence**: Custom colors/gradients are stored in `backgroundColor` but not added to presets automatically (future: "Save to presets" option).

## Future enhancements

- **Save custom to presets**: Allow users to save custom gradients to their preset library
- **Gradient presets library**: Expand preset collection based on usage
- **Gradient animation** (optional): Subtle animated gradients for previews (not for export)
- **Gradient templates**: Pre-built gradient templates (sunset, ocean, forest, etc.)
