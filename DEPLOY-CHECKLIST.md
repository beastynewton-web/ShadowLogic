# Shadow Logic deployment checklist

- [ ] Extracted the ZIP
- [ ] Uploaded the project to GitHub/GitLab or connected it to Netlify
- [ ] Netlify build command is `npm run build`
- [ ] Netlify publish directory is `dist`
- [ ] Added `SHADOW_SETUP_KEY` in Netlify Environment Variables
- [ ] Added `SHADOW_JWT_SECRET` in Netlify Environment Variables
- [ ] `SHADOW_JWT_SECRET` is at least 32 characters
- [ ] Redeployed after adding the variables
- [ ] `/api/health` says both required variables are configured
- [ ] Opened `/setup.html`
- [ ] Created the owner account
- [ ] Signed in at `/`
- [ ] Created a test project
- [ ] Created and saved a test file

## If setup still fails

Open:

`https://YOUR-SITE.netlify.app/api/health`

If `jwtConfigured` or `setupKeyConfigured` is false, fix the Netlify environment variables and redeploy.

Then go to:

**Netlify -> Logs -> Functions**

Open the `setup` function log and check the most recent request.
