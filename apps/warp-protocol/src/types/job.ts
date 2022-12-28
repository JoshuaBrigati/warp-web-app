import { u } from '@terra-money/apps/types';
import Big from 'big.js';
import { warp_controller } from './contracts';

export class Job {
  info: warp_controller.Job;
  condition: warp_controller.Condition;
  vars: warp_controller.Variable[];
  reward: u<Big>;

  constructor(info: warp_controller.Job) {
    this.info = info;
    this.condition = info.condition;
    this.vars = info.vars;
    this.reward = Big(info.reward) as u<Big>;
  }
}
