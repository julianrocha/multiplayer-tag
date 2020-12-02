var MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function() {
        Phaser.Scene.call(this, { "key": "MenuScene" });
    },
    init: function() {},
    preload: function() {},
    create: function() {
        console.log("Entered create of menu scene");
        var self = this;
        this.time.addEvent({delay: 3000, loop: false, callback: () => 
            self.scene.start("GameScene")  // launch instead of start to prevent 'gl' of null error
        });
    },
    update: function() {
        //console.log("IN MENU SCENE UPDATE!");
    }
});
