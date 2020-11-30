class WarmingUp {
    constructor(p){
      playerStates[p.playerId].colour = 0xffff00;
      p.gameInstance.time.delayedCall(3000, this.transitionToTagged,[p], p.gameInstance);
    }

    goToNextState(p1, p2) {
      return this;
    }

    transitionToTagged(p){
      p.ts = new Tagged(p);
    }
  }