window.delete= function(id){

    var request = new XMLHttpRequest();

    request.addEventListener("load", function(response){
        window.location.href = "/product";
    });

    request.open("post","/delete_product");
    var data = {
         id:id
    }
    
    request.setRequestHeader("Content-Type","application/json");
    
    request.send(JSON.stringify(data));
}