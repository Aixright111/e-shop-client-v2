import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import User from './components/User';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import EditProduct from './components/EditProduct';
import AddProduct from './components/AddProduct';
import MessagesBox from './components/MessagesBox';
import MyStore from './components/MyStore';
import SellerStore from './components/SellerStore';
import MyQuotes from './components/MyQuotes';
import OrderDetail from './components/OrderDetail';
import AiChat from './components/AiChat';

function App() {
  return (
    <Router>
      <AiChat />
      <Routes>
        {/* 主页 */}
        <Route path="/" element={<Home />} />
        {/* 商品列表页 */}
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        {/* 登录页 */}
        <Route path="/user/login" element={<Login />} />
        {/* 注册页 */}
        <Route path="/user/register" element={<Register />} />
        {/* 用户信息页 */}
        <Route path="/user" element={<User />} />
        {/* 上架商品页 */}
        <Route path="/product/add" element={<AddProduct />} />
        {/* 修改商品页 */}
        <Route path="/product/edit/:id" element={<EditProduct />} />
        {/* 消息盒子 */}
        <Route path="/messages" element={<MessagesBox />} />
        {/* 我的店铺 */}
        <Route path="/my-store" element={<MyStore />} />
        {/* 卖家店铺 */}
        <Route path="/store/:userId" element={<SellerStore />} />
        {/* 我的报价 */}
        <Route path="/my-quotes" element={<MyQuotes />} />
        {/* 订单详情 */}
        <Route path="/order/:id" element={<OrderDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
