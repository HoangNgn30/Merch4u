import React, { useState, useContext, useEffect } from 'react';
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import { AiOutlineEdit } from "react-icons/ai";
import { GoTrash } from "react-icons/go";

import { MyContext } from '../../App';
import { fetchDataFromApi, postData, deleteData, editData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';


const AddVariant = () => {

    const [name, setName] = useState('');
    const [type, setType] = useState('Size');
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editId, seteditId] = useState('');

    const context = useContext(MyContext);

    useEffect(() => {
        getData()
    }, [])


   const getData=()=>{
    fetchDataFromApi("/api/product/productVariant/get").then((res) => {
        if (res?.error === false) {
            setData(res?.data);
        }
    })
   }


    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        if (name === "") {
            context.alertBox("error", "Vui lòng nhập tên biến thể sản phẩm");
            return false;
        }


        if(editId===""){

            postData(`/api/product/productVariant/create`, {
                name: name,
                type: type
            }).then((res) => {
                if(res?.error===false){
                    context.alertBox("success", res?.message);
                   setTimeout(()=>{
                    setIsLoading(false);
                    getData();
                    setName("");
                    setType("Size");
                   },[300])
                  
                }else{
                    context.alertBox("error", res?.message);
                }
              
            })
    
        }

    
        if(editId!==""){
            editData(`/api/product/productVariant/${editId}`, {
                name: name,
                type: type
            }).then((res) => {
          
                if(res?.data?.error===false){
                    context.alertBox("success", res?.data?.message);
                   setTimeout(()=>{
                    setIsLoading(false);
                    getData();
                    setName("");
                    setType("Size");
                    seteditId("");
                   },[300])
                  
                }else{
                    context.alertBox("error", res?.data?.message || "Lỗi cập nhật biến thể");
                }
              
            })
    
        }


    }


    const deleteItem = (id) => {
        context?.showConfirmDelete(
            "Xóa biến thể?",
            "Bạn có chắc chắn muốn xóa biến thể này?",
            () => {
                deleteData(`/api/product/productVariant/${id}`).then((res) => {
                    getData();
                    context.alertBox("success", "Đã xóa mục");

                })
            }
        )
    }

    const editItem=(id)=>{
        fetchDataFromApi(`/api/product/productVariant/${id}`).then((res)=>{
            setName(res?.data?.name)
            setType(res?.data?.type || 'Size')
            seteditId(res?.data?._id);
        })
    }

    return (
        <>
            <div className="flex items-center justify-between px-2 py-0 mt-3">
                <h2 className="text-[18px] font-[600]">
                    Thêm biến thể sản phẩm
                </h2>
            </div>

            <div className="card my-4 pt-5 pb-5 shadow-md sm:rounded-lg bg-white w-[100%] sm:w-[100%] lg:w-[65%]">
                <form className='form py-3 p-6' onSubmit={handleSubmit}>
                    <div className='col mb-4'>
                        <h3 className='text-[14px] font-[500] mb-1 text-black'>Loại biến thể</h3>
                        <select className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-2 text-sm bg-white' value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Type">Type</option>
                            <option value="Material">Material</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className='col mb-4'>
                        <h3 className='text-[14px] font-[500] mb-1 text-black'>Tên biến thể</h3>
                        <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" onChange={(e) => setName(e.target.value)} value={name} />
                    </div>

                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                    {
                        isLoading === true ? <CircularProgress color="inherit" />
                            :
                            <>
                                <FaCloudUploadAlt className='text-[25px] text-white' />
                                Lưu Và Xem
                            </>
                    }
                    </Button>

                </form>
            </div>


            {
                data?.length !== 0 &&
                <div className="card my-4 pt-5 pb-5 shadow-md sm:rounded-lg bg-white w-[100%] sm:w-[100%] lg:w-[65%]">
                    <div className="relative overflow-x-auto mt-5 pb-5">
                        <table className="w-full text-sm text-left rtl:text-right text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                   
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap" width="30%">
                                        Loại
                                    </th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap" width="40%">
                                        Tên biến thể
                                    </th>

                                    <th scope="col" className="px-6 py-3 whitespace-nowrap" width="30%">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    data?.map((item, index) => {
                                        return <tr className="odd:bg-white even:bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 transition-colors" key={index}>
                                        
                                            <td className="px-6 py-2">
                                               <span className="font-[500] text-gray-500"> {item?.type}</span>
                                            </td>
                                            <td className="px-6 py-2">
                                               <span className="font-[600]"> {item?.name}</span>
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex items-center gap-1.5">
                                                    <button className="action-btn-edit" onClick={()=>editItem(item?._id)} title="Sửa biến thể">
                                                        <AiOutlineEdit />
                                                    </button>

                                                    <button className="action-btn-delete" onClick={()=>deleteItem(item?._id)} title="Xóa biến thể">
                                                        <GoTrash />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    })
                                }



                            </tbody>
                        </table>
                    </div>
                </div>

            }


        </>
    )
}

export default AddVariant;
