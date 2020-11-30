class airLean{
    constructor(p){
      console.log("ENTERED THE AIRLEAN STATE");
    }

    goToNextState(player, input){
      /* If the player is on the ground and the one of the right or left inputs are being pressed, go to sprinting state */
      if(player.body.touching.down && (input.left || input.right)){
        return new Sprinting(player);
      } 
      /* If neither input left or right are being pressed and the player is stil in the air, then go to the inAir state */
      else if(!(input.left || input.right)){
        player.setAccelerationX(0);
        return new inAir(player);
      } else{
        return this;
      }
    }
  }