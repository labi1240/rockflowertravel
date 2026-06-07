import * as migration_20260607_004841_initial from './20260607_004841_initial';

export const migrations = [
  {
    up: migration_20260607_004841_initial.up,
    down: migration_20260607_004841_initial.down,
    name: '20260607_004841_initial'
  },
];
