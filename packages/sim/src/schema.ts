import { z } from 'zod';
import { balance } from '../../content/src/balance';
import {hardwareKinds} from '../../content/src/research';
export const specSchema=z.record(z.string(),z.union([z.number(),z.string().max(80)]));
export const productSchema=z.object({id:z.string().min(1),name:z.string().trim().min(1).max(80),kind:z.enum(hardwareKinds),spec:specSchema,
 performance:z.number().positive(),power:z.number().nonnegative(),unitCost:z.number().int().positive(),remaining:z.number().nonnegative(),
 price:z.number().int().min(1).max(1000000),inventory:z.number().int().min(0).max(100000),target:z.number().int().min(0).max(100000),
 line:z.boolean(),launched:z.boolean(),sold:z.number().int().nonnegative(),revenue:z.number().int().nonnegative(),profit:z.number().int(),releaseDay:z.number().int().nonnegative(),
}).strict();
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
  research:z.object({completed:z.array(z.string()).max(5000),active:z.array(z.object({id:z.string(),remaining:z.number().nonnegative()}).strict()).max(20)}).default({completed:[],active:[]}),
  products:z.array(productSchema).max(500).default([]),
  events: z.array(z.object({day:z.number().int().min(0),kind:z.string().min(1).max(40),detail:z.string().max(200)}).strict()).max(balance.eventLimit),
}).strict();
export const baseCommandSchema = z.discriminatedUnion('type',[
  z.object({type:z.literal('advance'),days:z.number().int().min(0).max(balance.maxAdvance)}).strict(),
  z.object({type:z.literal('spend'),amount:money}).strict(),
]);
export const gameCommandSchema=z.discriminatedUnion('type',[
 ...baseCommandSchema.options,
 z.object({type:z.literal('research'),id:z.string().min(1)}).strict(),
 z.object({type:z.literal('design'),kind:z.enum(hardwareKinds),name:z.string().trim().min(1).max(80),spec:specSchema,price:z.number().int().min(1).max(1000000)}).strict(),
]);
