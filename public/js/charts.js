GRAPH_HEIGHT_PER_DATA_ELEMENT = 35;
MIN_GRAPH_WIDTH = 500;

// Load the Visualization API and the corechart package.
console.log("Loading charts...");
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(function() {
    console.log("charts loaded");
});


function getChartWidth() {
    var width = "80%";
    if (window.innerWidth < MIN_GRAPH_WIDTH) {
        width = MIN_GRAPH_WIDTH + "px";
    }
    return width;
}

function getRisk(data) {
    var causeRisk = [];
    for (var i = 0; i < data.length; ++i) {
        var row = data[i];
        var name = row['name'];
        var chance = row['chance'];
        if (chance != null) {
            causeRisk.push([name, chance]);
        }
    }
    return causeRisk;
}

function drawRiskChart(chartDiv, data, spunResult) {
    var spunName = spunResult.attr("name");
    var causeRisk = getRisk(data);

    // Add color based on value
    for (var i = 0; i < causeRisk.length; ++i) {
        var row = causeRisk[i];
        var style = 'opacity: 0.5; color: blue';
        if (row[0] == spunName) {
            style = 'opacity: 0.8; color: red';
        }
        row.push(style)
    }

    var jsArray = [
        ['Cause', 'Risk', { role: 'style' }]
    ].concat(causeRisk);
    var data = google.visualization.arrayToDataTable(jsArray);

    var view = new google.visualization.DataView(data);
    var title = "Risks of death";
    var height = causeRisk.length * GRAPH_HEIGHT_PER_DATA_ELEMENT;

    var options = {
        title: title,
        width: getChartWidth(),
        height: height,
        bar: { groupWidth: "95%" },
        legend: { position: "none" },
        vAxis: { textStyle: { fontSize: 8 } },
        chartArea: { width: "50%", height: "70%" },
    };
    var chart = new google.visualization.BarChart(chartDiv);
    chart.draw(view, options);
}



function getCauseDiff(data) {
    var causeDiff = [];
    for (var i = 0; i < data.length; ++i) {
        var row = data[i];
        var name = row['name'];
        var chanceDiff = row['chanceDiff'];
        if (chanceDiff != null) {
            causeDiff.push([name, chanceDiff]);
        }
    }
    return causeDiff;
}

function drawComparisonChart(chartDiv, data, demoA, demoB, spunResult) {
    var causeDiff = getCauseDiff(data);
    if (causeDiff.length == 0) {
        console.log("Empty cause diff!!!");
        return;
    }

    // Add color based on value
    for (var i = 0; i < causeDiff.length; ++i) {
        var row = causeDiff[i];
        var color = 'red';
        if (row[1] > 0) {
            color = 'green';
        }
        var style = 'opacity: 0.5; color: ' + color;
        row.push(style)
    }

    var jsArray = [
        ['Cause', 'Diff', { role: 'style' }]
    ].concat(causeDiff);
    var data = google.visualization.arrayToDataTable(jsArray);

    var view = new google.visualization.DataView(data);
    var title = getDemographicText(demoA) + " vs " + getDemographicText(demoB);
    var height = causeDiff.length * GRAPH_HEIGHT_PER_DATA_ELEMENT;

    var options = {
        title: title,
        width: getChartWidth(),
        height: height,
        bar: { groupWidth: "95%" },
        legend: { position: "none" },
        chartArea: { width: "50%", height: "70%" },
    };
    var chart = new google.visualization.BarChart(chartDiv);
    chart.draw(view, options);
}