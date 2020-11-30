class NotTagged {
    constructor(p){
      playerStates[p.playerId].colour = 0x000fff;
    }

    goToNextState(p1, p2){
      if(p2.ts instanceof Tagged) {
        p2.ts = new NotTagged(p2);
        return new WarmingUp(p1);
      } else {
        return this;
      }
    }
  }