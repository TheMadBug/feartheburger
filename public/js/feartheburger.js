window.userProfile = {
    gender: null,
    age: null,
    state: null,
    regional: null,
};

AUTO_SCROLL_TO_RESULTS_SECONDS = 1.5;
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
    var demoStr = 'demo=' + encodeURIComponent(JSON.stringify(demo));
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
    $('.result-container').empty();
}


function drawCharts(category, spunResult) {

    loadRiskChart(category, spunResult);
    loadCompareChart(category, spunResult);

}


function loadRiskChart(category, spunResult) {
    // TODO: This is a 2nd API call - same as we used to populate spinner, can we do both?
    getOutcomes(category, function(data) {
        var chartDiv = document.getElementById('risk-chart');
        drawRiskChart(chartDiv, data, spunResult);
    });
}


function loadCompareChart(category, spunResult) {
    var demo = getDemoDict(userProfile);
    var randomDemo = getRandomDemographic();
    var demoAStr = 'demoA=' + encodeURIComponent(JSON.stringify(demo));
    var demoBStr = '&demoB=' + encodeURIComponent(JSON.stringify(randomDemo));
    var categoryStr = '&category=' + category;
    var url = '/outcomesCompare?' + demoAStr + demoBStr + categoryStr;
    $.get(url, function(data) {
        var chartDiv = document.getElementById('compare-chart');
        drawComparisonChart(chartDiv, data, demo, randomDemo, spunResult);
    });
}


function handleSpinEnd(category, element) {
    var spunResult = $(element);
    console.log("spunResult");
    console.log(spunResult);
    var resultContainer = $("#spin-result-description-container");

    setTimeout(function() {

        $('html, body').animate({
            scrollTop: $(resultContainer).offset().top
        }, 2000);
    }, AUTO_SCROLL_TO_RESULTS_SECONDS * 1000);

    var name = spunResult.attr("name");
    var resultName = $("#spin-result-name", resultContainer)
    resultName.text(name)

    var img = spunResult.clone();
    $("#spin-result-img-container").append(img);

    var text = spunResult.attr("text");
    var resultText = $("#spin-result-text", resultContainer)
    if (text) {
        resultText.html(text);
    }
    drawCharts(category, spunResult);
}



function addCauseToSlotMachine(img_path, name) {
    var e = jQuery('<img/>', {
        src: img_path,
        class: 'cause-of-death-image',
        name: name,
    });
    e.appendTo('#machine1');
    return e;
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

        for (var i = 0; i < NUM_SLOT_ELEMENTS; ++i) {
            var choice = weightedChoice(data);
            // console.log("choice=" + choice["name"]);
            slotElements.push(choice);
        }

        var totalChance = 0;
        for (var i = 0; i < slotElements.length; ++i) {
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
                var img = addCauseToSlotMachine(img_path, name);
                img.attr("text", text);
            }
        }

        console.log("total chance = " + totalChance);

        machine1 = $("#machine1").slotMachine({
            active: 0,
            delay: 500,
            randomize: function(activeElementIndex) {
                // Compensates for the 1 added from FAKE_TOP
                return 1 + Math.floor(Math.random() * slotElements.length);
            }
        });
    };

    getOutcomes(category, populateData);


    function onComplete(active) {
        var container = $(".slotMachineContainer", "#machine1");
        var selectdChild = container.children()[active + 1];
        handleSpinEnd(category, selectdChild);
    }

    $("#spinButton").click(function() {
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

function setMachineSize() {
    var w = $(window).width();
    var h = $(window).height();

    if (h < w) {
        //use height as main
        h -= 210;
        w = h * 1.2;
    } else {
        //use width as main
        w -= 36;
        h = w * 0.83;
        $(".randomizeMachine").css('width', ($(window).width() * .89) + 'px');
    }
    $(".randomizeMachine").css('width', w + 'px');
    $(".randomizeMachine").css('height', h + 'px');
}

$(document).ready(function() {
    setMachineSize();
    $(".initial-hide").hide();
    setupMain("DEATH");
    setupProfile();
    setupConfig();
});