const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const workingModels = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-4-scout-17b-16e-instruct",
];

async function testModels() {
  console.log('Testing Groq models...\n');
  
  for (const model of workingModels) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Say 'OK' in one word" }],
        model: model,
      });
      console.log(`✅ ${model} - WORKING`);
      console.log(`   Response: ${completion.choices[0].message.content}\n`);
    } catch (error) {
      console.log(`❌ ${model} - FAILED: ${error.message}\n`);
    }
  }
}

testModels();