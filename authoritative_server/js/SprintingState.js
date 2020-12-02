class Sprinting{
    constructor(p){
      // console.log("ENTERED THE SPRINTING STATE");
    }

    goToNextState(player, input){
      if(!player.body.touching.down){
        return new airLean(player);
      } else if(input.up){
        player.setVelocityY(-400);
        return new inAir(player);
      } else if(input.left && !input.right){
        player.setAccelerationX(-350);
        return this;
      } else if(!input.left && input.right){
        player.setAccelerationX(350);
        return this;
      } else {
        return new Standing(player);
      }
    }
  }