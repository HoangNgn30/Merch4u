import React, { useContext, useEffect, useRef, useState } from "react";
import "../Search/style.css";
import CircularProgress from "@mui/material/CircularProgress";
import { IoSearch } from "react-icons/io5";
import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    const query = searchQuery.trim();
    clearTimeout(debounceRef.current);

    if (query.length < 1) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setHasSearched(false);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      postData("/api/product/search/get", {
        page: 1,
        limit: 5,
        query,
      }).then((res) => {
        if (requestId !== requestIdRef.current) return;

        if (res?.error === false) {
          setSuggestions(res?.products || []);
          setShowSuggestions(true);
          setHasSearched(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
          setHasSearched(true);
        }
      });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const onChangeInput = (e) => {
    setSearchQuery(e.target.value);
  };

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query || isLoading) return;

    setIsLoading(true);
    setShowSuggestions(false);

    const res = await postData("/api/product/search/get", {
      page: 1,
      limit: 24,
      query,
    });

    context?.setSearchData({
      ...(res || {}),
      query,
    });
    setIsLoading(false);
    context?.setOpenSearchPanel(false);
    history("/search");
  };

  const openProduct = (productId) => {
    if (!productId) return;

    setShowSuggestions(false);
    context?.setOpenSearchPanel(false);
    history(`/product/${productId}`);
  };

  return (
    <div className="searchBox w-[100%] h-[50px] bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(255,82,82,0.1)] transition-all duration-300 rounded-full relative p-[6px]">
      <input
        type="text"
        placeholder="Tìm album, lightstick, photocard..."
        className="w-full h-full focus:outline-none bg-inherit pl-4 pr-12 text-[14px] rounded-full"
        value={searchQuery}
        onChange={onChangeInput}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            runSearch();
          }
        }}
      />
      <button className="absolute top-[5px] right-[5px] z-50 w-[40px] h-[40px] rounded-full bg-[#ff5252] text-white hover:bg-[#171717] transition-all duration-300 flex items-center justify-center border-none cursor-pointer" onClick={runSearch}>
        {isLoading ? <CircularProgress color="inherit" size={20} /> : <IoSearch size={22} color="#ffffff" />}
      </button>

      {showSuggestions && (
        <div className="searchSuggestions">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                type="button"
                className="searchSuggestionItem"
                key={item._id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  openProduct(item._id);
                }}
              >
                <span className="searchSuggestionImage">
                  {item?.images?.[0] && <img src={item.images[0]} alt={item.name} />}
                </span>
                <span className="searchSuggestionInfo">
                  <span className="searchSuggestionName">{item.name}</span>
                  <span className="searchSuggestionMeta">
                    {item.brand || item.catName || item.subCat || "Merch4u"}
                  </span>
                </span>
                <span className="searchSuggestionPrice">
                  {Number(item.price || 0).toLocaleString("vi-VN")}đ
                </span>
              </button>
            ))
          ) : (
            hasSearched && (
              <div className="searchNoResult">
                <span>Không tìm thấy sản phẩm phù hợp</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
