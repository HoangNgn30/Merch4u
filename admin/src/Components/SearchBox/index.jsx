import React, { useRef, useState } from 'react'
import { IoSearch } from "react-icons/io5";


const SearchBox = (props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInput = useRef();

  const onChangeInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (typeof props.setSearchQuery === 'function') {
      props.setSearchQuery(val);
    }
    if (val === "" && typeof props.setPageOrder === 'function') {
      props.setPageOrder(1);
    }
  }

  return (
    <div className='w-full relative'>
      <IoSearch className='absolute top-[12px] left-[14px] text-[16px] text-slate-400 z-50 pointer-events-none' />
      <input 
        type='text' 
        className='w-full h-[40px] border border-[rgba(0,0,0,0.08)] bg-[#f3f4f6] p-2 pl-10 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-white rounded-full text-[13px] transition-all placeholder-slate-400' 
        placeholder="Tìm kiếm..."
        value={searchQuery}
        ref={searchInput}
        onChange={onChangeInput}
      />
    </div>
  )
}

export default SearchBox;
