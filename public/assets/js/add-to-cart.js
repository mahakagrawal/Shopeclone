window.func= function(id,title,imgpath,prodesc,proprice){

    var request = new XMLHttpRequest();
    request.addEventListener("load", function(response){
        console.log(response.target);
        document.getElementById('changebtn').innerHTML="ADDED TO CART";
        document.getElementById('changebtn').disabled = true;
    });
    request.open("post","/add_to_cart");
    var data = {
        prodid:id,
        prodtitle:title,
        prodImg:imgpath,
        proddesc:prodesc,
        prodprice:proprice
   }
   
   request.setRequestHeader("Content-Type","application/json");
   
   request.send(JSON.stringify(data));
}