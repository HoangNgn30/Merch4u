import React, { useContext, useEffect, useState } from "react";
import { MdOutlineModeEdit } from "react-icons/md";
import { GoTrash } from "react-icons/go";
import { Button } from "@mui/material";
import { MyContext } from "../../App";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { deleteData, editData } from "../../utils/api";

export const EditSubCatBox = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectVal, setSelectVal] = useState('');
  const [formFields, setFormFields] = useState({
    name: "",
    parentCatName: null,
    parentId: null
  });

  const context = useContext(MyContext);

  useEffect(() => {
    setFormFields({
      name: props?.name || "",
      parentCatName: props?.selectedCatName || null,
      parentId: props?.selectedCat || null
    });
    setSelectVal(props?.selectedCat || "");
  }, [props]);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (event) => {
    setSelectVal(event.target.value);
    setFormFields((prev) => ({
      ...prev,
      parentId: event.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formFields.name || formFields.name.trim() === "") {
      context.alertBox("error", "Vui lòng điền tên danh mục con");
      setIsLoading(false);
      return false;
    }

    editData(`/api/category/${props?.id}`, formFields).then((res) => {
      setTimeout(() => {
        context.alertBox("success", res?.data?.message || "Đã lưu thay đổi");
        context?.getCat();
        setIsLoading(false);
        setEditMode(false);
      }, 800);
    });
  };

  const deleteCat = (id) => {
    if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
      context?.showConfirmDelete(
        "Xóa danh mục con?",
        "Hành động này sẽ xóa danh mục con được chọn. Bạn có chắc chắn muốn xóa?",
        () => {
          deleteData(`/api/category/${id}`).then((res) => {
            context?.getCat();
            context.alertBox("success", "Đã xóa danh mục con thành công");
          });
        }
      );
    } else {
      context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
    }
  };

  return (
    <form className="w-full flex items-center gap-3 p-3 px-5 min-h-[50px]" onSubmit={handleSubmit}>
      {editMode === true ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full py-2 gap-3 flex-wrap">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="w-[140px] flex-shrink-0">
              <Select
                className="w-full text-xs font-semibold bg-white rounded-lg"
                sx={{
                  zoom: '80%',
                  '& .MuiSelect-select': { py: '8px' }
                }}
                size="small"
                value={selectVal}
                onChange={handleChange}
                displayEmpty
              >
                {props?.catData?.length !== 0 && props?.catData?.map((item, index) => {
                  return (
                    <MenuItem 
                      value={item?._id} 
                      key={item?._id || index} 
                      className="text-xs font-semibold"
                      onClick={() => {
                        formFields.parentCatName = item?.name;
                      }}
                    >
                      {item?.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </div>

            <input 
              type="text" 
              className="flex-1 min-w-[140px] h-[32px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-medium text-slate-800" 
              name="name" 
              value={formFields?.name} 
              onChange={onChangeInput} 
              placeholder="Tên danh mục..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="small" 
              className="!normal-case font-bold !bg-indigo-600 !text-white rounded-xl px-3 py-1.5 min-w-[70px]" 
              type="submit" 
              variant="contained"
              disabled={isLoading}
            >
              {isLoading === true ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                "Lưu"
              )}
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              className="!normal-case font-bold !border-slate-200 !text-slate-500 hover:!bg-slate-50 rounded-xl px-3 py-1.5"
              onClick={() => setEditMode(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <>
          <span className="font-semibold text-slate-700 text-[13px] hover:text-indigo-600 transition-colors">
            {props?.name}
          </span>
          <div className="flex items-center ml-auto gap-2">
            <button 
              type="button"
              className="w-[28px] h-[28px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => setEditMode(true)}
              title="Sửa danh mục con"
            >
              <MdOutlineModeEdit className="text-[14px]" />
            </button>
            <button 
              type="button"
              className="w-[28px] h-[28px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => deleteCat(props?.id)}
              title="Xóa danh mục con"
            >
              <GoTrash className="text-[13px]" />
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default EditSubCatBox;