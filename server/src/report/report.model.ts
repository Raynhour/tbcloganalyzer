import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class Encounter {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => Boolean, { nullable: true })
  kill: boolean | null;

  @Field(() => Float)
  startTime: number;

  @Field(() => Float)
  endTime: number;

  @Field(() => Int)
  encounterId: number;
}

@ObjectType()
export class EncounterConsumableUsage {
  @Field(() => Int)
  fightId: number;

  @Field()
  encounterName: string;

  @Field(() => Boolean, { nullable: true })
  kill: boolean | null;

  @Field()
  used: boolean;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  uptimePercent: number | null;
}

@ObjectType()
export class ConsumableEntry {
  @Field()
  name: string;

  @Field()
  category: string;

  @Field()
  icon: string;

  @Field(() => Int)
  spellId: number;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  uptimePercent: number | null;

  @Field(() => [EncounterConsumableUsage], { nullable: true })
  encounterBreakdown?: EncounterConsumableUsage[];
}

@ObjectType()
export class PlayerConsumables {
  @Field()
  playerName: string;

  @Field()
  class: string;

  @Field()
  spec: string;

  @Field(() => [ConsumableEntry])
  consumables: ConsumableEntry[];
}

@ObjectType()
export class PlayerAura {
  @Field(() => Int)
  ability: number;

  @Field()
  name: string;

  @Field(() => Int)
  source: number;

  @Field()
  icon: string;
}

@ObjectType()
export class PlayerFightBuffs {
  @Field()
  playerName: string;

  @Field(() => [PlayerAura])
  auras: PlayerAura[];
}

@ObjectType()
export class PlayerCast {
  @Field(() => Int)
  ability: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class PlayerFightCasts {
  @Field()
  playerName: string;

  @Field(() => [PlayerCast])
  casts: PlayerCast[];
}

@ObjectType()
export class RawAura {
  @Field(() => Int)
  guid: number;

  @Field()
  name: string;

  @Field(() => Float)
  totalUptime: number;

  @Field(() => Int)
  totalUses: number;
}

@ObjectType()
export class RawCast {
  @Field(() => Int)
  abilityGameID: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class PlayerFightRawData {
  @Field()
  playerName: string;

  @Field(() => [RawAura])
  auras: RawAura[];

  @Field(() => [RawCast])
  casts: RawCast[];

  @Field(() => [Int])
  enchants: number[];
}

@ObjectType()
export class ConsumableReport {
  @Field()
  reportTitle: string;

  @Field(() => [Encounter])
  encounters: Encounter[];

  @Field(() => [PlayerConsumables])
  players: PlayerConsumables[];
}
