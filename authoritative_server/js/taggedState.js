class Tagged {
    constructor(p){
      p.colour = 0xff0000;
    }

    goToNextState(p1, p2){
      if(p2.ts instanceof NotTagged) {
        p2.ts = new WarmingUp(p2);
        return new NotTagged(p1);
      } else {
        return this;
      }
    }
  }