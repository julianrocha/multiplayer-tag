class Sprinting{
    constructor(p){
      console.log("ENTERED THE SPRINTING STATE");
    }

    goToNextState(player, input){
      /* Going to air lean with a jump */
      if(input.up && player.body.touching.down && (input.left || input.right)){
        player.setVelocityY(-400);
        return new airLean(player);
      } 
      /* Going to air lean from falling off a ledge */
      else if((input.left || input.right) && !player.body.touching.down){
        return new airLean(player);
      } 
      /* Going to standing state when no inputs are being pressed and the player is touching the ground */
      else if(!(input.left || input.right || input.up) && player.body.touching.down){
        /* player.setVelocityX(0); */
        player.setAccelerationX(0);
        return new Standing(player);
      } 
      else{
        return this;
      }
    }
  }