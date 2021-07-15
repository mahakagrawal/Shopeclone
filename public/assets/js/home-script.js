var loadBtn = document.getElementById('load');
var start=0;
var end=4;   
    loadBtn.addEventListener("click", function(){
           start+=4;
           end+=4;
           var request = new XMLHttpRequest();
            request.addEventListener("load", function(response){
                console.log(response.target);
                console.log(request.status);
                if(request.status==404){
                    loadBtn.disabled=true;
                }
                else{
                    document.getElementById('product').innerHTML=document.getElementById('product').innerHTML + request.responseText;
                }
            });
            request.open("post","/load");
            var data = {
                 start:start,
                 end:end
            }
            
            request.setRequestHeader("Content-Type","application/json");
            
            request.send(JSON.stringify(data));
    });