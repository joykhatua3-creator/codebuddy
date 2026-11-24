const { generateRoadmap } = require('./services/aiService');

async function test() {
  console.time('RoadmapGeneration');
  const result = await generateRoadmap(['Variables and Data Types', 'Loops', 'Functions'], 'Sukhen');
  console.timeEnd('RoadmapGeneration');
  console.log('Steps count:', result.steps.length);
  console.log('Step 1:', {
    title: result.steps[0].title,
    level: result.steps[0].level,
    hours: result.steps[0].estimatedHours,
    concepts: result.steps[0].keyConcepts,
    hasStarterCode: !!result.steps[0].starterCode
  });
}

test().catch(console.error);
