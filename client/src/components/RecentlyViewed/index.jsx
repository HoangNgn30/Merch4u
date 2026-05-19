import React, { useEffect, useState } from "react";
import ProductsSlider from "../ProductsSlider";

const STORAGE_KEY = "merch4u_recently_viewed";
const RECENTLY_VIEWED_EVENT = "merch4u_recently_viewed_updated";

const normalizeProduct = (product) => ({
  _id: product?._id,
  name: product?.name,
  description: product?.description,
  price: product?.price,
  oldPrice: product?.oldPrice,
  discount: product?.discount,
  images: product?.images || [],
  brand: product?.brand,
  catName: product?.catName,
  catId: product?.catId,
  subCat: product?.subCat,
  subCatId: product?.subCatId,
  rating: product?.rating,
  countInStock: product?.countInStock,
  status: product?.status,
  isNew: product?.isNew,
  viewedAt: Date.now(),
});

export const saveRecentlyViewedProduct = (product) => {
  if (!product?._id) return;

  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const next = [
      normalizeProduct(product),
      ...current.filter((item) => item?._id !== product._id),
    ].slice(0, 20);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem("merch4u_current_product_id", product._id);
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch (error) {
    console.warn("[RecentlyViewed] Cannot save product:", error?.message);
  }
};

const readRecentlyViewed = (excludeId) => {
  try {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return products.filter((item) => item?._id && item._id !== excludeId);
  } catch (error) {
    return [];
  }
};

export default function RecentlyViewed({
  excludeId,
  title = "Xem gần đây",
  className = "",
}) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const syncProducts = () => setProducts(readRecentlyViewed(excludeId));

    syncProducts();
    window.addEventListener(RECENTLY_VIEWED_EVENT, syncProducts);
    window.addEventListener("storage", syncProducts);

    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, syncProducts);
      window.removeEventListener("storage", syncProducts);
    };
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section className={`py-5 bg-white ${className}`}>
      <div className="container">
        <h2 className="text-[20px] font-[600] pb-0">{title}</h2>
        <ProductsSlider items={6} data={products} />
      </div>
    </section>
  );
}
