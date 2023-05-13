var express = require('express');
var router = express.Router(); 
const productHelpers = require('../helpers/productHelpers')

/* GET users list ing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((product)=>{
    res.render('admin/allProducts' ,{admin: true,title:"unitycart",product});
  }) 
 
});

router.get('/add-product',(req,res,next)=>{
  res.render('admin/add-product',{admin:true,title:'addproducts'})
})

router.get('/edit-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.editProduct(proId).then((proDetails)=>{
    console.log(proDetails.productDescription)
    res.render('admin/edit-product',{admin:true,proDetails,proId})

  })
})
router.post('/edit-product/',(req,res)=>{ 
  let id=req.query.id
  productHelpers.updateProduct(req.body,id).then((updateData)=>{
    res.redirect('/admin')
    let image = req.files.productImage
    image.mv('./public/product-image/'+id+'.jpg')

  })
})

router.get('/delete-product/',(req,res)=>{
  let proId=req.query.id
  productHelpers.deleteProduct(proId).then((result)=>{
    console.log(result)
    res.redirect('/admin') 
  }) 
}) 

router.post('/add-product/',(req,res,next)=>{
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.productImage 
    image.mv('./public/product-image/'+id+'.jpg',(err,data)=>{
      if(!err){ 
        res.redirect('/admin/add-product')
      }
      else{
        console.log(err)
      }  
    })
  })

})

module.exports = router;
