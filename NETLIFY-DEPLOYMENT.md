# MAXVOLT Website - Netlify Deployment Guide

## ✅ Everything is Ready for Netlify!

Your website is fully configured and ready to deploy on Netlify. Follow these simple steps:

---

## Step 1: Prepare Your GitHub Repository

### Option A: Create New Repository
1. Go to https://github.com/new
2. Repository name: `maxvolt-website`
3. Add description: "MAXVOLT - Trusted Power Solutions Website"
4. Choose Public
5. Click "Create repository"

### Option B: Use Existing Repository
If you already have a repo, just update it with the maxvolt-website files.

---

## Step 2: Upload Files to GitHub

### Using Git (Command Line)
```bash
# Navigate to your project
cd maxvolt-website

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - MAXVOLT website"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/maxvolt-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Using GitHub Desktop
1. Open GitHub Desktop
2. Click "File" → "Add Local Repository"
3. Select maxvolt-website folder
4. Click "Publish repository"
5. Make it Public
6. Sync changes

### Using Web Upload
1. Go to your GitHub repository
2. Click "Add file" → "Upload files"
3. Drag and drop all files from maxvolt-website
4. Commit changes

---

## Step 3: Deploy on Netlify

### Step 3A: Connect Netlify to GitHub
1. Go to https://app.netlify.com
2. Sign up (free) with GitHub account
3. Authorize Netlify to access GitHub

### Step 3B: Create New Site
1. Click "New site from Git"
2. Choose "GitHub"
3. Select your GitHub account
4. Find and select "maxvolt-website" repository
5. Click "Deploy site"

### Step 3C: Configure Build Settings
**Netlify will auto-detect settings, but verify:**
- Build command: `(leave empty - no build needed)`
- Publish directory: `.` (root directory)
- These are already configured in `netlify.toml`

### Step 3D: Wait for Deployment
- Netlify will build and deploy automatically
- You'll see a status like: `yourname.netlify.app`
- Wait for green checkmark ✅

---

## Step 4: Get Your Free Domain

### Option A: Use Netlify Domain (Free)
1. Your site is live at: `yourname.netlify.app`
2. Share this URL immediately
3. No setup needed!

### Option B: Use Custom Domain (India-based)
1. Register domain from:
   - GoDaddy (₹200-800/year)
   - BigRock (₹199-499/year)
   - Namecheap ($200/year)

2. In Netlify dashboard:
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain
   - Follow DNS setup instructions

3. Update DNS in domain registrar with Netlify nameservers

---

## What's Already Configured

✅ **netlify.toml** - Complete Netlify configuration
✅ **Redirects** - All URLs work correctly
✅ **Security headers** - Added for protection
✅ **Caching rules** - Optimized for performance
✅ **HTTPS** - Automatic SSL certificate

---

## Key Files for Netlify

```
maxvolt-website/
├── netlify.toml              ← Netlify config (ALREADY SET UP)
├── index.html                ← Homepage
├── products/                 ← Product pages
├── css/styles.css            ← Styling
├── js/main.js                ← Functionality
├── data/products.json        ← Product data
└── assets/images/            ← Product images
```

---

## Netlify Features You Get

✅ **Free Hosting** - No monthly fees!
✅ **Automatic HTTPS** - SSL certificate included
✅ **Git Integration** - Auto-deploy on push
✅ **Global CDN** - Fast worldwide
✅ **Built-in Forms** - Form submissions
✅ **Email Notifications** - Get alerts on deploys
✅ **Custom Domain** - Point your own domain
✅ **99.9% Uptime** - Reliable hosting

---

## Testing Before Deploy

### Local Testing
```bash
# Start local server to test
python -m http.server 8000
# Visit: http://localhost:8000
```

### Verify Before Pushing
- [ ] Logo links to home (index.html)
- [ ] All product pages load
- [ ] WhatsApp numbers correct (7595941311)
- [ ] Email correct (maxvolt.power@gmail.com)
- [ ] Forms work
- [ ] Mobile responsive
- [ ] Marquee scrolls

---

## After Deployment

### Immediate Actions
1. ✅ Share URL: `yourname.netlify.app`
2. ✅ Test all pages on mobile
3. ✅ Test WhatsApp buttons
4. ✅ Test contact forms
5. ✅ Share on social media

### First Week
1. Setup Google Analytics (optional)
2. Setup Google Search Console
3. Submit sitemap to Google
4. Monitor analytics

### Ongoing Maintenance
1. Update products in `data/products.json`
2. Add product images to `assets/images/`
3. Push to GitHub
4. **Automatic redeploy on Netlify!**

---

## Updating Content After Deploy

### Easy Updates (No coding needed!)

**To update phone number:**
- Edit `index.html` and product pages
- Find `7595941311`
- Replace with new number
- Push to GitHub → Auto-deployed!

**To update products:**
- Edit `data/products.json`
- Add/remove/edit products
- Push to GitHub → Auto-deployed!

**To add product images:**
- Add images to `assets/images/`
- Reference in `data/products.json`
- Push to GitHub → Auto-deployed!

---

## Troubleshooting

### Deploy Failed
Check Netlify logs:
1. Go to deployment in Netlify dashboard
2. Click "Deploy log"
3. Look for error messages
4. Common fix: Clear browser cache and redeploy

### Links Not Working
- Ensure all file paths are correct
- Check file names (case-sensitive on Netlify)
- Use relative paths (e.g., `products/home-inverter-batteries.html`)

### Forms Not Submitting
- Update your Formspree ID in code
- Or setup Netlify Forms (built-in)

### Images Not Loading
- Ensure images are in `assets/images/`
- Check file names match in `products.json`
- Verify image formats are supported

---

## Your Deployment Checklist

Before pushing to Netlify:
- [ ] Updated phone number to 7595941311
- [ ] Updated email to maxvolt.power@gmail.com
- [ ] Product data updated in `data/products.json`
- [ ] All required product images added
- [ ] Logo links to index.html
- [ ] Tested all pages locally
- [ ] WhatsApp buttons work
- [ ] Contact form works
- [ ] Mobile responsive verified
- [ ] Marquee scrolls correctly

---

## Support URLs

- **Netlify Help:** https://docs.netlify.com
- **GitHub Help:** https://docs.github.com
- **Domain Registration:** 
  - GoDaddy: https://godaddy.com
  - BigRock: https://bigrock.com
  - Namecheap: https://namecheap.com

---

## Quick Commands

```bash
# Clone repository locally
git clone https://github.com/YOUR_USERNAME/maxvolt-website.git

# Make changes, then push
git add .
git commit -m "Update: description of changes"
git push

# Netlify auto-deploys! ✨
```

---

## You're Ready! 🚀

Your MAXVOLT website will be live on Netlify in minutes!

**Next step:** Push to GitHub → Watch it deploy → Share the link!

---

**Questions?**
- Check Netlify dashboard
- Review GitHub repo files
- Test locally first before pushing

**Website:** yourdomain.netlify.app
**Email:** maxvolt.power@gmail.com
**Phone:** +91 7595941311
**WhatsApp:** 7595941311

---

**MAXVOLT - Trusted Power Always** ⚡
