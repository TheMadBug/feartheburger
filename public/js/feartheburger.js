window.userProfile = {
    gender: null,
    age: null,
    state: null,
    regional: null,
};

MAX_SLOT_ELEMENTS = 9999;
IMG_PATH = "/img/flat/";
GENDER_LOOKUP = {"M" : "Male", "F" : "Female"};
REGION_LOOKUP = ["Non-regional", "Regional"];

// We put 1 of these on the top - but they can never be picked (we rig the slot machine function in randomizeSlotMachine)
// The normal shark/terrorism etc will be added in per normal odds so it could be picked
FAKE_TOP = ['shark2.png', 'terrorism.png'];

function randomElement(myArray) {
    var i = Math.floor(Math.random() * myArray.length);
    return myArray[i];
}

function setDemographicText() {
    var age = userProfile['age'];
    var gender = userProfile['gender'];
    var state = userProfile['state'];
    var regional = userProfile['regional'];

    var demographics = [];
    if (age) {
        demographics.push(age + ' year old');
    }
    if (gender) {
        demographics.push(GENDER_LOOKUP[gender]);
    }
    if (state) {
        demographics.push(state);
    }
    if (regional) {
        demographics.push(REGION_LOOKUP[1*regional]);
    }

    var demographicText = demographics.join(', ');
    $("#demographic-display").text(demographicText || 'Average Australian');
}


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

function handleSpinEnd(element) {
    console.log("handleSpinEnd")
    console.log(element);
    var resultContainer = $("#machine1Result");

    var name = $(element).attr("name");
    console.log("name = " + name);
    resultContainer.text(name)

}


function addCauseToSlotMachine(img_path, name) {
    jQuery('<img/>', {
        src: img_path,
        class: 'cause-of-death-image',
        name: name,
    }).appendTo('#machine1');
}


function setupMain() {
    console.log("Setup Main");

    // So - need to go through this, and using the chance, pick out X (enough for the )
    var populateData = function(data) {
        // shorten for testing?
        if (data.length > MAX_SLOT_ELEMENTS) {
            data = data.splice(0, MAX_SLOT_ELEMENTS);
        }

        // {"outcome" : "GRIM_Stroke", "chance":0.03115690731391455, "valid":true,"id":"GRIM_Stroke","name":"Stroke","text":null,
        // "icon":"heart.png", "category":"DEATH"}

        // Clear any previous slot machine
        // Should I call $("#machine1").slotMachine().destroy()?
        $('#machine1').empty();

        if (FAKE_TOP) { // Add 1 from it
            var img_path = IMG_PATH + randomElement(FAKE_TOP);
            addCauseToSlotMachine(img_path, name);
        }

        for (var i=0 ; i<data.length ; ++i) {
            var record = data[i];
            if (record["valid"] && record["icon"]) {
                var outcome = record["outcome"];
                var chance = record["chance"];
                var id = record["id"];
                var name = record["name"];
                var text = record["text"];
                var icon = record["icon"];

                var img_path = IMG_PATH + record["icon"];
                addCauseToSlotMachine(img_path, name);
            }
        }

        machine1 = $("#machine1").slotMachine({
            active	: 0,
            delay	: 500,
            randomize : function(activeElementIndex) {
                // Compensates for the 1 added from FAKE_TOP
                return 1 + Math.floor(Math.random() * data.length);
            }
        });
    };

    getOutcomes("DEATH", populateData);


    function onComplete(active) {
        console.log("active=" + active);
        var container = $(".slotMachineContainer", "#machine1");
        var selectdChild = container.children()[active+1];
        handleSpinEnd(selectdChild);
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
