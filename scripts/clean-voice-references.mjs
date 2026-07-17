import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(repo, '.cache', 'voice-references');
const outputDir = path.join(repo, '.cache', 'voice-references-clean');
const version = '93266a7e7f5805fb79bcf213b1a4e0ef2e45aff3c06eefd96c59e850c87fd6a2';
const names = ['anna', 'sarah', 'grace', 'elliott'];

const envText = await readFile(path.join(repo, '..', '.env'), 'utf8');
const token = envText.match(/^REPLICATE_API_(?:TOKEN|KEY)=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!token) throw new Error('REPLICATE_API_TOKEN or REPLICATE_API_KEY was not found in Documents/.env.');
await mkdir(outputDir, { recursive: true });

async function clean(name) {
  const input = await readFile(path.join(inputDir, `${name}.wav`));
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      version,
      input: {
        input_audio: `data:audio/wav;base64,${input.toString('base64')}`,
        denoise_flag: true,
        solver: 'Midpoint',
        number_function_evaluations: 64,
        prior_temperature: 0.5,
      },
    }),
  });
  let prediction = await response.json();
  if (!response.ok) throw new Error(prediction.detail ?? prediction.error ?? `Replicate returned ${response.status}.`);
  for (let attempt = 0; !prediction.output && attempt < 45; attempt += 1) {
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error ?? `Prediction ${prediction.status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const poll = await fetch(prediction.urls.get, { headers: { Authorization: `Bearer ${token}` } });
    prediction = await poll.json();
  }
  const denoisedUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!denoisedUrl) throw new Error(`No cleaned audio was returned for ${name}.`);
  const audio = await fetch(denoisedUrl);
  if (!audio.ok) throw new Error(`Could not download cleaned ${name} audio.`);
  await writeFile(path.join(outputDir, `${name}.wav`), Buffer.from(await audio.arrayBuffer()));
  console.log(`cleaned ${name}.wav`);
}

const queue = [...names];
async function worker() {
  while (queue.length > 0) await clean(queue.shift());
}
await Promise.all([worker(), worker()]);
