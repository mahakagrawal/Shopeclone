const express = require('express')
const path = require('path')
const fs = require('fs')
const session = require('express-session');	
const multer  = require('multer');
const mailjet_clinet = require ('node-mailjet');
const app = express()
const port = process.env.PORT || 3000
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var jwt_secret = "my secret";
app.use(express.static('public'))
app.use(express.static('assets'))
app.use(cookieParser());
app.use(express.json());
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/views'));

app.use(express.urlencoded({extended:false}));

var mailjet = mailjet_clinet.connect('9522e8317e7867155066fa13c6f4efe4', 'e2a94332c4c7a99e71b7418f29035da4')

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(function(req,res,next){
    var token = req.cookies.auth;
    if(token){
        jwt.verify(token,jwt_secret,function(err,data){
            req.profile = data;
            next();
        });
    }
    else{
        req.profile = {};
        next();
    }
})

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, 'public/assets/productImg/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
   
  var upload = multer({ 
      storage: storage,
      fileFilter: fileFilter
  })
  
  function fileFilter(req, file, cb)
  {
      console.log(file)
  
  
      if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg")
      {
          cb(null, true);
  
      }
      else
      {
          cb("not supported extension", false);
      }
  }

app.get('/', (req, res) => {
    if (!req.cookies.auth){
        res.redirect("/login");
    }
    else{
        console.log(req.profile);
            if(req.profile.username == req.cookies.username)
            {
                var i=0;
                var j=4;
                readProduct(function(products)
                {
                    res.render("home",{products:products,start:i,end:j})
                },i,j);
            }
            else
            {
                res.redirect("/login");
            }
    }
});

app.post('/load', (req, res) => {
    var i=req.body.start;
    var j=req.body.end;
    readProduct(function(products)
    {
        if(products.length>0){
            res.render("load",{products:products})
        }
        else{
            res.status(404).send('Sorry, cant find that');
        }
        
    },i,j);
});

app.post('/view', (req, res) => {
    var id=req.body.id;
    checkDesc(function(desc){
         res.render("view",{desc:desc.desc,product:desc});
    },id);
});

app.post('/description', (req, res) => {
    var id=req.body.id;
    checkDesc(function(desc)
    {
        req.session.pid = desc.id;
        res.render("description",{desc:desc.desc,product:desc,cart_items:['']});
    },id);
});

app.get('/description',(req,res) =>{
    if (!req.cookies.auth){
        res.redirect('/login');
    }
    else{
        var pid = req.session.pid;
        checkDesc(function(desc){
            fs.readFile("./cart.txt","utf-8", function(err, data)
            {
                if(err){
                    res.render("description",{desc:err});
                }
                else{
                    data  = data ? JSON.parse(data) : [];
                    var check = data.filter(function(cart)
                    {
                        if(cart[desc.id] ==true && cart['user']==req.cookies.username)
                        {
                            res.render("description",{desc:desc.desc,product:desc,cart_items:cart});
                            return true;
                        }
                    })
                    if(!check.length)
                    {
                        res.render("description",{desc:desc.desc,product:desc,cart_items:['']});
                    }
                }
            });
        },pid);
    }
});

app.post('/verifyToken', (req, res) => {
    if(!req.cookies.auth){
        res.status(404).send();
    }
});

app.get('/logout', (req,res)=>{
    res.clearCookie("auth");
    res.redirect("/login");
});

function checkDesc(callback,id)
{
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        var description = data.filter(function(product)
        {
            if(product.id == id)
            {
                callback(product);
                return true;
            }
        });
    })
}

app.post('/add_to_cart', (req, res) =>{
    
    var product_id = req.body.prodid;
    
    readProduct(function(product)
    {
        readCart(function(cart)
        {
            var data = new Object();
            data[product_id]=true;
            data['quantity']=1;
            data['user']=req.cookies.username;
            cart.push(data);

            saveToCart(cart, function()
            {
                console.log("successfully added to cart");
                res.render("description",{product:product,cart_items:cart,desc:''});
            });
            
        });

    });
});

app.post('/increase-quantity', (req, res) =>{
    var id = req.body.prodid;
    var quantity = parseInt(req.body.desiredQuantity);
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        var stock;
        product  = data ? JSON.parse(data) : [];
        var pro = product.filter(function(products){
                    if(products.id ==id && products.stock>quantity){
                        stock = 'available';
                        return true;
                    }
                  });
        if(!pro || stock != 'available'){
            res.status(200).send();
        }
        else{
            stock = 'unavailable';
            readCart(function(cart){
                cart.filter(function(cartt){
                    if(cartt[id] ==true && cartt['user']== req.cookies.username){
                        cartt['quantity']=quantity+1;
                        fs.writeFile("./cart.txt", JSON.stringify(cart),function(err){
                            res.status(302).send();
                        });
                        return true;
                    }
                });
            });
        }
    });
});

app.post('/decrease-quantity', (req, res) =>{
    var id = req.body.prodid;
    var quantity = parseInt(req.body.desiredQuantity);
    readCart(function(cart){
        cart.filter(function(cartt){
            if(cartt[id] ==true && cartt['user']== req.cookies.username){
                cartt['quantity']=quantity-1;
                fs.writeFile("./cart.txt", JSON.stringify(cart),function(err){
                    res.status(302).send();
                });
                return true;
            }
        });
    });
});

app.post('/delete_from_cart', (req, res) =>{
    
    var id = req.body.prodid;
    
     readCart(function(cart){
        cart.filter(function(cartt,index){
            if(cartt[id] ==true && cartt['user']==req.cookies.username){
                cart.splice(index,1);
                fs.writeFile("./cart.txt", JSON.stringify(cart),function(err){
                    res.status(302).send();
                });
                return true;
            }
        });
    });
});

app.get("/checkout", function(req,res){
    var checkoutList=[];
    readProduct(function(products){
        readCart(function(cart){
            cart.filter(function(cartItem){
                products.filter(function(product){
                    if(cartItem[product.id]==true && cartItem['user']==req.cookies.username){
                        if(cartItem['quantity']>product.stock){
                            product['quantity']=cartItem['quantity'];
                            checkoutList.push(product);
                            return true;
                        }
                    }
                })
            })
            if(checkoutList.length > 0){
                res.render("checkout",{msg:"failed",checkoutList:checkoutList});
            }
            else{
                products.filter(function(product){
                    cart.filter(function(cartItem,index){
                        if(cartItem[product.id]==true && cartItem['user']==req.cookies.username){
                            product.stock = product.stock - cartItem.quantity;
                            cart.splice(index,1);
                            return true;
                        }
                    });
                });
                fs.writeFile("./products.txt",JSON.stringify(products),function(err){
                    fs.writeFile("./cart.txt",JSON.stringify(cart),function(error){
                        console.log(err,error);
                    });
                });
                res.render("checkout",{msg:"successful",checkoutList:checkoutList});
            }
        })
    })
})
app.get("/cart", function(req, res){
    readProduct(function(products){
        readCart(function(cart){
            var cart_items = [];
            for(var i=0;i<cart.length;i++){
                for(var key in cart[i]){
                        console.log(key);
                        var filtered_product = products.find(function(product){
                            if(key == product.id && cart[i]['user']==req.cookies.username){
                                return true;
                            }
                        })
                        break;
                    }
                    if(filtered_product){
                        filtered_product['quantity']=cart[i].quantity;
                        console.log(filtered_product['quantity']);
                        console.log(filtered_product);
                        cart_items.push(filtered_product)
                    }
            }

            res.render("cart",{products:cart_items})

        })
    })
})


function saveToCart(data, callback)
{
    fs.writeFile("./cart.txt", JSON.stringify(data),function(err)
    {
        callback(err);
    });
}



function readCart(callback)
{
    fs.readFile("./cart.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data);
    })
}

app.get("/login", function(req, res)
{
    res.render("login",{error:"",message:""})
})

app.get("/signup", function(req, res)
{
    res.render("signup",{error:""})
})

app.get("/reset", function(req, res)
{
    res.render("reset",{error:"",username:"",status:""})
})

app.post("/reset", function(req, res){
    var username = req.body.username;
    readUsersFromFile(function(users)
    {
        var existing_user = users.filter(function(user)
            {
                if(user.username === username)
                {
                    return true;
                }
        })
        if(!existing_user.length){
            res.render("reset",{error:"email not registered",username:"",status:""})
        }
        else{
            if(typeof req.body.password == "undefined"){
                var tokencode = Math.floor(1000 + Math.random() * 9000);
                requestVerificationMail(tokencode,username);
                res.redirect("/wait");
            }
            else{
                var password = req.body.password;
                readUsersFromFile(function(users){
                    users.filter(function(user){
                        if(user.username === username)
                        {
                            user.password=password;
                            fs.writeFile('./users.txt',JSON.stringify(users),function(err){
                                res.redirect("/login");
                            })
                        }
                    })
                })
            }
        }
    })
})
app.post('/login', (req, res) => 
{
    var username =  req.body.username;
    var password =  req.body.password;

    readUsersFromFile(function(users)
    {
        var verified;
        var exixting_user = users.filter(function(user)
            {
                verified=false;
                if(user.username === username && user.password === password)
                {
                    if(user.is_verified==true){
                        verified=true;
                        return true;
                    }
                    else{
                        verified=false;
                    }
                }
            })

        if(!exixting_user.length)
        {
            if(verified==false){
                res.render("login",{error:"",message:"Verify your email"})
            }
            else{
                res.render("login",{error:"user not found",message:""})
            }
        }
        else
        {
            jwt.sign({username:username}, jwt_secret, { }, function(err,token){
                res.cookie("auth",token);
                res.cookie("username",username);
                res.redirect("/");

            });
        }
    });
});

app.get("/verify_request", function(req, res)
{
    var tokenrcv = req.query.verification_key;
    var useremail = req.query.email;

    res.render("reset",{error:"",username:useremail,status:true});
           
})

function requestVerificationMail(tokensent,username)
{
  const request = mailjet.post("send", {'version': 'v3.1'}).request({
  "Messages":[
    {
      "From": {
        "Email": "er.mahak2001@gmail.com",
        "Name": "Mahak Agrawal"
      },
      "To": [
        {
          "Email": username,
          "Name": "User"
        }
      ],
      "Subject": "Verify you Shopeclone Account.",
      "TextPart": "This Mail is to verify your Shopeclone Account",
      "HTMLPart": "<h3>Dear User, Welcome to Shopeclone </h3><br><h3><a href='http://localhost:3000/verify_request?verification_key="+tokensent+"&email="+username+"'>Verify your account</a>!</h3><br />May the delivery force be with you!",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})

request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err)
  })

}

app.post('/signup', (req, res) => 
{
    var username =  req.body.username;
    var password =  req.body.password;
    var fullname = req.body.fullname;

    readUsersFromFile(function(users)
    {
        var exixting_user = users.filter(function(user)
        {
            if(user.username === username)
            {
                return true;
            }
        });

        if(exixting_user.length)
        {
            res.render("signup",{error:"user already exist"})
        }
        else
        {
            var tokencode = Math.floor(1000 + Math.random() * 9000);
            console.log(tokencode);
            var dataa = {
                username: username,
                password: password,
                fullname: fullname,
                is_admin:false,
                is_verified:false,
                verification_key:""+tokencode+""
            }
            users.push(dataa);
            jwt.sign({username:username}, jwt_secret, { }, function(err,token){
                sendVerificationMail(tokencode,username);
                saveUser(JSON.stringify(users),function(err){
                    if(err){
                        res.render("signup",{error:"error while creating user"})
                    }
                    else{
                        res.cookie("auth",token);
                        res.cookie("username",username);
                        res.redirect('/wait');
                    }
                });
            });
        }
    });
});
function sendVerificationMail(tokensent,username)
{
  const request = mailjet.post("send", {'version': 'v3.1'}).request({
  "Messages":[
    {
      "From": {
        "Email": "er.mahak2001@gmail.com",
        "Name": "Mahak Agrawal"
      },
      "To": [
        {
          "Email": "er.mahak2001@gmail.com",
          "Name": "User"
        }
      ],
      "Subject": "Verify you Shopeclone Account.",
      "TextPart": "This Mail is to verify your Shopeclone Account",
      "HTMLPart": "<h3>Dear User, Welcome to Shopeclone </h3><br><h3><a href='http://localhost:3000/verify_account?verification_key="+tokensent+"&email="+username+"'>Verify your account</a>!</h3><br />May the delivery force be with you!",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})

request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err)
  })

}
app.get("/verify_account", function(req, res)
{
    var tokenrcv = req.query.verification_key;
    var useremail = req.query.email;

    readUsersFromFile(function(data){

        var exixting_user = data.filter(function(user,index)
        {
            if(user.username === useremail && user.verification_key===tokenrcv)
            {
                user.is_verified = true;
                fs.writeFile("./users.txt",JSON.stringify(data), function(err){
                    res.send("Email Verification is succesfull, <a href='/login'>login </a>to continue");
                })           
            }
        })

    })
})
app.get('/product', (req, res) => 
{
    var token = req.cookies.admin;
    if(!req.cookies.admin){
        res.render("admin_login",{error:""})
    }
    else{
        jwt.verify(token,jwt_secret,function(err,data){
            req.prof = data;
            if(req.prof.is_admin==true){
                readProd(function(products){
                    res.render("product",{products:products})
                });
            }
        });
    }
})
app.get('/add_product', (req, res) => 
{
    if(!req.cookies.admin){
        res.render("admin_login",{error:""})
    }
    else{
        res.render("add_product");
    }
})
app.post('/add_product', upload.single("productimg"), (req, res) => 
{
    var title = req.body.title;
    var desc = req.body.desc;
    var stock = req.body.stock;
    var price = req.body.price;
    var path = req.file.filename;
    readProd(function(products){
        if(products.length>0){
            var len = products.length - 1;
            var id = products[len].id + 1;
        }
        else{
            var id = 1;
        }
        products.push({
            id:id,
            title:title,
            desc:desc,
            stock:stock,
            src:path,
            price:price
        })
        fs.writeFile('./products.txt',JSON.stringify(products),function(err){
            res.redirect('/product');
            return true;
        })
    })
});
app.get('/update', (req, res) => 
{
    var id = req.query.id;
    if(!req.cookies.admin){
        res.render("admin_login",{error:""})
    }
    else{
        res.render("update_product",{id:id});
    }
})
app.post('/update', upload.single("productimg"), (req, res) => 
{
    var id= req.body.id;
    console.log(id);
    var title = req.body.title;
    var desc = req.body.desc;
    var stock = req.body.stock;
    var price = req.body.price;
    var path = req.file.filename;
    readProd(function(products){
        products.filter(function(product){
           if(product.id == id){
                product.title=title;
                product.desc=desc;
                product.stock=stock;
                product.price=price;
                product.src=path;
                console.log(product);
                fs.writeFile('./products.txt',JSON.stringify(products),function(err){
                    res.redirect('/product');
                    return true;
                })
           }
        })
    })
});
app.post('/delete_product', (req, res) => 
{
    var id = req.body.id;
    console.log(id);
    readProd(function(products){
         products.filter(function(product,index){
            if(product.id == id){
                products.splice(index,1);
                console.log(products);
                fs.writeFile("./products.txt", JSON.stringify(products), function(err)
                {
                    console.log(err)
                    res.send();
                })

            }
         })
    });
})
app.get("/admin_login", function(req, res)
{
    res.render("admin_login",{error:""})
})
app.post('/admin_login', (req, res) => 
{
    var username =  req.body.username;
    var password =  req.body.password;

    readUsersFromFile(function(users)
    {
        var exixting_user = users.filter(function(user)
            {
                if(user.username === username && user.password === password && user.is_admin==true)
                {
                    return true;
                }
            })

        if(!exixting_user.length)
        {
            res.render("admin_login",{error:"Not Authorized"})
            
        }
        else
        {
            jwt.sign(exixting_user[0], jwt_secret, { }, function(err,token){
                res.cookie("admin",token);
                res.redirect("/product");
            });
        }
    });
});

function readUsersFromFile(callback)
{
    fs.readFile("./users.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data);
    })
}

function saveUser(data,callback)
{
    fs.writeFile("./users.txt", data,function(err)
    {
        callback(err);
    });
}

function readProduct(callback,i,j)
{
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data.slice(i,j));
    })
}

function readProd(callback)
{
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data);
    })
}

app.get("/logout", function(req, res)
{
    req.session.destroy();
    res.render('logout');
});

app.get("/wait", function(req, res)
{
    res.render('wait');
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})