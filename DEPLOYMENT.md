# MAXVOLT Website - Deployment Guide

## Quick Start

### Local Development
1. Navigate to the maxvolt-website folder
2. Run a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
3. Visit `http://localhost:8000` in your browser

### Testing Checklist
- [ ] All product pages load correctly
- [ ] Product filters work
- [ ] WhatsApp buttons trigger correctly
- [ ] Quote form submits
- [ ] Mobile view is responsive
- [ ] Images load properly
- [ ] Navigation links work
- [ ] Scroll animations function

---

## Production Deployment

### Option 1: Shared Hosting (Recommended for Starting)

**Steps:**
1. Get FTP credentials from your hosting provider
2. Connect via FTP client (FileZilla, WinSCP)
3. Upload entire `maxvolt-website` folder to `public_html`
4. Update WhatsApp number in `js/main.js`
5. Add product images to `assets/images/`
6. Test the live site

**Providers:**
- Hostinger (₹200-400/month) - includes free email
- Bluehost ($2.95-12.99/month)
- SiteGround ($2.99-7.99/month) - higher performance
- GoDaddy ($2.99-7.99/month)

### Option 2: Cloud Platform (Best Performance)

**Netlify (Free/₹0 to start)**
1. Push code to GitHub
2. Connect Netlify to your GitHub repo
3. Deploy automatically on push
4. Custom domain setup (₹99-500/year)

**Vercel (Free/₹0 to start)**
1. Connect GitHub repo
2. Auto-deploys on every push
3. CDN included
4. Excellent performance

**AWS/Google Cloud (₹5000+/month)**
- Best for high traffic
- Auto-scaling
- Professional CDN

### Option 3: Self-Hosted VPS (₹200-1000/month)

**Using Ubuntu + Nginx:**
1. Rent VPS from Linode, DigitalOcean, or Contabo
2. SSH into server
3. Install Nginx: `sudo apt install nginx`
4. Upload files: `scp -r maxvolt-website user@your-ip:/var/www/`
5. Configure Nginx
6. Setup SSL with Let's Encrypt
7. Point domain to your VPS IP

---

## Domain & Email Setup

### 1. Domain Registration
- Register `.in` domain from:
  - GoDaddy (₹200-800/year)
  - BigRock (₹199-499/year)
  - NameCheap (₹200-400/year)
  - Google Domains (₹700/year)

**Recommended:** `maxvoltbatteries.in` or `maxvoltpower.in`

### 2. Email Setup
Option A: Free using domain registrar (1-3 emails)
- `info@maxvoltbatteries.in`
- `sales@maxvoltbatteries.in`
- `support@maxvoltbatteries.in`

Option B: Professional email service
- Google Workspace (₹300-600/user/month) - Recommended
- Zoho Mail (Free - 5 users)
- Outlook for Business (₹400-600/user/month)

### 3. SSL Certificate (HTTPS)
- **Free:** Let's Encrypt (via hosting panel)
- **Automatic:** Most hosts include free SSL

Always use HTTPS for security and SEO.

---

## Pre-Launch Checklist

### Content
- [ ] Update all WhatsApp numbers
- [ ] Update phone numbers
- [ ] Update email address
- [ ] Update company address
- [ ] Add actual product images
- [ ] Update product prices
- [ ] Review all product descriptions
- [ ] Check all product specifications

### Technical
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iPhone, Android devices
- [ ] Verify mobile responsiveness
- [ ] Check all links work
- [ ] Validate HTML/CSS
- [ ] Test WhatsApp integration
- [ ] Test contact form submission
- [ ] Ensure fast loading times

### SEO
- [ ] Meta descriptions on all pages
- [ ] Keywords optimized
- [ ] Sitemap created
- [ ] robots.txt configured
- [ ] Google Analytics setup
- [ ] Google Search Console setup
- [ ] Schema markup added

### Security
- [ ] SSL/HTTPS enabled
- [ ] Security headers set
- [ ] Rate limiting on forms
- [ ] SPAM protection (reCAPTCHA optional)
- [ ] Database connections secure
- [ ] No sensitive data in code

---

## Post-Launch Optimization

### Week 1
1. Monitor website performance
2. Check analytics for errors
3. Respond to initial inquiries
4. Gather feedback

### Month 1
1. Optimize images based on actual usage
2. Monitor Core Web Vitals
3. Fix any reported bugs
4. Add customer testimonials

### Ongoing
1. Update product pricing monthly
2. Add new products quarterly
3. Blog posts for SEO (2-4 per month)
4. Monitor analytics and adjust strategy

---

## Performance Optimization

### Image Optimization
```bash
# Install ImageOptim (Mac) or use online tools
# Reduce image sizes by 50-70% without quality loss
```

### Cache Strategy
1. Browser caching enabled
2. CDN for static assets
3. Minified CSS/JS

### Speed Targets
- Desktop Lighthouse: 90+
- Mobile Lighthouse: 80+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

---

## Analytics & Monitoring

### Google Analytics 4 Setup
1. Create GA4 property
2. Add tracking code to index.html
3. Monitor:
   - Traffic sources
   - User behavior
   - Conversion funnel
   - Product views
   - Quote requests

### Tools to Use
- Google Analytics 4 (Free)
- Google Search Console (Free)
- Hotjar (Heatmaps - ₹0-500/month)
- Screaming Frog (SEO crawl - Free)

---

## Regular Maintenance

### Weekly
- Check website is loading correctly
- Review new inquiries
- Monitor server status

### Monthly
- Update product prices
- Check for broken links
- Review analytics
- Backup database

### Quarterly
- Update content
- Check security
- Review SEO performance
- Add new products

### Annually
- Major feature updates
- Design refresh consideration
- Security audit
- Scale assessment

---

## Troubleshooting

### Site Not Loading
1. Check domain DNS settings
2. Verify hosting account active
3. Check file permissions (chmod 755)
4. Review error logs

### Slow Performance
1. Enable compression (.gzip)
2. Optimize images
3. Minimize CSS/JS
4. Use CDN
5. Upgrade hosting

### Forms Not Submitting
1. Check Formspree setup
2. Verify email configuration
3. Check browser console for errors
4. Test with different browser

### WhatsApp Not Opening
1. Verify WhatsApp number format (+91XXXXXXXXXX)
2. Test URL encoding
3. Check browser WhatsApp app access
4. Use desktop version

---

## Support

For technical issues:
1. Check documentation in SETUP.md
2. Review error logs
3. Test in different browser
4. Contact hosting support
5. Reach out to developer

## Budget Estimate (Year 1)

| Item | Cost |
|------|------|
| Domain | ₹200-800 |
| Hosting | ₹2,400-12,000 |
| Email | ₹0-3,600 |
| SSL | ₹0 (Free) |
| Analytics | ₹0 (Free) |
| CDN | ₹0-5,000 |
| Maintenance | ₹0-5,000 |
| **TOTAL** | **₹2,600-26,400** |

**Recommended Budget:** ₹5,000-10,000/year for solid setup

---

## Contact & Support

**MAXVOLT Website Support**
- For technical setup help
- For customization requests
- For new feature development

**Next Steps:**
1. Choose hosting provider
2. Register domain
3. Setup email
4. Deploy website
5. Monitor and optimize
6. Grow business!

---

**Built with ❤️ for MAXVOLT**
Trusted Power. Always. 🔋
