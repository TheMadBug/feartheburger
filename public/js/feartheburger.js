$(document).ready(function(){
    var machine1 = $("#machine1").slotMachine({
        active	: 0,
        delay	: 500
    });

    function onComplete(active){
        switch(this.element[0].id){
            case 'machine1':
                $("#machine1Result").text("Index: "+this.active);
                break;
            case 'machine2':
                $("#machine2Result").text("Index: "+this.active);
                break;
            case 'machine3':
                $("#machine3Result").text("Index: "+this.active);
                break;
        }
    }

    $("#ranomizeButton").click(function(){

        machine1.shuffle(5, onComplete);

    })
});
