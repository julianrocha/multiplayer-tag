class Standing{
    constructor(p){
      // console.log("ENTERED THE STANDING STATE");
    }

    goToNextState(player, input){
      if(!player.body.touching.down){
        return new inAir(player);
      } else if(input.up){
        player.setVelocityY(-400);
        return new inAir(player);
      } else if(input.left && !input.right){
        return new Sprinting(player);
      } else if(!input.left && input.right){
        return new Sprinting(player);
      } else{
        var mag = player.body.velocity.x > 0 ? -1 : 1
        player.setAccelerationX(200 * mag);
        return this;
      }
    }
  }