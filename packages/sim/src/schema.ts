import { z } from 'zod';
import { balance } from '../../content/src/balance';
export const money = z.number().int().min(0).max(balance.moneyLimit);
export const seedSchema = z.number().int().min(0).max(0xffffffff);
export const newGameSchema = z.object({
  id: z.string().min(1).max(80), name: z.string().trim().min(1).max(80),
  year: z.number().int().min(1970).max(2200), difficulty: z.enum(['normal','hard']), seed: seedSchema,
}).strict();
export const gameSchema = z.object({
  version: z.literal(1), id: z.string().min(1).max(80), seed: seedSchema,
  initialSeed: seedSchema, day: z.number().int().min(0).max(1_000_000), year: z.number().int().min(1970).max(2200),
  difficulty: z.enum(['normal','hard']),
  company: z.object({name:z.string().trim().min(1).max(80),cash:money,debt:money,reputation:z.number().min(0).max(100),awareness:z.number().min(0).max(100)}).strict(),
  finance: z.object({revenue:money,expenses:money,capital:money}).strict(),
  events: z.array(z.object({day:z.number().int().min(0),kind:z.string().min(1).max(40),detail:z.string().max(200)}).strict()).max(balance.eventLimit),
}).strict();
export const baseCommandSchema = z.discriminatedUnion('type',[
  z.object({type:z.literal('advance'),days:z.number().int().min(0).max(balance.maxAdvance)}).strict(),
  z.object({type:z.literal('spend'),amount:money}).strict(),
]);
