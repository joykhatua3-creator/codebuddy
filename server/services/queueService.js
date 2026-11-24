const PQueueImport = require('p-queue');
const PQueue = PQueueImport.default || PQueueImport;

// In-process concurrency limiter (concurrency: 2) to smooth Gemini API spikes
const aiQueue = new PQueue({ concurrency: 2 });

aiQueue.on('active', () => {
  console.log(`🤖 AI Queue active. Pending: ${aiQueue.pending}, Queue size: ${aiQueue.size}`);
});

module.exports = { aiQueue };
