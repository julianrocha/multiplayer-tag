class inAir{
    constructor(p){
      // console.log("ENTERED THE INAIR STATE");
    }
    
    goToNextState(player, input){
      if(player.body.touching.down){
        return new Standing(player);
      } else if(input.left && !input.right){
        player.setAccelerationX(-350);
        return new airLean(player);
      } else if(!input.left && input.right){
        player.setAccelerationX(350);
        return new airLean(player);
      } else{
        var mag = player.body.velocity.x > 0 ? -1 : 1
        player.setAccelerationX(200 * mag);
        return this;
      }
    }
  }