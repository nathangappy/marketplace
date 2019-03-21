const Product   = require('../models/product');
const User      = require('../models/user');
const Order     = require('../models/order');

// get home page
exports.getIndex = (req, res) => {
  res.render('shop/index');
}

// get all products
exports.getProducts = (req, res) => {
  Product.find({}, (err, foundProducts) => {
    if(err){
      console.log(err);
    } else {
      res.render('shop/allproducts', {products: foundProducts});
    }
  });
}

// get product detail
exports.getProductDetail = (req, res) => {
  Product.findById(req.params.id, (err, foundProduct) => {
    if(err){
      console.log(err)
    } else {
      res.render('shop/showproduct', {product: foundProduct});
    }
  });
}

// get cart
exports.getCart = (req, res) => {
  let userID = '5c8d62a99806bd30e1b22667';
  // get user & populate products in cart & render
  User.findById(userID)
    .populate({
        path: 'cart.productID',
        model: 'Product'
    })
    .then(user => {
      let totalPrice = 0;
      let productArray = []
      user.cart.forEach(product => {
        let productPrice = product.productID.price * product.quantity;
        totalPrice += productPrice;
        productArray.push(product)
      });
      res.render('shop/cart', {
        userCart: user, 
        totalPrice: totalPrice,
        userID: user._id,
        products: productArray
      });
    })
}

// add product to cart
exports.addProductToCart = (req, res) => {
  let userID = '5c8d62a99806bd30e1b22667';
  let productID = req.body.id;
  // find user
  User.findById(userID)
    .then(user => {
      // add product or increase product quantity
      let index = user.cart.findIndex(product => product.productID == productID);
      if(index === -1){
        user.cart.push({productID: productID, quantity: 1});
        user.save();
        res.redirect('/cart');
      } else {
        user.cart[index]['quantity'] += 1;
        user.save();
        res.redirect('/cart');
      }
    })
    .catch(err => {
      console.log(err)
    });
}

// delete product from cart
exports.deleteCartProduct = (req, res) => {
  let userID = '5c8d62a99806bd30e1b22667';
  let deletedID = req.body.id;
  User.findById(userID)
    .then(user => {
      let deletedIndex = user.cart.findIndex(product => product.productID == deletedID);
      if(user.cart[deletedIndex]['quantity'] > 1){
        user.cart[deletedIndex]['quantity'] -= 1;
        user.save();
        res.redirect('/cart');
      } else if (user.cart[deletedIndex]['quantity'] == 1){
        user.cart[deletedIndex].remove();
        user.save();
        res.redirect('/cart');
      } 
    })
    .catch(error => {
      console.log(error)
    })
}

// get checkout
exports.getCheckout = (req, res) => {
  res.render('shop/checkout')
}

// create orders
exports.createOrder = (req, res) => {
  let order = {
    products: [],
    totalPrice: parseInt(req.body.totalPrice),
    userID: req.body.userid
  }
  // create order 
  Order.create(order)
    .then(order => {
      // find user and populate cart items
      User.findById(req.body.userid)
        .populate({
          path: 'cart.productID',
          model: 'Product'
        })
        // add each cart product to order
        .then(user => {
          user.cart.forEach(product => {
            let cartProduct = {
              productID: product.productID._id,
              name: product.productID.name,
              price: product.productID.price,
              quantity: product.quantity
            }
            order.products.push(cartProduct);
          })
          order.save()
          user.cart = [];
          user.save()
          res.redirect('/orders')
        })
    })
    .catch(error => {
      console.log(error)
    })
}

// show orders
exports.showOrders = (req, res) => {
  let userID = '5c8d62a99806bd30e1b22667';
  Order.find({userID: userID})
    .then(orders => {
      res.render('shop/orders', {orders: orders})
    })
}