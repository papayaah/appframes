# ScreensStudio - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install & Run

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. Add Your Screenshots

- **Drag & Drop**: Drop your app screenshots anywhere on the canvas
- **Click to Add**: Use the "NEW SCREEN" button at the bottom
- **Multiple Images**: Add multiple screenshots for different compositions

### 3. Customize & Export

- Choose a layout (Single, Dual, Stack, Triple, Fan)
- Adjust scale and positioning
- Add a caption
- Click "Export" to download

## 🎨 Key Features

### Layouts
- **Single**: One device frame
- **Dual**: Two devices side by side
- **Stack**: Overlapping devices
- **Triple**: Three devices in a row
- **Fan**: Three devices in a fan arrangement

### Customization Options
- **Composition Scale**: Adjust the overall size (50-100%)
- **Image Scale**: Zoom in/out on your screenshot
- **Pan X/Y**: Position your screenshot within the frame
- **Background Color**: Choose from preset colors
- **Caption**: Add text with custom positioning

### Device Frames
Currently supports iPhone-style frames with:
- Realistic notch design
- Power and volume buttons
- Premium shadows and gradients

## 💡 Tips

1. **High Quality Screenshots**: Use high-resolution images for best results
2. **Composition Scale**: Start at 85% for optimal canvas usage
3. **Multiple Screens**: Add 2-3 screenshots for dynamic compositions
4. **Caption Positioning**: Use sliders to position text perfectly
5. **Export**: Exports at 2x resolution for crisp images

## 🎯 Common Use Cases

- **App Store Screenshots**: Create professional store listings
- **Marketing Materials**: Generate promotional images
- **Portfolio**: Showcase your app designs
- **Social Media**: Share beautiful app previews
- **Documentation**: Create visual guides

## 🔧 Keyboard Shortcuts (Coming Soon)

- `Cmd/Ctrl + E`: Export
- `Cmd/Ctrl + Z`: Undo
- `Delete`: Remove selected screen

## 📱 Supported Formats

- PNG
- JPG/JPEG
- WebP
- GIF (static)

## 🎨 Customization

Edit `theme.ts` to customize colors and styling:

```typescript
export const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'md',
});
```

## 🐛 Troubleshooting

**Images not loading?**
- Check file format (PNG, JPG supported)
- Ensure file size is reasonable (<10MB)

**Export not working?**
- Make sure you have at least one screenshot added
- Try a different browser (Chrome/Firefox recommended)

**Layout looks off?**
- Adjust composition scale
- Try different device frame options

## 📚 Next Steps

- Explore all composition types
- Experiment with different background colors
- Try adding captions to your mockups
- Export and share your creations!

---

Built with ❤️ using React 19, Next.js 16, and Mantine 17
