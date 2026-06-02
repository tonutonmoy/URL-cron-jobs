import Fastify from 'fastify';
import cron from 'node-cron';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// উদাহরণ হিসেবে কিছু Vercel/Netlify URL (বাস্তবে এগুলো ডাটাবেজ থেকে আসবে)
const targetUrls = [
  'https://e-commerz-pos-cms.onrender.com/',
  'https://arafshop-frontend.vercel.app/shop',
  
];

// একটার পর একটা URL পিং করার মূল ফাংশন (Sequential Ping)
async function pingUrlsSequentially() {
  fastify.log.info('--- Starting Keep-Alive Cron Job ---');
  
  for (const url of targetUrls) {
    try {
      fastify.log.info(`Ping started for: ${url}`);
      
      const startTime = Date.now();
      // ৫ সেকেন্ড টাইমআউট দেওয়া হয়েছে যাতে কোনো স্লো সাইটের জন্য পুরো লুপ আটকে না থাকে
      await axios.get(url, { timeout: 5000 }); 
      const duration = Date.now() - startTime;
      
      fastify.log.info(`Success: ${url} is awake! (${duration}ms)`);
    } catch (error) {
      fastify.log.error(`Failed to ping ${url}: ${error.message}`);
    }
    
    // প্রতিটা URL পিং করার মাঝে ২ সেকেন্ডের একটি গ্যাপ (Delay)
    // এতে সার্ভারের ওপর একসাথে চাপ পড়বে না এবং লুপটি সুন্দরভাবে চলবে
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  fastify.log.info('--- Cron Job Finished ---');
}

// ক্রন জব শিডিউলার: প্রতি ১০ মিনিট পর পর রান হবে
// (Cron Expression: */10 * * * *)
cron.schedule('*/10 * * * *', () => {
  pingUrlsSequentially();
});

// একটি সাধারণ রুট (Health Check-এর জন্য)
fastify.get('/', async (request, reply) => {
  return { status: 'Keep-Alive Server is Running', total_urls: targetUrls.length };
});

// সার্ভার চালু করা
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
