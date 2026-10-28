import { z } from "zod";
import { RELATION_ORDER } from "@/lib/types";

export const CHUNK_ROWS = 25;
export const MAX_CELL = 500;

export const ExtractRequestSchema = z.object({
  header: z.array(z.string().max(MAX_CELL)).max(30),
  rows: z.array(z.array(z.string().max(MAX_CELL)).max(30)).min(1).max(CHUNK_ROWS),
  /** 시트에 등장하는 언어 코드 (ko, en, ja, ru …). AI는 이 안에서만 고른다 */
  langs: z.array(z.string().regex(/^[a-z]{2,8}$/)).min(2).max(8),
  domain: z.string().max(60).nullable(),
  /** 사용자가 적은 시트 설명 (어느 열이 무엇인지, 메모 표기 규칙 등) */
  hint: z.string().max(1000).nullable(),
});
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const REGISTERS = ["formal", "casual", "clinical", "legal", "written", "spoken"] as const;

export const ExtractedItemSchema = z.object({
  row: z.number().int().min(1),
  source_text: z.string().min(1).max(MAX_CELL),
  source_lang: z.string().regex(/^[a-z]{2,8}$/),
  target_text: z.string().min(1).max(MAX_CELL),
  target_lang: z.string().regex(/^[a-z]{2,8}$/),
  relation: z.enum(RELATION_ORDER as unknown as [string, ...string[]]),
  weight: z.number().int().min(0).max(100),
  situation: z.string().max(60).nullable(),
  note: z.string().max(600),
  register: z.enum(REGISTERS).nullable(),
  example: z.object({ text: z.string().max(600), translation: z.string().max(600), situation: z.string().max(60).nullable() }).nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export const ExtractResponseSchema = z.object({ items: z.array(ExtractedItemSchema).max(120) });

/** output_config.format 에 넘길 JSON Schema. langs 는 요청마다 enum 으로 박는다. */
export function outputJsonSchema(langs: string[]) {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row: { type: "integer", description: "1-based index of the input row this item came from" },
            source_text: { type: "string" },
            source_lang: { type: "string", enum: langs },
            target_text: { type: "string" },
            target_lang: { type: "string", enum: langs },
            relation: { type: "string", enum: [...RELATION_ORDER] },
            weight: { type: "integer", description: "0..100 how natural/appropriate this mapping is in the given situation" },
            situation: { type: ["string", "null"], description: "Korean situation tag, e.g. 환자 설명, 의료진 간, 차트·문서, 법정, 계약서·서면; null if general" },
            note: { type: "string", description: "Korean nuance note: when to use, who says it, what differs. 1-2 sentences" },
            register: { type: ["string", "null"], enum: [...REGISTERS, null] },
            example: {
              type: ["object", "null"],
              properties: {
                text: { type: "string" },
                translation: { type: "string" },
                situation: { type: ["string", "null"] },
              },
              required: ["text", "translation", "situation"],
              additionalProperties: false,
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["row", "source_text", "source_lang", "target_text", "target_lang", "relation", "weight", "situation", "note", "register", "example", "confidence"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  } as const;
}
