var MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function() {
        Phaser.Scene.call(this, { "key": "MenuScene" });
    },
    init: function() {},
    preload: function() {},
    create: function() {
        var text = this.add.text(
            400, 
            300, 
            "Menu", 
            {
                fontSize: 50,
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);
        var self = this;
        //this.socket = io();

    this.time.addEvent({delay: 3000, loop: false, callback: () => 
        self.scene.start("GameScene")
    });
    //   this.socket.on('tick', function() {
    //        self.scene.start("GameScene");
    //    });
    },
    update: function() {}
});