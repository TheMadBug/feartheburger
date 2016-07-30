$(document).ready(function(){
    console.log("Populating causes of death");

    // Add children to slot machine1
    var CAUSE_OF_DEATH = [
        {id : 'assault-image', name: "Assault"},
        {id : 'terrorism-image', name: "Terrorism"},
        {id : 'cancer-image', name: "Cancer"},
        {id : 'car-image', name: "Car"},
        {id : 'heart-image', name: "Heart"},
        {id : 'motorbike-image', name: "Motorbike"},
        {id : 'suicide-image', name: "Suicide"},
        {id : 'poison-image', name: "Poison"},
        {id : 'shark-image', name: "Shark Attack"},
    ];
    
    for (var i=0 ; i<CAUSE_OF_DEATH.length; ++i) {
        var data = CAUSE_OF_DEATH[i];
        jQuery('<div/>', {
            id: data['id'],
            class: 'cause-of-death-image',
            name: data['name'],
        }).appendTo('#machine1');
    }

    var machine1 = $("#machine1").slotMachine({
        active	: 0,
        delay	: 500
    });

    function onComplete(active) {
        //console.log("active=" + active);
        var data = CAUSE_OF_DEATH[active];
        var name = data["name"];
        //console.log("name=" + name);

        $("#machine1Result").text(name);
    }

    $("#ranomizeButton").click(function(){

        machine1.shuffle(5, onComplete);

    })
});
