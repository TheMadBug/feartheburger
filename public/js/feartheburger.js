window.userProfile = {
    gender: null,
    age: null,
    state: null,
    regional: null,
};

function getOutcomes(category, callBackFunc) {
    var DEMO_KEYS = ["gender", "age", "state", "regional"];
    var demo = {};
    for (var i=0 ; i<DEMO_KEYS.length ; ++i) {
        var k = DEMO_KEYS[i];
        var val = userProfile[k];
        if (val != null) {
            demo[k] = val;
        }
    }

    var demoStr = 'demo=' + encodeURIComponent( JSON.stringify( demo ));
    var categoryStr = '&category=' + category;
    var url = '/outcomesFor?' + demoStr + categoryStr;
    $.get(url, callBackFunc);
}


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

    // So - need to go through this, and using the chance, pick out X (enough for the )
    var populateData = function(data) {
        // {"outcome" : "GRIM_Stroke", "chance":0.03115690731391455, "valid":true,"id":"GRIM_Stroke","name":"Stroke","text":null,
        // "icon":"heart.png", "category":"DEATH"}

        // TODO: clear any old ones.

        for (var i=0 ; i<Math.max(data.length, 10) ; ++i) {
            var record = data[i];
            if (record["valid"] && record["icon"]) {
                var outcome = record["outcome"];
                var chance = record["chance"];
                var id = record["id"];
                var name = record["name"];
                var text = record["text"];
                var icon = record["icon"];

                var img_path = "/img/flat/" + record["icon"];

                jQuery('<img/>', {
                    src: img_path,
                    class: 'cause-of-death-image',
                    name: name,
                }).appendTo('#machine1');
            }
        }
        console.log(data.length + " rows of data returned");

        console.log("done with outcomes")

        machine1 = $("#machine1").slotMachine({
            active	: 0,
            delay	: 500
        });
    };

    getOutcomes("DEATH", populateData);


    function onComplete(active) {
        //console.log("active=" + active);
//        var data = CAUSE_OF_DEATH[active];
 //       var name = data["name"];
        //console.log("name=" + name);

//        $("#machine1Result").text(name);
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
