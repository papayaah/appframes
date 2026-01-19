import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_MODEL = 'stability-ai/sdxl';
const DEFAULT_VERSION =
  '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';

type GenerateBody = {
  prompt?: string;
  width?: number;
  height?: number;
  model?: string; // e.g. "stability-ai/sdxl:7762fd..."
  negativePrompt?: string;
  steps?: number;
  seed?: number;
};

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: unknown;
  output?: unknown;
};

function parseModelAndVersion(model?: string): { model: string; version: string } {
  if (!model) return { model: DEFAULT_MODEL, version: DEFAULT_VERSION };
  const [m, v] = model.split(':');
  if (m && v) return { model: m, version: v };
  // If only a version hash was provided, keep default model label.
  if (model.length > 20 && !model.includes('/')) return { model: DEFAULT_MODEL, version: model };
  return { model, version: DEFAULT_VERSION };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing REPLICATE_API_TOKEN' },
      { status: 500 }
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = (body.prompt || '').trim();
  const width = Number(body.width);
  const height = Number(body.height);

  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  if (!Number.isFinite(width) || width < 1 || width > 2048) {
    return NextResponse.json({ error: 'width must be between 1 and 2048' }, { status: 400 });
  }
  if (!Number.isFinite(height) || height < 1 || height > 2048) {
    return NextResponse.json({ error: 'height must be between 1 and 2048' }, { status: 400 });
  }

  const { model, version } = parseModelAndVersion(body.model);
  const steps = Number.isFinite(Number(body.steps)) ? Math.max(1, Math.min(100, Number(body.steps))) : 25;

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: {
        width,
        height,
        prompt,
        // SDXL-like inputs (extra fields are generally ignored by other models)
        ...(body.negativePrompt ? { negative_prompt: body.negativePrompt } : null),
        ...(Number.isFinite(Number(body.seed)) ? { seed: Number(body.seed) } : null),
        refine: 'expert_ensemble_refiner',
        apply_watermark: false,
        num_inference_steps: steps,
      },
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '');
    return NextResponse.json(
      { error: 'Replicate request failed', details: text },
      { status: 502 }
    );
  }

  const created = (await createRes.json()) as ReplicatePrediction;
  const id = created.id;

  const startedAt = Date.now();
  let prediction: ReplicatePrediction = created;

  // Poll up to ~75s (best-effort)
  while (
    prediction.status === 'starting' ||
    prediction.status === 'processing'
  ) {
    if (Date.now() - startedAt > 75_000) {
      return NextResponse.json({ error: 'Replicate timed out' }, { status: 504 });
    }

    await sleep(1200);
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
      cache: 'no-store',
    });
    if (!pollRes.ok) {
      return NextResponse.json({ error: 'Replicate polling failed' }, { status: 502 });
    }
    prediction = (await pollRes.json()) as ReplicatePrediction;
  }

  if (prediction.status !== 'succeeded') {
    return NextResponse.json(
      { error: 'Replicate generation failed', details: prediction.error ?? null },
      { status: 502 }
    );
  }

  const output = prediction.output;
  const url =
    typeof output === 'string'
      ? output
      : Array.isArray(output) && typeof output[0] === 'string'
        ? (output[0] as string)
        : null;

  if (!url) {
    return NextResponse.json({ error: 'Unexpected Replicate output format' }, { status: 502 });
  }

  const imageRes = await fetch(url, { cache: 'no-store' });
  if (!imageRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch generated image' }, { status: 502 });
  }

  const contentType = imageRes.headers.get('content-type') || 'image/png';
  const arrayBuffer = await imageRes.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'no-store',
      'x-ai-provider': 'replicate',
      'x-ai-model': `${model}:${version}`,
    },
  });
}

