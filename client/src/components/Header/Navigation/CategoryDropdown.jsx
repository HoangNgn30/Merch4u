import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

const CategoryDropdown = ({ data, onClose }) => {
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  if (!data || data.length === 0) return null;

  const activeCategory = data[activeCatIndex];

  return (
    <div 
      className="absolute top-[100%] left-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex overflow-hidden z-[999] w-[780px] min-h-[380px] transition-all duration-300 origin-top-left animate-dropdownFadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Left panel: Parent Categories */}
      <div className="w-[240px] bg-slate-50/80 border-r border-gray-100 p-3 flex flex-col gap-1 select-none">
        {data.map((cat, index) => (
          <div
            key={cat._id || index}
            className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
              activeCatIndex === index
                ? "bg-primary text-white font-[600] shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-primary"
            }`}
            onMouseEnter={() => setActiveCatIndex(index)}
          >
            <Link
              to={`/products?catId=${cat?._id}`}
              className="text-[14px] flex-1 truncate"
              onClick={onClose}
            >
              {cat.name}
            </Link>
            <FiChevronRight
              className={`text-[16px] transition-transform duration-200 ${
                activeCatIndex === index ? "translate-x-1" : "group-hover:translate-x-1"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Right panel: Subcategories and Third level categories */}
      <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[480px]">
        {activeCategory && (
          <div>
            <div className="mb-4 pb-2 border-b border-gray-50 flex items-center justify-between">
              <span className="text-[11px] font-[700] text-primary tracking-wider uppercase">
                Khám phá danh mục
              </span>
              <Link
                to={`/products?catId=${activeCategory?._id}`}
                className="text-[12px] font-[600] text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                onClick={onClose}
              >
                Xem tất cả {activeCategory.name}
                <FiChevronRight className="text-[14px]" />
              </Link>
            </div>

            {activeCategory.children && activeCategory.children.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {activeCategory.children.map((subCat, sIdx) => (
                  <div key={subCat._id || sIdx} className="flex flex-col gap-2">
                    <Link
                      to={`/products?subCatId=${subCat?._id}`}
                      className="text-[14px] font-[700] text-gray-900 hover:text-primary transition-colors"
                      onClick={onClose}
                    >
                      {subCat.name}
                    </Link>

                    {subCat.children && subCat.children.length > 0 && (
                      <div className="flex flex-col gap-1.5 pl-1.5 border-l-2 border-gray-100">
                        {subCat.children.map((thirdCat, tIdx) => (
                          <Link
                            key={thirdCat._id || tIdx}
                            to={`/products?thirdLavelCatId=${thirdCat?._id}`}
                            className="text-[13px] text-gray-500 hover:text-primary hover:pl-1 transition-all duration-200"
                            onClick={onClose}
                          >
                            {thirdCat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-[13px]">Chưa có danh mục con</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDropdown;
