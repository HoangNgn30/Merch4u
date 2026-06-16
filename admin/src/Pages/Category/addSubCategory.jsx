import React, { useState } from 'react'
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useContext } from 'react';
import { MyContext } from '../../App';
import CircularProgress from '@mui/material/CircularProgress';
import { postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AddSubCategory = () => {
    const [productCat, setProductCat] = useState('');
    const [productCat2, setProductCat2] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);

    const [formFields, setFormFields] = useState({
        name: "",
        parentCatName: null,
        parentId: null
    })


    const [formFields2, setFormFields2] = useState({
        name: "",
        parentCatName: null,
        parentId: null

    })

    const context = useContext(MyContext);
    const history = useNavigate();

    const handleChangeProductCat = (event) => {
        const selectedId = event.target.value;
        const selectedCat = context?.catData?.find(item => item._id === selectedId);
        setProductCat(selectedId);
        setFormFields(prev => ({
            ...prev,
            parentId: selectedId,
            parentCatName: selectedCat ? selectedCat.name : null
        }));
    };

    const handleChangeProductCat2 = (event) => {
        const selectedId = event.target.value;
        let selectedCat = null;
        for (const cat of context?.catData || []) {
            const found = cat?.children?.find(item2 => item2._id === selectedId);
            if (found) {
                selectedCat = found;
                break;
            }
        }
        setProductCat2(selectedId);
        setFormFields2(prev => ({
            ...prev,
            parentId: selectedId,
            parentCatName: selectedCat ? selectedCat.name : null
        }));
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;

        const catId = productCat
        setProductCat(catId);

        setFormFields(() => {
            return {
                ...formFields,
                [name]: value
            }
        })
    }


    const onChangeInput2 = (e) => {
        const { name, value } = e.target;
        const catId = productCat2
        setProductCat2(catId);

        setFormFields2(() => {
            return {
                ...formFields2,
                [name]: value
            }
        })
    }


    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        if (formFields.name === "") {
            context.alertBox("error", "Vui lòng nhập tên danh mục");
            setIsLoading(false);
            return false
        }

        if (productCat === "") {
            context.alertBox("error", "Vui lòng chọn danh mục cha");
            setIsLoading(false);
            return false
        }

        postData("/api/category/create", formFields).then((res) => {
            setTimeout(() => {
                setIsLoading(false);
                context.setIsOpenFullScreenPanel({
                    open: false,
                })
                context?.getCat();
                history("/subCategory/list")
            }, 2500);
        })
    }




    const handleSubmit2 = (e) => {
        e.preventDefault();

        setIsLoading2(true);

        console.log(formFields2)

        if (formFields2.name === "") {
            context.alertBox("error", "Vui lòng nhập tên danh mục");
            setIsLoading2(false);
            return false
        }

        if (productCat2 === "") {
            context.alertBox("error", "Vui lòng chọn danh mục cha");
            setIsLoading2(false);
            return false
        }

        postData("/api/category/create", formFields2).then((res) => {
            setTimeout(() => {
                setIsLoading2(false);
                context.setIsOpenFullScreenPanel({
                    open: false,
                })
                context?.getCat();
            }, 2500);
        })
    }


    return (
        <section className='p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2  gap-10'>
            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmit}>
                <h4 className="font-[600]">Thêm Danh Mục Cấp 2</h4>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>
                    <div className='grid grid-cols-1 md:grid-cols-1 mb-3 gap-5'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Danh Mục Chính</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productCat}
                                label="Danh mục"
                                onChange={handleChangeProductCat}
                            >
                                {
                                    (context?.catData || []).map((item, index) => {
                                        return (
                                            <MenuItem key={item?._id || index} value={item?._id}>{item?.name}</MenuItem>
                                        )
                                    })
                                }

                            </Select>
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Tên Danh Mục Cấp 2</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields.name} onChange={onChangeInput} />
                        </div>


                    </div>

                    <br />

                </div>


                <div className='w-[250px]'>
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
                </div>


            </form>




            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmit2}>
                <h4 className="font-[600]">Thêm Danh Mục Cấp 3</h4>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>
                    <div className='grid grid-cols-1 md:grid-cols-1 mb-3 gap-5'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Danh Mục Chính</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productCat2}
                                label="Danh mục"
                                onChange={handleChangeProductCat2}
                            >
                                {
                                    (context?.catData || []).flatMap(item => item?.children || []).map((item2, idx) => {
                                        return (
                                            <MenuItem key={item2?._id || idx} value={item2?._id}>{item2?.name}</MenuItem>
                                        )
                                    })
                                }

                            </Select>
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Tên Danh Mục Cấp 3</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields2.name} onChange={onChangeInput2} />
                        </div>


                    </div>

                    <br />

                </div>


                <div className='w-[250px]'>
                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                     {
                            isLoading2 === true ? <CircularProgress color="inherit" />
                                :
                                <>
                                    <FaCloudUploadAlt className='text-[25px] text-white' />
                                    Lưu Và Xem
                                </>
                        }
                    </Button>
                </div>


            </form>


        </section>
    )
}

export default AddSubCategory;
