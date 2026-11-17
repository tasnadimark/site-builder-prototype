import { TEXT_MODELS, apiKey, imageModel, pickModel } from '@/ai/openrouter';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({
    hasKey: !!apiKey(),
    models: TEXT_MODELS,
    defaults: { generate: pickModel('generate'), edit: pickModel('edit'), image: imageModel() },
  });
}
