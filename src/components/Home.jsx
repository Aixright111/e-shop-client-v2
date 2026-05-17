import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('user');

  const handleStartShopping = () => {
    if (isLoggedIn) {
      navigate('/products');
    } else {
      navigate('/user/login');
    }
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-content">
        <h1 className="home-title">欢迎来到 E-Shop</h1>
        <p className="home-subtitle">服务于最好的商品，享受便捷的交易体验</p>
        <button className="home-cta-btn" onClick={handleStartShopping}>
          开始购物
        </button>
      </div>
    </div>
  );
}

export default Home;
