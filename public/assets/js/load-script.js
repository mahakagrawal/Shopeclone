window.func= function(id){

    var request = new XMLHttpRequest();

    request.addEventListener("load", function(response){
        window.location.href = "/description";
    });

    request.open("post","/description");
    var data = {
         id:id
    }
    
    request.setRequestHeader("Content-Type","application/json");
    
    request.send(JSON.stringify(data));
}