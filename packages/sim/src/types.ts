import type { z } from 'zod';
import type { gameSchema, newGameSchema, baseCommandSchema } from './schema';
export type GameState = z.infer<typeof gameSchema>;
export type NewGameOptions = z.infer<typeof newGameSchema>;
export type GameCommand = z.infer<typeof baseCommandSchema>;
