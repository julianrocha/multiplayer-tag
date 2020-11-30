class inAir{
    constructor(p){
      console.log("ENTERED THE INAIR STATE");
    }
    goToNextState(player, input){
      /* Go to the air lean state if either input left or right exists. */
      if(input.left || input.right) {
        if(input.left){
          player.setAccelerationX(-350);
        } else{
          player.setAccelerationX(350);
        }
        return new airLean(player);
      } 
      /* Go to standing state if the player is on the ground */
      else if(player.body.touching.down){
        return new Standing(player);
      } else{
        return this;
      }
    }
  }