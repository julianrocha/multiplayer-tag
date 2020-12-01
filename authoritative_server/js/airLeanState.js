class airLean{
    constructor(p){
      // console.log("ENTERED THE AIRLEAN STATE");
    }

    goToNextState(player, input){
      if(player.body.touching.down){
        return new Sprinting(player);
      } else if(input.left && !input.right){
        player.setAccelerationX(-350);
        return this;
      } else if(!input.left && input.right){
        player.setAccelerationX(350);
        return this;
      } else {
        return new inAir(player);
      }
    }
  }