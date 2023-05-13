var express = require('express');
var router = express.Router();
let productHelpers = require('../helpers/productHelpers');
let userHelper= require('../helpers/usersHelpers')
let verifyLoged=(req,res,next)=>{
  if (req.session.logedin){
    next()
  }
  else{
    res.redirect('/login') 
  }
}


/* GET ho me page. */
router.get('/',async function(req, res, next) {
  let user = req.session.user;
  let cartCount=null
  
  if(user){
    cartCount = await userHelper.getcartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((product)=>{
    res.render('users/usersProductView',{admin:false,title:"unitycart",product,user,cartCount});
  })
  
});
 
router.get('/login', function(req, res, next) {
    if(req.session.logedin){
      res.redirect('/')
    } 
    res.render('users/login' ,{admin: false,title:"unitycart","logErr":req.session.logederr});
    req.session.logederr=false
});

router.get('/signup', function(req, res, next) {
  res.render('users/signup' ,{title:"unitycart"});

});

router.post('/signup',(req,res,next)=>{
  userHelper.doSignup(req.body).then((response)=>{
  if(response){
    req.session.logedin=true
    req.session.user=response.user
    res.redirect('/')
  }else{
    res.redirect('/signup')
  }
  })
});
  
router.post('/login',(req,res,next)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.logedin=true;
      req.session.user=response.user; 
      res.redirect('/')
    }
    else{
      req.session.logederr="invalid username or password"
      res.redirect("/login")
    }    
  })
});

router.get('/logout',(req,res,next)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLoged,async(req,res)=>{
  let user=req.session.user;
  cartItems= await userHelper.getCartItems(req.session.user._id)
  let total= await userHelper.getTotalAmount(user._id)
  if(total !=0){
  let placeOrder='Place Order'
  res.render('users/cart',{cartItems,user,total,placeOrder})
  }
  res.render('users/cart',{cartItems,user,total}) 

})
 
router.get('/add-to-cart/:id',verifyLoged,(req,res)=>{ 
  let user=req.session.user; 
  proId=req.params.id
  userHelper.addTocart(proId,user._id).then((response)=>{
    res.json({status:true})
  }) 
})
 
router.post('/change-quantity/',(req,res,next)=>{
  //console.log(req.body)
 userHelper.changeQuantity(req.body).then(async(response)=>{
  response.total = await userHelper.getTotalAmount(req.body.user) 
    res.json(response)
 }) 
})

router.post('/remove-cart/',(req,res,next)=>{
  userHelper.removeCart(req.body).then((response)=>{
   res.json(response) 
  })
})   

router.get('/place-order/', verifyLoged, async(req,res,next)=>{
  let user=req.session.user;
  let total = await userHelper.getTotalAmount(user._id)
  res.render('users/placeOrder',{user,total})  
})


router.post('/place-order/',async(req,res)=>{
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  let products=await userHelper.getCartList(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((response)=>{
    if(req.body['payment-method'] === 'COD'){
      res.json({CodSuccess:true}) 
    }else{ 
      userHelper.generateRazorePay(response,totalPrice).then((response)=>{
        console.log(' iam here')
        res.json(response)
       
      }) 
    
   }
       
  }) 

})


router.get('/order-placed/',verifyLoged,(req,res)=>{ 
  let user = req.session.user;
  res.render('users/orderplaced',{user}) 
})


router.get('/orders-list/',verifyLoged, async(req,res)=>{
  let user= req.session.user
  let orders = await userHelper.getOrders(user._id) 
  res.render('users/orders-list',{user,orders})
 })
 

 router.get('/view-order-products/:id',verifyLoged,async(req,res)=>{
  let user= req.session.user;
  let products =await userHelper.getviewOrderProducts(req.params.id)
  res.render('users/viewOrderProducts',{user,products})
 })

 router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then((response)=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then((response)=>{
      console.log("payment successfull")
      res.json({status:true})
    })
  }).catch((err)=>{

    console.log(err)
    res.json({status:false,errMsg:'payment not success'})
  })
 })


module.exports = router;
