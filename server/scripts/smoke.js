const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function req(path, method='GET', body=null, token=null){
  return new Promise((resolve,reject)=>{
    const opts={hostname:'127.0.0.1',port:5000,path,method,headers:{'Content-Type':'application/json'}};
    if(token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        let parsed = d;
        try{ parsed = JSON.parse(d); }catch(e){}
        resolve({status:res.statusCode, body:parsed});
      });
    });
    r.on('error', reject);
    if(body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async()=>{
  console.log('GET /api/products');
  console.log(await req('/api/products'));

  console.log('GET /api/categories');
  console.log(await req('/api/categories'));

  const email = `audit_${Date.now()}@local.test`;
  console.log('POST /api/auth/register', email);
  const reg = await req('/api/auth/register','POST',{name:'Audit User',email,password:'Password123'});
  console.log('register =>', reg.status);

  console.log('POST /api/auth/login');
  const login = await req('/api/auth/login','POST',{email,password:'Password123'});
  console.log('login =>', login.status);

  const token = login && login.body && login.body.data && login.body.data.token ? login.body.data.token : null;
  if(token){
    console.log('GET /api/auth/me with token');
    console.log(await req('/api/auth/me','GET',null,token));

    // pick a product to add to cart
    const productsRes = await req('/api/products');
    const firstProduct = productsRes && productsRes.body && productsRes.body.data && productsRes.body.data.products && productsRes.body.data.products[0];
    if (firstProduct) {
      const pid = firstProduct._id || firstProduct.id || firstProduct.product || null;
      if (pid) {
        console.log('POST /api/cart/add');
        console.log(await req('/api/cart/add','POST',{productId:pid,qty:1},token));

        console.log('GET /api/cart');
        console.log(await req('/api/cart','GET',null,token));
      }
    }

    // add address
    console.log('POST /api/addresses');
    console.log(await req('/api/addresses','POST',{fullName:'Audit User',mobile:'9999999999',house:'1 Test',street:'Street',area:'Area',city:'City',state:'State',pinCode:'000000'},token));

    // create order
    console.log('POST /api/orders');
    console.log(await req('/api/orders','POST',{address:{fullName:'Audit User',mobile:'9999999999',house:'1 Test',street:'Street',area:'Area',city:'City',state:'State',pinCode:'000000'},paymentMethod:'COD'},token));

    console.log('GET /api/orders/my');
    console.log(await req('/api/orders/my','GET',null,token));
  } else {
    console.log('No token returned from login, skipping protected endpoint checks');
  }

  // public coupons and banners
  console.log('GET /api/coupons');
  console.log(await req('/api/coupons'));

  console.log('GET /api/banners');
  console.log(await req('/api/banners'));

  // admin: login using env admin credentials and hit admin dashboard
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    console.log('POST /api/auth/login (admin)');
    const alogin = await req('/api/auth/login','POST',{email:adminEmail,password:adminPassword});
    const atoken = alogin && alogin.body && alogin.body.data && alogin.body.data.token ? alogin.body.data.token : null;
    console.log('admin login =>', alogin.status);
    if (atoken) {
      console.log('GET /api/admin/dashboard');
      console.log(await req('/api/admin/dashboard','GET',null,atoken));
      console.log('GET /api/admin/customers');
      console.log(await req('/api/admin/customers','GET',null,atoken));

      // create a coupon
      console.log('POST /api/coupons (admin create)');
      const couponRes = await req('/api/coupons','POST',{code:`SMOKE${Date.now()}`,discountValue:50,discountType:'fixed'},atoken);
      console.log('coupon create =>', couponRes.status);

      // create a banner
      console.log('POST /api/banners (admin create)');
      const bannerRes = await req('/api/banners','POST',{title:'Smoke Banner',image:'/uploads/sample.jpg',order:1},atoken);
      console.log('banner create =>', bannerRes.status);

      // create a product using first category
      const cats = await req('/api/categories');
      const firstCat = cats && cats.body && cats.body.data && cats.body.data[0] ? cats.body.data[0]._id || cats.body.data[0].id : null;
      if (firstCat) {
        console.log('POST /api/products (admin create)');
        const prodRes = await req('/api/products','POST',{name:'Smoke Product',sku:`SMK${Date.now()}`,price:199,category:firstCat,stock:10},atoken);
        console.log('product create =>', prodRes.status);
        const createdId = prodRes && prodRes.body && prodRes.body.data && (prodRes.body.data._id || (prodRes.body.data[0] && prodRes.body.data[0]._id)) ? (prodRes.body.data._id || prodRes.body.data[0]._id) : null;
        if (createdId) {
          console.log('PUT /api/products/:id (admin update)');
          console.log(await req(`/api/products/${createdId}`,'PUT',{price:249},atoken));

          console.log('GET /api/inventory/product/:productId (admin)');
          console.log(await req(`/api/inventory/product/${createdId}`,'GET',null,atoken));

          console.log('PUT /api/inventory/product/:productId (admin update)');
          console.log(await req(`/api/inventory/product/${createdId}`,'PUT',{currentStock:20,lowStockThreshold:5},atoken));
        }
      }
    }
  }

})();
