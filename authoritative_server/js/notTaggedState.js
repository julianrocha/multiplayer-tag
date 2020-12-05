class NotTagged {
    constructor(p){
      p.colour = 0xffff00;
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