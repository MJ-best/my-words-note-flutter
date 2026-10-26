import type { StarterPack } from "./types";
import { MEDICAL_PACK } from "./medical";
import { LEGAL_PACK } from "./legal";

export { compilePack } from "./types";
export type { StarterPack } from "./types";

export const STARTER_PACKS: StarterPack[] = [MEDICAL_PACK, LEGAL_PACK];
