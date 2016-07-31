GENDER_LOOKUP = {"M" : "Male", "F" : "Female"};
REGION_LOOKUP = ["Non-regional", "Regional"];

function getDemoDict(userProfile) {
    var DEMO_KEYS = ["gender", "age", "state", "regional"];
    var demo = {};
    for (var i=0 ; i<DEMO_KEYS.length ; ++i) {
        var k = DEMO_KEYS[i];
        var val = userProfile[k];
        if (val != null) {
            demo[k] = val;
        }
    }
    return demo;
}


function getRandomDemographic() {
    var gender = randomElement(Object.keys(GENDER_LOOKUP));
    var age = randomElement(getOptions("#age-select"));    
    var state = randomElement(getOptions("#state-select"));    
    var regional = Math.round(Math.random()) == true;

    var randProfile = {
        gender: gender,
        age: age,
        state: state,
        regional: regional,
    };

    var randomDemographic = getDemoDict(randProfile);
    console.log("randomDemographic");
    console.log(randomDemographic);
    return randomDemographic;
}


function getDemographicText(demo) {
    var age = demo['age'];
    var gender = demo['gender'];
    var state = demo['state'];
    var regional = demo['regional'];

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
    return demographicText || 'Average Australian';
}


function weightedChoice(data) {
    var totals = [];
    var runningTotal = 0.0;

    for (var i=0 ; i<data.length; ++i) {
        var record = data[i]
        runningTotal += record['chance'];
        totals.push(runningTotal);
    }

    var r = Math.random() * runningTotal;
    for (var i=0 ; i<totals.length ; ++i) {
        if (r < totals[i]) {
            return data[i];
        }
    }
    console.log("This should never happen");
}

function randomElement(myArray) {
    var i = Math.floor(Math.random() * myArray.length);
    return myArray[i];
}

function getOptions(selectSelect) {
    var options = [];
    $("option", selectSelect).each(function() {
        options.push($(this).val());
    });
    return options;    
}
