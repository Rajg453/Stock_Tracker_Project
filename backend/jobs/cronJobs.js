import cron from 'node-cron';
import https from 'https';
import http from 'http';

// This function will initialize all our cron jobs
export const initCronJobs = () => {
  console.log('Initializing cron jobs...');

  // Keep-alive job: Prevent free tier servers (like Render) from sleeping.
  // Free servers often sleep after 15 minutes of inactivity. 
  // We run this every 14 minutes. '*/14 * * * *' means "every 14 minutes".
  cron.schedule('*/14 * * * *', () => {
    // Render automatically provides RENDER_EXTERNAL_URL in production
    const backendUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    console.log(`[Keep-Alive] Pinging server at ${backendUrl} to keep it awake...`);

    // Choose http or https based on the URL
    const requestModule = backendUrl.startsWith('https') ? https : http;

    requestModule.get(backendUrl, (res) => {
      console.log(`[Keep-Alive] Ping successful, status code: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`[Keep-Alive] Ping failed:`, err.message);
    });
  });

  // You can add more cron jobs here as your project grows.
};
