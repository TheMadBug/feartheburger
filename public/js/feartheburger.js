window.userProfile = {
    gender: null,
    age: null,
    state: null,
    regional: null,
};

NUM_SLOT_ELEMENTS = 10;
IMG_PATH = "/img/flat/";


// We put 1 of these on the top - but they can never be picked (we rig the slot machine function in randomizeSlotMachine)
// The normal shark/terrorism etc will be added in per normal odds so it could be picked
FAKE_TOP = ['shark2.png', 'terrorism.png'];




function setDemographicText() {
    var demographicText = getDemographicText(userProfile);
    $("#demographic-display").text(demographicText);
}


function getOutcomes(category, callBackFunc) {
    var demo = getDemoDict(userProfile);
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

function clearSpinResults() {
    var resultContainer = $("#spin-result-description-container");
    var chartDiv = $("#chart_div", resultContainer)
    var resultText = $("#spin-result-text", resultContainer)

    chartDiv.empty();
    resultText.empty();
}


function drawCharts(category, spunResult) {
    var demo = getDemoDict(userProfile);
    var randomDemo = getRandomDemographic();
    var demoAStr = 'demoA=' + encodeURIComponent( JSON.stringify( demo ));
    var demoBStr = '&demoB=' + encodeURIComponent( JSON.stringify( randomDemo ));
    var categoryStr = '&category=' + category;
    var url = '/outcomesCompare?' + demoAStr + demoBStr + categoryStr;
    $.get(url, function(data) {
        console.log(data)
        drawComparisonChart(data, demo, randomDemo, spunResult);
    });

}



function handleSpinEnd(category, element) {
    console.log("handleSpinEnd")
    console.log(element);
    var spunResult = $(element);
    var resultContainer = $("#spin-result-description-container");
    var name = spunResult.attr("name");
    console.log("name = " + name);
    var resultText = $("#spin-result-text", resultContainer)
    resultText.text(name)

    drawCharts(category, spunResult);
}





function addCauseToSlotMachine(img_path, name) {
    jQuery('<img/>', {
        src: img_path,
        class: 'cause-of-death-image',
        name: name,
    }).appendTo('#machine1');
}

function setupMain(category) {
    console.log("Setup Main");

    // So - need to go through this, and using the chance, pick out X (enough for the )
    var populateData = function(data) {
        // {"outcome" : "GRIM_Stroke", "chance":0.03115690731391455, "valid":true,"id":"GRIM_Stroke","name":"Stroke","text":null,
        // "icon":"heart.png", "category":"DEATH"}

        // Clear any previous slot machine
        // Should I call $("#machine1").slotMachine().destroy()?
        $('#machine1').empty();

        if (FAKE_TOP) { // Add 1 from it
            var img_path = IMG_PATH + randomElement(FAKE_TOP);
            addCauseToSlotMachine(img_path, name);
        }

        var slotElements = [];

        for (var i=0 ; i<NUM_SLOT_ELEMENTS; ++i) {
            var choice = weightedChoice(data);
            // console.log("choice=" + choice["name"]);
            slotElements.push(choice);
        }

        var totalChance = 0;
        for (var i=0 ; i<slotElements.length ; ++i) {
            var record = slotElements[i];
            if (record["valid"] && record["icon"]) {
                var outcome = record["outcome"];
                var chance = record["chance"];
                var id = record["id"];
                var name = record["name"];
                var text = record["text"];
                var icon = record["icon"];

                totalChance += chance;

                var img_path = IMG_PATH + record["icon"];
                addCauseToSlotMachine(img_path, name);
            }
        }

        console.log("total chance = " + totalChance);

        machine1 = $("#machine1").slotMachine({
            active	: 0,
            delay	: 500,
            randomize : function(activeElementIndex) {
                // Compensates for the 1 added from FAKE_TOP
                return 1 + Math.floor(Math.random() * slotElements.length);
            }
        });
    };

    getOutcomes(category, populateData);


    function onComplete(active) {
        console.log("active=" + active);
        var container = $(".slotMachineContainer", "#machine1");
        var selectdChild = container.children()[active+1];
        handleSpinEnd(category, selectdChild);
    }

    $("#spinButton").click(function(){
        clearSpinResults();
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

        setDemographicText();

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
    setupMain("DEATH");
    setupProfile();
    setupConfig();    
});
