import { z } from 'zod';
import { balance } from '../../content/src/balance';
import {hardwareKinds} from '../../content/src/research';
import {productKinds} from '../../content/src/devices';
import {clusterSchema,designSchema,modelSchema} from './ai-schema';
export const money = z.number().int().min(0).max(balance.moneyLimit);
export const seedSchema = z.number().int().min(0).max(0xffffffff);
export const specSchema=z.record(z.string(),z.union([z.number(),z.string().max(80)]));
export const productSchema=z.object({id:z.string().min(1),name:z.string().trim().min(1).max(80),kind:z.enum(productKinds),spec:specSchema,
 performance:z.number().positive(),power:z.number().nonnegative(),unitCost:z.number().int().positive(),remaining:z.number().nonnegative(),
 reliability:z.number().min(.1).max(1).default(.9),price:z.number().int().min(1).max(1000000),inventory:z.number().int().min(0).max(100000),target:z.number().int().min(0).max(100000),
 line:z.boolean(),launched:z.boolean(),sold:z.number().int().nonnegative(),revenue:z.number().int().nonnegative(),profit:z.number().int(),releaseDay:z.number().int().nonnegative(),
}).strict();
export const rivalSchema=z.object({id:z.string(),name:z.string(),focus:z.enum(['cpu','gpu','ram']),cash:money,debt:money,seed:seedSchema,efficiency:z.number().min(1).max(2),researchLevel:z.number().int().min(0).max(50),researchRemaining:z.number().nonnegative(),products:z.array(productSchema).max(100),acquired:z.boolean()}).strict();
export const newGameSchema = z.object({
  id: z.string().min(1).max(80), name: z.string().trim().min(1).max(80),
  year: z.number().int().min(1970).max(2200), difficulty: z.enum(['normal','hard']), seed: seedSchema,
}).strict();
export const gameSchema = z.object({
  version: z.literal(1), id: z.string().min(1).max(80), seed: seedSchema,
  initialSeed: seedSchema, day: z.number().int().min(0).max(1_000_000), year: z.number().int().min(1970).max(2200),
  difficulty: z.enum(['normal','hard']),
  company: z.object({name:z.string().trim().min(1).max(80),cash:money,debt:money,loan:money.default(0),reputation:z.number().min(0).max(100),awareness:z.number().min(0).max(100)}).strict(),
  finance: z.object({revenue:money,expenses:money,capital:money}).strict(),
  research:z.object({completed:z.array(z.string()).max(5000),active:z.array(z.object({id:z.string(),remaining:z.number().nonnegative()}).strict()).max(20)}).default({completed:[],active:[]}),
  products:z.array(productSchema).max(500).default([]),
  rivals:z.array(rivalSchema).max(10).default([]),
  clusters:z.array(clusterSchema).max(20).default([]),
  models:z.array(modelSchema).max(100).default([]),
  modifiers:z.object({demand:z.number().min(.5).max(1.5),production:z.number().min(.5).max(1.5),expiresDay:z.number().int().min(0)}).default({demand:1,production:1,expiresDay:0}),
  officeLevel:z.number().int().min(1).max(10).default(1),factoryLevel:z.number().int().min(1).max(10).default(1),advertising:money.default(0),
  staff:z.array(z.object({id:z.string(),role:z.enum(['research','engineering','marketing','ai']),skill:z.number().int().min(20).max(100),salary:money}).strict()).max(40).default([]),
  history:z.array(z.object({day:z.number().int(),cash:money,debt:money,loan:money,revenue:money,expenses:money,capital:money,share:z.number().min(0).max(1)}).strict()).max(240).default([]),
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
 z.object({type:z.literal('launch'),id:z.string().min(1)}).strict(),
 z.object({type:z.literal('line'),id:z.string().min(1),target:z.number().int().min(0).max(100000)}).strict(),
 z.object({type:z.literal('price'),id:z.string().min(1),price:z.number().int().min(1).max(1000000)}).strict(),
 z.object({type:z.literal('assemble'),kind:z.enum(['pc','laptop']),name:z.string().trim().min(1).max(80),parts:z.object({cpu:z.string(),gpu:z.string(),motherboard:z.string(),ram:z.string(),storage:z.string()}).strict(),purpose:z.enum(['gaming','office','server']),appearance:z.enum(['graphite','silver','teal']),price:z.number().int().min(1).max(1000000),osId:z.string().optional()}).strict(),
 z.object({type:z.literal('developOS'),name:z.string().trim().min(1).max(80),version:z.number().int().min(1).max(100),features:z.array(z.enum(['files','calculator','browser'])).min(1).max(3).refine(a=>new Set(a).size===a.length),quality:z.number().min(.1).max(1),compatibility:z.number().min(.1).max(1),support:z.number().min(0).max(1),price:z.number().int().min(1).max(1000000)}).strict(),
 z.object({type:z.literal('office'),level:z.number().int().min(1).max(10)}).strict(),
 z.object({type:z.literal('factory'),level:z.number().int().min(1).max(10)}).strict(),
 z.object({type:z.literal('hire'),role:z.enum(['research','engineering','marketing','ai']),skill:z.number().int().min(20).max(100)}).strict(),
 z.object({type:z.literal('train'),id:z.string()}).strict(),
 z.object({type:z.literal('marketing'),budget:z.number().int().min(0).max(1000000)}).strict(),
 z.object({type:z.literal('borrow'),amount:money.min(1)}).strict(),
 z.object({type:z.literal('repay'),amount:money.min(1)}).strict(),
 z.object({type:z.literal('acquire'),id:z.string()}).strict(),
 z.object({type:z.literal('buyCluster'),gpuId:z.string(),serverId:z.string(),gpus:z.number().int().min(1).max(256),network:z.number().min(.1).max(1),cooling:z.number().min(.1).max(1)}).strict(),
 z.object({type:z.literal('trainModel'),name:z.string().trim().min(1).max(80),design:designSchema,clusterId:z.string(),budget:money.min(1)}).strict(),
 z.object({type:z.literal('deployModel'),id:z.string(),clusterId:z.string(),bits:z.union([z.literal(4),z.literal(8),z.literal(16)]),context:z.number().int().min(128).max(1048576),batch:z.number().int().min(1).max(256),mode:z.enum(['api','subscription','open']),apiPrice:z.number().int().min(1).max(1000000),subscriptionPrice:z.number().int().min(1).max(1000000)}).strict(),
 z.object({type:z.literal('retireModel'),id:z.string()}).strict(),
]);
