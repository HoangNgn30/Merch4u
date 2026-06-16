import React, { useContext, useEffect, useState } from 'react';
import { MyContext } from '../../App';
import { fetchDataFromApi } from '../../utils/api';
import ProductsSlider from '../ProductsSlider';
import './style.css';

/**
 * AIRecommendations
 * Hiển thị "Dành riêng cho bạn" — gợi ý sản phẩm cá nhân hóa từ AI.
 * Ẩn hoàn toàn nếu user chưa đăng nhập.
 * Props:
 *   title (string) — custom title, mặc định "✨ Dành riêng cho bạn"
 */
export default function AIRecommendations({ title = 'Sản Phẩm Dành Riêng Cho Bạn' }) {
    const { isLogin } = useContext(MyContext);

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!isLogin || hasFetched) return;

        setIsLoading(true);
        fetchDataFromApi('/api/ai/recommendations')
            .then((res) => {
                if (res?.error === false && res?.products?.length > 0) {
                    setProducts(res.products);
                }
            })
            .catch((err) => {
                console.warn('[AIRecommendations] Không thể tải gợi ý:', err?.message);
            })
            .finally(() => {
                setIsLoading(false);
                setHasFetched(true);
            });
    }, [isLogin]);

    // Ẩn nếu chưa đăng nhập
    if (!isLogin) return null;

    // Ẩn nếu đã fetch xong nhưng không có kết quả
    if (hasFetched && products.length === 0) return null;

    return (
        <section className="ai-recommendations-section">
            <div className="container">
                <div className="ai-rec-header">
                    <div className="ai-rec-title-group">
                        {/* <span className="ai-rec-badge">AI Pick</span> */}
                        <h2 className="ai-rec-title">{title}</h2>
                    </div>
                    <p className="ai-rec-subtitle">
                        Được chọn riêng dựa trên sở thích của bạn
                    </p>
                </div>

                {isLoading ? (
                    <div className="ai-rec-skeleton-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="ai-rec-skeleton-card">
                                <div className="ai-rec-skeleton-img skeleton-pulse" />
                                <div className="ai-rec-skeleton-line skeleton-pulse" />
                                <div className="ai-rec-skeleton-line short skeleton-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <ProductsSlider items={5} data={products} />
                )}
            </div>
        </section>
    );
}
