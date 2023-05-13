var objectId = require('mongodb').ObjectId
var db = require('../config/connection')
var connection = require('../config/collections')
var bcrypt = require('bcrypt')
const Razorpay = require('razorpay');
const { promises } = require('node:dns');


var instance = new Razorpay({
    key_id: 'rzp_test_HsBO4E50rGOL5z',
    key_secret: 'tvnOl89SS0DzD4iYrkZDDewq',
});
module.exports = {
    doSignup: (userdata) => {

        return new Promise(async (resolve, reject) => {
            userdata.Password = await bcrypt.hash(userdata.Password, 10)
            console.log(userdata)
            db.get().collection(connection.USER_DATA).insertOne(userdata).then((data) => {
                resolve(data)

            })

        })

    },
    doLogin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(connection.USER_DATA).findOne({ emai: userdata.emai })
            let login_status = false
            let response = {}

            if (user) {
                bcrypt.compare(userdata.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login success')
                        response.user = user
                        response.status = true;
                        resolve(response)
                    }
                    else {
                        console.log('login attempt failed! wrong password')
                        resolve(response.status = false)
                    }
                })
            } else {
                console.log('login attempt failed email error')
                resolve(status = false)
            }

        })
    },
    addTocart: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            prodObj = {
                item: objectId(proId),
                quantity: 1
            }
            let userCart = await db.get().collection(connection.CART_DATA)
                .findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    console.log('proexist')
                    db.get().collection(connection.CART_DATA)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }

                            }).then(() => {
                                resolve()
                            })
                }
                else {
                    console.log('only one proexist')
                    db.get().collection(connection.CART_DATA)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: prodObj }
                            }).then(() => {
                                resolve()
                            })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(connection.CART_DATA).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },
    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {

            let CartData = await db.get().collection(connection.CART_DATA).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:
                    {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:
                    {
                        from: connection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project:
                    {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }
                // {
                //     $lookup: {
                //         from: collections.PRODUCT_COLLECTIONS,
                //         let: { proList: '$products' },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {
                //                         $in: ['$_id', '$$proList']
                //                     }  
                //                 }
                //             }
                //         ],
                //         as: "CartData"
                //     }
                // }
            ]).toArray()

            resolve(CartData)
        })
    },

    getcartCount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(connection.CART_DATA).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length;
            } resolve(count)
        })
    },

    changeQuantity: (proInfo) => {
        count = parseInt(proInfo.count);
        quantity = parseInt(proInfo.quantity)

        return new Promise((resolve, reject) => {

            if (quantity == 1 && count == -1) {
                db.get().collection(connection.CART_DATA)
                    .updateOne({ _id: objectId(proInfo.cart) },
                        {
                            $pull: { products: { item: objectId(proInfo.proId) } }

                        }).then(() => {
                            resolve({ removeProduct: true })
                        })
            }
            else {
                db.get().collection(connection.CART_DATA)
                    .updateOne({ _id: objectId(proInfo.cart), 'products.item': objectId(proInfo.proId) },
                        {
                            $inc: { 'products.$.quantity': count }

                        }).then(() => {
                            resolve({ status: true })
                        })
            }

        })
    },

    removeCart: (proInfo) => {

        return new Promise((resolve, reject) => {
            db.get().collection(connection.CART_DATA)
                .updateOne({ _id: objectId(proInfo.cart) },
                    {
                        $pull: { products: { item: objectId(proInfo.proId) } }

                    }).then(() => {

                        resolve(true)
                    })
        })

    },

    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(connection.CART_DATA).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:
                    {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:
                    {
                        from: connection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project:
                    {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $group:
                    {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$products.productPrice' }] } }
                    }

                }

            ]).toArray()
            if (total != 0) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }
        })
    },

    placeOrder: (order, products, total) => {

        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let OrderObj = {
                orderDetails: {
                    address: order.address,
                    pincode: order.pincode,
                    mobile: order.mobile
                },
                user: objectId(order.userId),
                payment: order['payment-method'],
                products: products,
                status: status,
                total: total,
                date: new Date()
            }
            db.get().collection(connection.ORDER_COLLECTION).insertOne(OrderObj).then((response) => {
                db.get().collection(connection.CART_DATA).deleteOne({ user: objectId(order.userId) })
                resolve(response.insertedId)
            })

        })

    },

    getCartList: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(connection.CART_DATA).findOne({ user: objectId(userId) }).then((cartList) => {
                console.log(cartList.products)
                resolve(cartList.products)
            })
        })
    },

    getOrders: (userId) => {
        return new Promise((resolve, reject) => {
            OrdersList = db.get().collection(connection.ORDER_COLLECTION).find({ user: objectId(userId) }).toArray()
            resolve(OrdersList)
        })

    },

    getviewOrderProducts: (OrderId) => {
        return new Promise(async (resolve, reject) => {

            let OrderItems = await db.get().collection(connection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(OrderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:
                    {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:
                    {
                        from: connection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project:
                    {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            resolve(OrderItems)
        })
    },

    generateRazorePay: (OrderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + OrderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log('new', order)
                    resolve(order);
                }
            });
        })
    },

    verifyPayment: (deatils) => {
        return new Promise((resolve, reject) => {

            const Crypto = require('node:crypto');

            var hmac = Crypto.createHmac('sha256', 'tvnOl89SS0DzD4iYrkZDDewq');

            hmac.update(deatils['payment[razorpay_order_id]'] + '|' + deatils['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if (hmac == deatils['payment[razorpay_signature]']) {

                resolve()
            }
            else {
                resolve()
            }


        })
    },

    changePaymentStatus:(OrderId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(connection.ORDER_COLLECTION).updateOne(
                {
                    _id:objectId(OrderId)
                },
                {
                    $set:{status:'placed'}
                }
            ).then(()=>{
                resolve()
        })
        })
    }

}