import Fastify from 'fastify';
import cron from 'node-cron';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// আপনার টার্গেট URL গুলোর লিস্ট (নিজের Render লিংক সহ)
const targetUrls = [
 'https://e-commerz-pos-cms.onrender.com',
  'https://arafshop-frontend.vercel.app/shop',
  'https://url-cron-jobs.onrender.com', // নিজের সার্ভারের লিংক 'https://e-commerz-pos-cms.onrender.com',
  'https://arafshop-frontend.vercel.app/shop',
  'https://url-cron-jobs.onrender.com' ,// নিজের সার্ভারের লিংক 'https://e-commerz-pos-cms.onrender.com',
  'https://arafshop-frontend.vercel.app/shop',
  'https://url-cron-jobs.onrender.com' // নিজের সার্ভারের লিংক// নিজের সার্ভারের লিংক
];

// একটার পর একটা URL পিং করার মূল ফাংশন (Sequential Ping)
async function pingUrlsSequentially() {
  fastify.log.info('--- Starting Keep-Alive Cron Job ---');
  
  for (const url of targetUrls) {
    try {
      fastify.log.info(`Ping started for: ${url}`);
      
      const startTime = Date.now();
      // ৫ সেকেন্ড টাইমআউট দেওয়া হয়েছে
      await axios.get(url, { timeout: 5000 }); 
      const duration = Date.now() - startTime;
      
      fastify.log.info(`Success: ${url} is awake! (${duration}ms)`);
    } catch (error) {
      fastify.log.error(`Failed to ping ${url}: ${error.message}`);
    }
    
    // প্রতিটা URL পিং করার মাঝে ২ সেকেন্ডের গ্যাপ (Delay)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  fastify.log.info('--- Cron Job Finished ---');
}

// ক্রন জব শিডিউলার: প্রতি ২ মিনিট পর পর ব্যাকগ্রাউন্ডে রান হবে
// (Cron Expression: */2 * * * *)
cron.schedule('*/2 * * * *', () => {
  pingUrlsSequentially();
});

// রুট API: এখানে হিট করলে ক্রন-জব ব্যাকগ্রাউন্ডে রান হবে এবং সাথে সাথে রেসপন্স দিবে
fastify.get('/', async (request, reply) => {
  // ব্যাকগ্রাউন্ডে পিং ফাংশনটি চালু করে দেওয়া হলো
  pingUrlsSequentially(); 
  
  return { 
    status: 'Cron job running process started successfully', 
    total_urls_queued: targetUrls.length,
    timestamp: new Date().toISOString()
  };
});

// সার্ভার চালু করা (Render পোর্ট ফিক্স সহ)
const start = async () => {
  try {
    // Render সাধারণত ১০০০০ পোর্ট ব্যবহার করে, লোকাল হোস্টের জন্য ৩০০০
    const port = process.env.PORT || 10000;
    
    await fastify.listen({ port: parseInt(port), host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
