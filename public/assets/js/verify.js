window.onload = function(){
    var request = new XMLHttpRequest();
     request.addEventListener("load", function(response){
                if(request.status=="404"){
                    window.location.href="/login";
                }
     });
     request.open("post","/verifyToken");
     request.send();
}