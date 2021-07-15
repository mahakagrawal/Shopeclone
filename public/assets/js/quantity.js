window.increase = function(id){
    var quantity = document.getElementById(id);
    var request = new XMLHttpRequest();
    request.addEventListener("load", function(response){
        if(request.status==302){
            quantity.innerText=parseInt(quantity.innerText)+1;
            var increment = document.getElementById('increment'+id);
            var decrement = document.getElementById('decrement'+id);
            decrement.disabled=false;
        }
        if(request.status==200){
            var increment = document.getElementById('increment'+id);
            var decrement = document.getElementById('decrement'+id);
            document.getElementById('msg').innerText="Cannot select more products";
            increment.disabled=true;
            decrement.disabled=false;
        }
    });
    request.open("post","/increase-quantity");
    var data = {
        prodid:id,
        desiredQuantity:quantity.innerText
    }
   
   request.setRequestHeader("Content-Type","application/json");
   
   request.send(JSON.stringify(data));
}
window.decrease = function(id){
    var quantity = document.getElementById(id);
    if(quantity.innerText>1){
    var request = new XMLHttpRequest();
    request.addEventListener("load", function(response){
        if(request.status==302){
            var increment = document.getElementById('increment'+id);
            var decrement = document.getElementById('decrement'+id);
            quantity.innerText=parseInt(quantity.innerText)-1;
            document.getElementById('msg').innerText="";
            increment.disabled=false;
        }
    });
    request.open("post","/decrease-quantity");
    var data = {
        prodid:id,
        desiredQuantity:parseInt(quantity.innerText)
    }
   
   request.setRequestHeader("Content-Type","application/json");
   
   request.send(JSON.stringify(data));
}else{
    var decrement = document.getElementById('decrement'+id).disabled=true;
}
}
