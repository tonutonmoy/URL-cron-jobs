import Fastify from 'fastify';
import cron from 'node-cron';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// আপনার টার্গেট URL গুলোর লিস্ট
const targetUrls = [
  'https://e-commerz-pos-cms.onrender.com',
  'https://e-commerz-pos-cms.onrender.com',
  'https://e-commerz-pos-cms.onrender.com',
  'https://arafshop-frontend.vercel.app/shop',
   'https://arafshop-frontend.vercel.app/shop',
    'https://arafshop-frontend.vercel.app/shop',
  'https://url-cron-jobs.onrender.com' ,
    'https://url-cron-jobs.onrender.com',  
    'https://url-cron-jobs.onrender.com' // নিজের সার্ভারের লিংক // নিজের সার্ভারের লিংক// নিজের সার্ভারের লিংক
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

// ক্রন জব শিডিউলার: প্রতি ১০ মিনিট পর পর ব্যাকগ্রাউন্ডে রান হবে
cron.schedule('*/10 * * * *', () => {
  pingUrlsSequentially();
});

// আপডেট করা রুট API: এখানে হিট করলে ক্রন-জব রান হবে এবং রেসপন্স দিবে
fastify.get('/', async (request, reply) => {
  // ব্যাকগ্রাউন্ডে পিং ফাংশনটি চালু করে দেওয়া হলো (এটি অ্যাসিনক্রোনাসলি চলতে থাকবে)
  pingUrlsSequentially(); 
  
  // ইউজার বা ক্রন-টুলকে সাথে সাথে রেসপন্স ব্যাক করবে
  return { 
    status: 'Cron job running process started successfully', 
    total_urls_queued: targetUrls.length,
    timestamp: new Date().toISOString()
  };
});

// সার্ভার চালু করা
const start = async () => {
  try {
    // Render-এর এনভায়রনমেন্ট পোর্ট (process.env.PORT) ডাইনামিকালি সেট করা হয়েছে
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: parseInt(port), host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
