// Load the Visualization API and the corechart package.
console.log("Loading charts...");
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(function() {
    console.log("charts loaded");
});

console.log("Finished Loading charts...");

function drawDemoChart() {

    // 2 columns - Cause, Difference
    var causeDiff = [
        ['Sharks', -10],
        ['Goblins', -5],
        ['Terrorists', 20],
    ];

    // Add color based on value
    for (var i=0 ; i<causeDiff.length ; ++i) {
        var row = causeDiff[i];
        var color = 'red';
        if (row[1] > 0) {
            color = 'green';
        }        
        var style = 'opacity: 0.5; color: ' + color;
        row.push(style)
    }

    var jsArray = [['Cause', 'Diff', { role: 'style' } ]].concat(causeDiff);
    console.log(jsArray);
    var data = google.visualization.arrayToDataTable(jsArray);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
                    { calc: "stringify",
                        sourceColumn: 1,
                        type: "string",
                        role: "annotation" },
                    2]);

    var options = {
        title: "How you compare",
        width: 600,
        height: 400,
        bar: {groupWidth: "95%"},
        legend: { position: "none" },
    };
    var container = document.getElementById('chart_div');

    var chart = new google.visualization.BarChart(container);
    chart.draw(view, options);
}
