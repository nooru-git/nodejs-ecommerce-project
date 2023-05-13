var objectId = require('mongodb').ObjectId
var db = require('../config/connection')
var connection = require('../config/collections')
module.exports = {
    addProduct: (product, callback) => {
        console.log(product);

        db.get().collection('products').insertOne(product).then((data) => {
            callback(data.insertedId);
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(connection.PRODUCT_COLLECTIONS).find().toArray()
            resolve(products)

        })
    },
    deleteProduct: (ProductId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(connection.PRODUCT_COLLECTIONS).deleteOne({ _id: objectId(ProductId) }).then((response) => {
                resolve(response)
            })

        })
    },
    editProduct: (ProductId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(connection.PRODUCT_COLLECTIONS).findOne({ _id: objectId(ProductId) }).then((response) => {
                resolve(response)
            })
        })
    },
    updateProduct:(proDetails,proId) => {
        console.log(proDetails.productDescription)
        return new Promise(async (resolve, reject) => {
            let updated = await db.get().collection(connection.PRODUCT_COLLECTIONS).
                updateOne({ _id:objectId(proId) },   
                {
                    $set:{
                        productName:proDetails.productName,
                        productCategory:proDetails.productCategory,
                        productDescription:proDetails.productDescription,
                        productPrice:proDetails.productPrice, 
                    }

                })
            resolve(updated)
        })
    },

}
