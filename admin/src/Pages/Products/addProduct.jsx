import React, { useContext, useEffect, useState } from 'react'
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Rating from '@mui/material/Rating';
import UploadBox from '../../Components/UploadBox';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { IoMdClose } from "react-icons/io";
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import { MyContext } from '../../App';
import { deleteImages, fetchDataFromApi, postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';

const label = { inputProps: { 'aria-label': 'Switch demo' } };


const AddProduct = () => {

    const [formFields, setFormFields] = useState({
        name: "",
        description: "",
        images: [],
        brand: "",
        price: "",
        oldPrice: "",
        category: "",
        catName: "",
        catId: "",
        subCatId: "",
        subCat: "",
        thirdsubCat: "",
        thirdsubCatId: "",
        countInStock: "",
        rating: "",
        isFeatured: false,
        discount: "",
        size: [],
        bannerTitleName: '',
        bannerimages: [],
        isDisplayOnHomeBanner:false

    })


    const [productCat, setProductCat] = React.useState('');
    const [productSubCat, setProductSubCat] = React.useState('');
    const [productFeatured, setProductFeatured] = React.useState('');

    const [variantType, setVariantType] = useState('none');
    const [selectedClothingSizes, setSelectedClothingSizes] = useState([]);
    const [versionCount, setVersionCount] = useState(1);
    const [versionNames, setVersionNames] = useState(['']);

    const [productThirdLavelCat, setProductThirdLavelCat] = useState('');

    const [previews, setPreviews] = useState([]);
    const [bannerPreviews, setBannerPreviews] = useState([]);

    const [checkedSwitch, setCheckedSwitch] = useState(false);


    const history = useNavigate();

    const context = useContext(MyContext);


    const [isLoading, setIsLoading] = useState(false);


    const handleChangeProductCat = (event) => {
        setProductCat(event.target.value);
        setProductSubCat('');
        setProductThirdLavelCat('');
        setFormFields({
            ...formFields,
            catId: event.target.value,
            category: event.target.value,
            subCatId: "",
            subCat: "",
            thirdsubCat: "",
            thirdsubCatId: ""
        })

    };

    const selectCatByName = (name) => {
        formFields.catName = name;
        const lowerName = name?.toLowerCase() || '';
        if (lowerName.includes('áo') || lowerName.includes('quần') || lowerName.includes('clothing') || lowerName.includes('apparel') || lowerName.includes('hoodie') || lowerName.includes('shirt') || lowerName.includes('merch')) {
            setVariantType('clothing');
        } else if (lowerName.includes('album')) {
            setVariantType('album');
        } else if (lowerName.includes('lightstick')) {
            setVariantType('lightstick');
        } else {
            setVariantType('none');
        }
    }

    const handleChangeProductSubCat = (event) => {
        setProductSubCat(event.target.value);
        setProductThirdLavelCat('');
        setFormFields({
            ...formFields,
            subCatId: event.target.value,
            thirdsubCat: "",
            thirdsubCatId: ""
        })
    };

    const selectSubCatByName = (name) => {
        formFields.subCat = name
    }

    const handleChangeProductThirdLavelCat = (event) => {
        setProductThirdLavelCat(event.target.value);
        setFormFields({
            ...formFields,
            thirdsubCatId: event.target.value
        })
    };

    const selectSubCatByThirdLavel = (name) => {
        setFormFields({
            ...formFields,
            thirdsubCat: name
        })
    }


    const handleChangeProductFeatured = (event) => {
        setProductFeatured(event.target.value);
        formFields.isFeatured = event.target.value
    };


    useEffect(() => {
        if (variantType === 'none') {
            setFormFields(prev => ({ ...prev, size: [] }));
        } else if (variantType === 'clothing') {
            setFormFields(prev => ({ ...prev, size: selectedClothingSizes }));
        } else {
            // album, lightstick, other
            if (versionCount <= 1) {
                setFormFields(prev => ({ ...prev, size: [] }));
            } else {
                const validNames = versionNames.slice(0, versionCount).map(n => n.trim()).filter(n => n !== '');
                setFormFields(prev => ({ ...prev, size: validNames }));
            }
        }
    }, [variantType, selectedClothingSizes, versionCount, versionNames]);


    const onChangeInput = (e) => {
        const { name, value } = e.target;
        let updatedFields = { ...formFields, [name]: value };

        if (name === 'price' || name === 'oldPrice' || name === 'discount') {
            const val = parseFloat(value); 
            const price = name === 'price' ? val : parseFloat(formFields.price);
            const oldPrice = name === 'oldPrice' ? val : parseFloat(formFields.oldPrice);
            const discount = name === 'discount' ? val : parseFloat(formFields.discount);

            if (name === 'oldPrice' && !isNaN(val)) {
                if (!isNaN(discount)) {
                    updatedFields.price = Math.round(val - (val * discount / 100));
                } else if (!isNaN(price)) {
                    updatedFields.discount = Math.round(((val - price) / val) * 100);
                }
            }
            
            else if (name === 'discount' && !isNaN(val)) {
                if (!isNaN(oldPrice)) {
                    updatedFields.price = Math.round(oldPrice - (oldPrice * val / 100));
                } else if (!isNaN(price)) {
                    updatedFields.oldPrice = val !== 100 ? Math.round(price / (1 - val / 100)) : 0;
                }
            }
            
            else if (name === 'price' && !isNaN(val)) {
                if (!isNaN(oldPrice) && oldPrice !== 0) {
                    updatedFields.discount = Math.round(((oldPrice - val) / oldPrice) * 100);
                } else if (!isNaN(discount)) {
                    updatedFields.oldPrice = discount !== 100 ? Math.round(val / (1 - discount / 100)) : 0;
                }
            }
        }
        setFormFields(updatedFields);
    }

    const onChangeRating = (e) => {
        setFormFields((formFields) => (
            {
                ...formFields,
                rating: e.target.value
            }
        ))
    }


    const setPreviewsFun = (previewsArr) => {
        const imgArr = previews;
        for (let i = 0; i < previewsArr.length; i++) {
            imgArr.push(previewsArr[i])
        }

        setPreviews([])
        setTimeout(() => {
            setPreviews(imgArr)
            formFields.images = imgArr
        }, 10);
    }


    const setBannerImagesFun = (previewsArr) => {
        const imgArr = bannerPreviews;
        for (let i = 0; i < previewsArr.length; i++) {
            imgArr.push(previewsArr[i])
        }

        setBannerPreviews([])
        setTimeout(() => {
            setBannerPreviews(imgArr)
            formFields.bannerimages = imgArr
        }, 10);
    }



   const removeImg = (image, index) => {
        context?.showConfirmDelete(
            "Xóa ảnh sản phẩm?",
            "Bạn có chắc chắn muốn xóa ảnh sản phẩm này?",
            () => {
                var imageArr = [];
                imageArr = previews;
                deleteImages(`/api/product/deteleImage?img=${image}`).then((res) => {
                    imageArr.splice(index, 1);

                    setPreviews([]);
                    setTimeout(() => {
                        setPreviews(imageArr);
                        formFields.images = imageArr
                    }, 100);

                })
            }
        )
    }


    const removeBannerImg = (image, index) => {
        context?.showConfirmDelete(
            "Xóa ảnh banner sản phẩm?",
            "Bạn có chắc chắn muốn xóa ảnh banner này?",
            () => {
                var imageArr = [];
                imageArr = bannerPreviews;
                deleteImages(`/api/product/deteleImage?img=${image}`).then((res) => {
                    imageArr.splice(index, 1);

                    setBannerPreviews([]);
                    setTimeout(() => {
                        setBannerPreviews(imageArr);
                        formFields.bannerimages = imageArr
                    }, 100);

                })
            }
        )
    }


    const handleChangeSwitch=(event)=>{
        setCheckedSwitch(event.target.checked);
        formFields.isDisplayOnHomeBanner = event.target.checked;
    }


    const handleSubmitg = (e) => {
        e.preventDefault(0);

        console.log(formFields)
        if (formFields.name === "") {
            context.alertBox("error", "Vui lòng nhập tên sản phẩm");
            return false;
        }

        if (formFields.description === "") {
            context.alertBox("error", "Vui lòng nhập mô tả sản phẩm");
            return false;
        }



        if (formFields?.catId === "") {
            context.alertBox("error", "Vui lòng chọn danh mục sản phẩm");
            return false;
        }



        if (formFields?.price === "") {
            context.alertBox("error", "Vui lòng nhập giá sản phẩm");
            return false;
        }


        if (formFields?.oldPrice === "") {
            context.alertBox("error", "Vui lòng nhập giá cũ của sản phẩm");
            return false;
        }


        if (formFields?.countInStock === "") {
            context.alertBox("error", "Vui lòng nhập tồn kho sản phẩm");
            return false;
        }


        if (formFields?.brand === "") {
            context.alertBox("error", "Vui lòng nhập thương hiệu sản phẩm");
            return false;
        }


        if (formFields?.discount === "") {
            context.alertBox("error", "Vui lòng nhập giảm giá sản phẩm");
            return false;
        }




        if (formFields?.rating === "") {
            context.alertBox("error", "Vui lòng nhập đánh giá sản phẩm");
            return false;
        }


        if (previews?.length === 0) {
            context.alertBox("error", "Vui lòng chọn ảnh sản phẩm");
            return false;
        }


        setIsLoading(true);

        postData("/api/product/create", formFields).then((res) => {

            if (res?.error === false) {
                context.alertBox("success", res?.message);
                setTimeout(() => {
                    setIsLoading(false);
                    context.setIsOpenFullScreenPanel({
                        open: false,
                    })
                    history("/products");
                }, 1000);
            } else {
                setIsLoading(false);
                context.alertBox("error", res?.message);
            }
        })
    }

    return (
        <section className='p-5 bg-gray-50'>
            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmitg}>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4'>

                    <div className='grid grid-cols-1 mb-3'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Tên sản phẩm</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields.name} onChange={onChangeInput} />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 mb-3'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Chi tiết sản phẩm</h3>
                            <textarea type="text" className='w-full h-[140px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="description" value={formFields.description} onChange={onChangeInput} />
                        </div>
                    </div>



                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-3 gap-4'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Danh mục sản phẩm</h3>

                            {
                                context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productCat}
                                    label="Category"
                                    onChange={handleChangeProductCat}
                                >
                                    {
                                        context?.catData?.map((cat, index) => {
                                            return (
                                                <MenuItem value={cat?._id}
                                                    onClick={() => selectCatByName(cat?.name)}>{cat?.name}</MenuItem>
                                            )
                                        })
                                    }

                                </Select>
                            }


                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Danh mục phụ sản phẩm</h3>

                            {
                                context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productSubCat}
                                    label="Sub Category"
                                    onChange={handleChangeProductSubCat}
                                >
                                    {
                                        context?.catData?.filter(cat => cat._id === productCat).map((cat, index) => {
                                            return (
                                                cat?.children?.length !== 0 && cat?.children?.map((subCat, index_) => {
                                                    return (
                                                        <MenuItem value={subCat?._id}
                                                            onClick={() => selectSubCatByName(subCat?.name)}
                                                        >
                                                            {subCat?.name}</MenuItem>
                                                    )
                                                })

                                            )
                                        })
                                    }

                                </Select>
                            }



                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Danh mục sản phẩm phụ cấp ba</h3>

                            {
                                context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productThirdLavelCat}
                                    label="Sub Category"
                                    onChange={handleChangeProductThirdLavelCat}
                                >
                                    {
                                        context?.catData?.filter(cat => cat._id === productCat).map((cat) => {
                                            return (
                                                cat?.children?.length !== 0 && cat?.children?.filter(subCat => subCat._id === productSubCat).map((subCat) => {
                                                    return (
                                                        subCat?.children?.length !== 0 && subCat?.children?.map((thirdLavelCat, index) => {
                                                            return <MenuItem value={thirdLavelCat?._id} key={index}
                                                                onClick={() => selectSubCatByThirdLavel(thirdLavelCat?.name)}>{thirdLavelCat?.name}</MenuItem>
                                                        })

                                                    )
                                                })

                                            )
                                        })
                                    }

                                </Select>
                            }



                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Giá sản phẩm hiện tại</h3>
                            <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="price" value={formFields.price} onChange={onChangeInput} />
                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1  text-black'>Giá gốc sản phẩm</h3>
                            <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="oldPrice" value={formFields.oldPrice} onChange={onChangeInput} />
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Giới thiệu sản phẩm này không ?</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productFeatured}
                                label="Category"
                                onChange={handleChangeProductFeatured}
                            >
                                <MenuItem value={true}>Có</MenuItem>
                                <MenuItem value={false}>Không</MenuItem>
                            </Select>
                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Hàng tồn kho</h3>
                            <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="countInStock" value={formFields.countInStock} onChange={onChangeInput} />
                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Thương hiệu sản phẩm</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="brand" value={formFields.brand} onChange={onChangeInput} />
                        </div>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Giảm giá</h3>
                            <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="discount" value={formFields.discount} onChange={onChangeInput} />
                        </div>




                        <div className='col w-full md:col-span-2 lg:col-span-4'>
                            <h3 className='text-[14px] font-[500] mb-3 text-black'>Loại Biến thể (Variant Type)</h3>
                            <Select
                                size="small"
                                className='w-full md:w-[300px] mb-4'
                                value={variantType}
                                onChange={(e) => setVariantType(e.target.value)}
                            >
                                <MenuItem value="none">Không có biến thể</MenuItem>
                                <MenuItem value="clothing">Quần áo (S, M, L...)</MenuItem>
                                <MenuItem value="album">Album</MenuItem>
                                <MenuItem value="lightstick">Lightstick</MenuItem>
                                <MenuItem value="other">Khác</MenuItem>
                            </Select>

                            {variantType === 'clothing' && (
                                <div className="flex flex-wrap gap-3">
                                    {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                        <label key={size} className="flex items-center gap-2 cursor-pointer border p-2 rounded-md bg-gray-50 hover:bg-gray-100">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedClothingSizes.includes(size)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedClothingSizes([...selectedClothingSizes, size]);
                                                    } else {
                                                        setSelectedClothingSizes(selectedClothingSizes.filter(s => s !== size));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{size}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {(variantType === 'album' || variantType === 'lightstick' || variantType === 'other') && (
                                <div className="flex flex-col gap-3">
                                    <div className='flex items-center gap-3'>
                                        <h4 className='text-[14px] font-[500]'>Số lượng version:</h4>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="20"
                                            className='w-[80px] h-[35px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-2 text-sm' 
                                            value={versionCount} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setVersionCount(val);
                                                if (val !== '') {
                                                    const count = parseInt(val);
                                                    if (versionNames.length < count) {
                                                        setVersionNames([...versionNames, ...Array(count - versionNames.length).fill('')]);
                                                    }
                                                }
                                            }} 
                                            onBlur={(e) => {
                                                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                                    setVersionCount(1);
                                                }
                                            }}
                                        />
                                    </div>
                                    
                                    {versionCount >= 2 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {Array.from({ length: versionCount }).map((_, index) => (
                                                <div key={index} className="flex flex-col gap-1">
                                                    <label className="text-[13px] text-gray-600">Tên version {index + 1}</label>
                                                    <input 
                                                        type="text" 
                                                        className='w-full h-[35px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-2 text-sm'
                                                        value={versionNames[index] || ''}
                                                        onChange={(e) => {
                                                            const newNames = [...versionNames];
                                                            newNames[index] = e.target.value;
                                                            setVersionNames(newNames);
                                                        }}
                                                        placeholder={`Ví dụ: Ver ${String.fromCharCode(65 + index)}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>




                    </div>




                    <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mb-3 gap-4'>


                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1  text-black'>Đánh giá sản phẩm </h3>
                            <Rating name="half-rating" defaultValue={1} onChange={onChangeRating} />
                        </div>


                    </div>




                    <div className='col w-full p-5 px-0'>
                        <h3 className="font-[700] text-[18px] mb-3">Ảnh sản phẩm</h3>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                            {
                                previews?.length !== 0 && previews?.map((image, index) => {
                                    return (
                                        <div className="uploadBoxWrapper relative" key={index}>

                                            <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>


                                            <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>

                                                <img src={image} className='w-100' />
                                            </div>
                                        </div>
                                    )
                                })
                            }


                            <UploadBox multiple={true} name="images" url="/api/product/uploadImages" setPreviewsFun={setPreviewsFun} />
                        </div>

                    </div>






                    <div className='col w-full p-5 px-0'>

                        <div className='bg-gray-100 p-4 w-full'>
                            <div className="flex items-center gap-8">
                                <h3 className="font-[700] text-[18px] mb-3">Ảnh quảng cáo</h3>
                                <Switch {...label} onChange={handleChangeSwitch} checked={checkedSwitch}/>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">

                                {
                                    bannerPreviews?.length !== 0 && bannerPreviews?.map((image, index) => {
                                        return (
                                            <div className="uploadBoxWrapper relative" key={index}>

                                                <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeBannerImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>


                                                <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>

                                                    <img src={image} className='w-100' />
                                                </div>
                                            </div>
                                        )
                                    })
                                }


                                <UploadBox multiple={true} name="bannerimages" url="/api/product/uploadBannerImages" setPreviewsFun={setBannerImagesFun} />
                            </div>


                            <br />

                            <h3 className="font-[700] text-[18px] mb-3">Tiêu đề quảng cáo</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="bannerTitleName" value={formFields.bannerTitleName} onChange={onChangeInput} />
                        </div>



                    </div>

                </div>



                <hr />
                <br />
                <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">

                    {
                        isLoading === true ? <CircularProgress color="inherit" />
                            :
                            <>
                                <FaCloudUploadAlt className='text-[25px] text-white' />
                                Đăng tải và xem
                            </>
                    }
                </Button>

            </form>
        </section>
    )
}

export default AddProduct;
