# ScreensStudio - Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps.

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Deploy"

That's it! Vercel will automatically detect Next.js and configure everything.

### Option 2: Netlify

1. **Build the app**
   ```bash
   yarn build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `.next` folder
   - Or connect your GitHub repo

### Option 3: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile
   COPY . .
   RUN yarn build
   EXPOSE 3000
   CMD ["yarn", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t screenstudio .
   docker run -p 3000:3000 screenstudio
   ```

### Option 4: Static Export

For static hosting (GitHub Pages, S3, etc.):

1. **Update next.config.mjs**
   ```javascript
   const nextConfig = {
     output: 'export',
   };
   ```

2. **Build**
   ```bash
   yarn build
   ```

3. **Deploy the `out` folder** to any static host

## Environment Variables

No environment variables required for basic functionality.

Optional:
- `NEXT_PUBLIC_APP_URL` - Your app URL for metadata

## Build Configuration

### Production Build
```bash
yarn build
yarn start
```

### Build Optimization
The app is already optimized with:
- Static generation where possible
- Automatic code splitting
- Image optimization
- Minification and compression

## Performance Tips

1. **Enable Compression**
   - Most hosting providers enable this by default
   - For custom servers, use gzip/brotli

2. **CDN**
   - Use a CDN for static assets
   - Vercel/Netlify include this automatically

3. **Caching**
   - Set appropriate cache headers
   - Next.js handles this automatically

## Monitoring

### Vercel Analytics
Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Google Analytics
Add to `app/layout.tsx`:
```typescript
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Netlify
1. Go to Domain Settings
2. Add custom domain
3. Configure DNS

## SSL/HTTPS

All recommended hosting providers include free SSL certificates:
- Vercel: Automatic
- Netlify: Automatic
- Cloudflare Pages: Automatic

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
yarn install
yarn build
```

### Images Not Loading
- Check image paths are relative
- Ensure images are in `public` folder
- Verify MIME types are correct

### Slow Performance
- Enable compression
- Use a CDN
- Check bundle size: `yarn analyze`

## Post-Deployment Checklist

- [ ] App loads correctly
- [ ] Drag & drop works
- [ ] Export functionality works
- [ ] All layouts render properly
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking (if applicable)

## Scaling

For high traffic:
1. Use Vercel Pro or Enterprise
2. Enable edge caching
3. Consider serverless functions for API routes
4. Use a CDN for static assets

## Backup & Recovery

1. **Code**: Keep in Git repository
2. **User Data**: Currently client-side only
3. **Future**: Consider adding cloud storage for saved projects

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Netlify: [netlify.com/support](https://netlify.com/support)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

---

Happy deploying! 🚀
