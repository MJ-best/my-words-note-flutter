import { z } from "zod";

const nullableStr = z.string().max(2000).nullable().optional();

export const SuggestRequestSchema = z.object({
  node: z.object({
    text: z.string().min(1).max(500),
    lang: z.string().min(2).max(8),
    kind: z.enum(["word", "phrase", "sentence"]),
    domain: nullableStr,
    register: nullableStr,
    note: nullableStr,
  }),
  connections: z
    .array(
      z.object({
        text: z.string().max(500),
        lang: z.string().max(8),
        register: nullableStr,
        relation: z.enum(["equivalent", "similar", "broader", "narrower", "contrast", "collocation"]),
        weight: z.number().min(0).max(1),
        note: nullableStr,
        situation: nullableStr,
      }),
    )
    .max(60),
  examples: z
    .array(z.object({ text: z.string().max(1000), translation: nullableStr, situation: nullableStr }))
    .max(10),
  graphLangs: z.array(z.string().max(8)).max(30),
  extraLangs: z.array(z.string().max(8)).max(10),
});

export type SuggestRequest = z.infer<typeof SuggestRequestSchema>;
