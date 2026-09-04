SHADOW LOGIC RUNNER
===================

Use this ONLY on a private VPS/VM/container that you control.

WHY:
Netlify hosts your Shadow Logic website and functions, but an always-on Discord bot needs a
persistent computer/server.

BASIC SETUP:
1. Upload this runner folder to the VPS.
2. Install Node.js 20+.
3. Open a terminal in this folder.
4. Run:
   npm install

5. Create an environment variable:
   RUNNER_TOKEN=make-a-very-long-private-token

6. Optional:
   PORT=8787

7. Start:
   npm start

8. Put the runner behind HTTPS (for example with a reverse proxy).
9. In Netlify Environment Variables add:
   SHADOW_RUNNER_URL=https://your-runner-domain.example
   SHADOW_RUNNER_TOKEN=the-same-token-you-used-on-the-runner

10. Redeploy the Netlify website.

IMPORTANT SECURITY:
- Do not run the runner as root.
- Use a dedicated VPS/container.
- Firewall the VPS.
- Use HTTPS.
- Keep RUNNER_TOKEN secret.
- Only run code you trust.
- Store Discord tokens in secure environment variables on the runner, not in public project files.
