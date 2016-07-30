window.userProfile = {
    age: null,
    state: null,
    gender: null,
    regional: null,
};

function showPanel(panelSelect) {
    $(".panel", ".main-panel").hide();
    $(panelSelect, ".main-panel").show();
}

function showButton(buttonSelect) {
    $(".btn", ".footer").hide();
    $(buttonSelect, ".footer").show();
}

function setupMain() {
    console.log("Setup Main");

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

    $("#spinButton").click(function(){
        machine1.shuffle(5, onComplete);
    })
}

function selectMain() {
    showPanel("#main-container");
    showButton("#spinButton");

}

function selectProfile() {
    showPanel("#profile-container");
    showButton("#saveProfileButton");

}

function selectConfig() {
    showPanel("#config-container")
    showButton("#saveConfigButton");

}


function setupProfile() {
    console.log("setupProfile")
    $("#profileNav").click(selectProfile);
    $("#saveProfileButton").click(function() {
        var gender = $('input[name=gender-radio]:checked').val();
        var age = $("#age-select").val();
        var state = $("#state-select").val();
        var regional = $("input#regional").is(":checked");

        window.userProfile["gender"] = gender;
        window.userProfile["age"] = age;
        window.userProfile["state"] = state;
        window.userProfile["regional"] = regional;

        console.log("TODO: Trigger reload??")
        selectMain();
    });
}

function setupConfig() {
    console.log("setupConfig")

    $("#configNav").click(selectConfig);
    $("#saveConfigButton").click(function() {
        console.log("TODO: save stuff")
        selectMain();
    });
}


$(document).ready(function() {
    $(".initial-hide").hide();

    setupMain();
    setupProfile();
    setupConfig();    
});
