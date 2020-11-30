class Standing{
    constructor(p){
      /*   super(p); */
      console.log("ENTERED THE STANDING STATE");
    }

    goToNextState(player, input){
      /* If input left or right are being pressed and input up is not being pressed, then go to the sprinting state */
      if((input.left || input.right) && !input.up) {
        if(input.left){
          /* player.setVelocityX(-160); */
          player.setAccelerationX(-350);
        } else{
          /* player.setVelocityX(160); */
          player.setAccelerationX(350);
        }
        return new Sprinting(player);
      }
      /* if input up is being pressed and all directional velocitys are zero, then go to the inAir state */
      else if(input.up){
        player.setVelocityY(-400);
        return new inAir(player);
      } else{
        return this;
      }
    }
  }