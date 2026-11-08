'use strict';

let rareMobChance = 0.05;
let rareItemChance = 0.1;
let playerStatsMod = 6;
let healingFactor = 2;

const DIFFICULTY_SETTINGS = {
  easy: { rareMob: 0.05, rareItem: 0.3, statsMod: 10, healFactor: 5, startItems: 5, maxStartLvl: 5 },
  normal: { rareMob: 0.05, rareItem: 0.2, statsMod: 7, healFactor: 2, startItems: 3, maxStartLvl: 3 },
  hard: { rareMob: 0.15, rareItem: 0.15, statsMod: 5, healFactor: 1, startItems: 1, maxStartLvl: 1 }
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const roll = (n, max) =>
  max === undefined ? Math.floor(Math.random() * n) : randInt(n, Math.max(n, Math.floor(max)));
