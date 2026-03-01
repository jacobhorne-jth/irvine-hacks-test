import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { PortfolioEntry } from '@/components/portfolio/SaveToPortfolioButton';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'fetch_risk_details',
      description:
        'Fetch detailed risk analysis for a property address. Returns title risk, disaster risk, market risk scores, ownership history, and AI summary. Call this before flagging or annotating a property.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Full property address to analyze' },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_property',
      description:
        'Add a colored risk flag to an existing portfolio property. Use urgent for critical risks (liens, foreclosures), watch for moderate concerns (flood zone, high volatility), opportunity for low-risk good deals, negotiate for properties where risks justify price reduction.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Property address (must already be in portfolio)' },
          flag_type: {
            type: 'string',
            enum: ['urgent', 'watch', 'opportunity', 'negotiate'],
          },
          reason: { type: 'string', description: 'Brief reason shown to buyer (1-2 sentences)' },
        },
        required: ['address', 'flag_type', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_negotiation_note',
      description:
        'Add specific negotiation talking points to a portfolio property based on its risk data. Include concrete dollar amounts and specific risk factors the buyer can cite.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Property address (must already be in portfolio)' },
          note: { type: 'string', description: 'Negotiation note with specific talking points and dollar estimates' },
        },
        required: ['address', 'note'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_portfolio',
      description:
        'Add a new property to the buyer\'s portfolio. Use this when you identify a safer comparable property in the same area that would make a better investment. Only add if you have reasonable confidence the address exists in Orange County, CA.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Full address of the new property to add (must be in Orange County, CA)' },
          reason: { type: 'string', description: 'Why this property is worth tracking (1-2 sentences)' },
        },
        required: ['address', 'reason'],
      },
    },
  },
];

function enc(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function fetchRiskDetails(address: string, baseUrl: string) {
  const propRes = await fetch(
    `${baseUrl}/api/property?address=${encodeURIComponent(address)}`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!propRes.ok) return { error: `Property not found: ${address}` };

  const propData = await propRes.json();
  if (propData.error) return { error: propData.error };

  const riskRes = await fetch(`${baseUrl}/api/risk-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property: propData.property,
      history: propData.history,
      priceHistory: propData.priceHistory,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!riskRes.ok) return { error: 'Risk analysis failed' };

  const riskData = await riskRes.json();

  return {
    address,
    property: {
      type: propData.property.propertyType,
      beds: propData.property.beds,
      baths: propData.property.baths,
      zestimate: propData.property.zestimate,
      yearBuilt: propData.property.yearBuilt,
    },
    titleRisk: riskData.riskReport?.titleRisk,
    disasterRisk: riskData.riskReport?.disasterRisk,
    marketRisk: riskData.riskReport?.marketRisk,
    overallScore: riskData.riskReport?.overallScore,
    aiSummary: riskData.aiSummary,
    ownershipHistory: {
      totalTransfers: propData.history?.totalTransfers,
      flipCount: propData.history?.flipCount,
      foreclosureCount: propData.history?.foreclosureCount,
      lienCount: propData.history?.lienCount,
    },
  };
}

async function buildPortfolioEntry(address: string, baseUrl: string): Promise<PortfolioEntry | null> {
  const propRes = await fetch(
    `${baseUrl}/api/property?address=${encodeURIComponent(address)}`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!propRes.ok) return null;
  const propData = await propRes.json();
  if (propData.error || !propData.property) return null;

  const riskRes = await fetch(`${baseUrl}/api/risk-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property: propData.property,
      history: propData.history,
      priceHistory: propData.priceHistory,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!riskRes.ok) return null;
  const riskData = await riskRes.json();

  const slug = encodeURIComponent(address.toLowerCase().replace(/\s+/g, '-'));
  return {
    id: slug,
    address,
    savedAt: new Date().toISOString(),
    overallScore: riskData.riskReport?.overallScore ?? 50,
    recommendation: riskData.aiSummary?.recommendation ?? 'caution',
    propertyType: propData.property.propertyType ?? 'single-family',
    zestimate: propData.property.zestimate ?? 0,
    beds: propData.property.beds ?? 0,
    baths: propData.property.baths ?? 0,
  };
}

export async function POST(req: NextRequest) {
  const { portfolio } = (await req.json()) as { portfolio: PortfolioEntry[] };

  // Derive base URL from the incoming request so we always hit the right port
  const host = req.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}`;

  const systemPrompt = `You are an expert real estate risk analyst and buyer's assistant for PROP.INTEL in Orange County, CA.

The buyer's current portfolio:
${JSON.stringify(portfolio.map((e) => ({ address: e.address, score: e.overallScore, recommendation: e.recommendation })), null, 2)}

Your mission — take ALL of these actions autonomously:
1. For EACH property in the portfolio: call fetch_risk_details, then flag_property with the appropriate flag, then add_negotiation_note with specific dollar-backed talking points.
2. After reviewing all existing properties: if the portfolio has any high-risk (score > 60) properties, try to add_to_portfolio one safer comparable property in Orange County, CA with a score you'd expect to be under 50.
3. After all tool calls are done, write a concise portfolio summary (3-5 sentences) comparing the properties, highlighting the best and worst investments, and giving the buyer a clear action plan.

Be specific. Use actual risk scores and factors. Give dollar estimates in negotiation notes.`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Please review my portfolio and take action on each property.' },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(enc(data));

      try {
        let iteration = 0;
        let fetchCount = 0;
        const MAX_ITERATIONS = 20;

        while (iteration < MAX_ITERATIONS) {
          iteration++;

          // Collect a full streaming response (accumulate tool calls + text)
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            stream: true,
            messages,
            tools: TOOLS,
            tool_choice: 'auto',
            temperature: 0.2,
          });

          let textBuffer = '';
          const toolCallAccumulator: Record<
            number,
            { id: string; name: string; argsBuffer: string }
          > = {};
          let finishReason: string | null = null;

          for await (const chunk of completion) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            finishReason = choice.finish_reason ?? finishReason;
            const delta = choice.delta;

            // Stream text tokens immediately
            if (delta.content) {
              textBuffer += delta.content;
              send({ type: 'text', delta: delta.content });
            }

            // Accumulate tool call chunks
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolCallAccumulator[idx]) {
                  toolCallAccumulator[idx] = { id: '', name: '', argsBuffer: '' };
                }
                // Only assign (not append) id/name — they come fully in the first chunk
                if (tc.id) toolCallAccumulator[idx].id = tc.id;
                if (tc.function?.name) toolCallAccumulator[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCallAccumulator[idx].argsBuffer += tc.function.arguments;
              }
            }
          }

          // Build the assistant message to append
          const toolCalls = Object.values(toolCallAccumulator);

          if (toolCalls.length > 0) {
            messages.push({
              role: 'assistant',
              content: textBuffer || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.argsBuffer },
              })),
            });

            // Execute each tool call
            for (const tc of toolCalls) {
              let args: Record<string, string>;
              try {
                args = JSON.parse(tc.argsBuffer);
              } catch {
                args = {};
              }

              let result: object;

              if (tc.name === 'fetch_risk_details') {
                fetchCount++;
                send({ type: 'highlight_property', address: args.address });
                send({
                  type: 'progress',
                  current: fetchCount,
                  total: portfolio.length,
                  address: args.address,
                  phase: 'analyzing...',
                });
                result = await fetchRiskDetails(args.address, baseUrl);
                send({ type: 'highlight_property', address: null });

              } else if (tc.name === 'flag_property') {
                send({
                  type: 'action',
                  tool: 'flag_property',
                  payload: { address: args.address, flagType: args.flag_type, reason: args.reason },
                });
                result = { success: true };

              } else if (tc.name === 'add_negotiation_note') {
                send({
                  type: 'action',
                  tool: 'add_negotiation_note',
                  payload: { address: args.address, note: args.note },
                });
                result = { success: true };

              } else if (tc.name === 'add_to_portfolio') {
                send({
                  type: 'progress',
                  current: fetchCount,
                  total: portfolio.length,
                  address: args.address,
                  phase: 'adding comparable...',
                });
                const entry = await buildPortfolioEntry(args.address, baseUrl);
                if (entry) {
                  send({
                    type: 'action',
                    tool: 'add_to_portfolio',
                    payload: { entry, reason: args.reason },
                  });
                  result = { success: true, entry };
                } else {
                  result = { success: false, error: 'Property not found in database' };
                }

              } else {
                result = { error: 'Unknown tool' };
              }

              messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              });
            }

          } else {
            // No tool calls — this is the final text response
            if (textBuffer) {
              // Text was already streamed above; just finish
            }
            break;
          }
        }

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Agent error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
