window.deleteFromCart = function(id){
    var request = new XMLHttpRequest();
    request.addEventListener("load", function(response){
        if(request.status==302){
            window.location.href="/cart";
        }
    });
    request.open("post","/delete_from_cart");
    var data = {
        prodid:id,
    }
   
   request.setRequestHeader("Content-Type","application/json");
   
   request.send(JSON.stringify(data));
}