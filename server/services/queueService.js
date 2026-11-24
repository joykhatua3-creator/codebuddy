const PQueueImport = require('p-queue');
const PQueue = PQueueImport.default || PQueueImport;

// In-process concurrency limiter (concurrency: 5) to smooth Gemini API spikes while keeping response times fast
const aiQueue = new PQueue({ concurrency: 5 });

aiQueue.on('active', () => {
  console.log(`🤖 AI Queue active. Pending: ${aiQueue.pending}, Queue size: ${aiQueue.size}`);
});

module.exports = { aiQueue };
