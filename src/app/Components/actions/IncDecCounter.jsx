import {useState, useEffect} from "react";

function IncDecCounter({
  _item,
  calTotal,
  calTotalProducts,
  setTotalProducts
 
}){

  const [num, setNum]= useState(1);
  let incNum = () =>{
    if(num < _item.itemQuantity)
    {
      let _num = num;
    setNum(Number(num)+1);
    _num++;
   _item.saleQuantity = _num
   calTotal();
   calTotalProducts();
    }
  };
  let decNum = () => {
     if(num>0)
     {
      if(num === 1){
        let _num = num;
        setNum(1);        
   _item.saleQuantity = _num
   calTotal();
   calTotalProducts();
        
      }else{
        let _num = num;
        setNum(Number(num)-1);
        _num--;
       _item.saleQuantity = _num
       calTotal();
       calTotalProducts();
  
      }
     
     }
  }

  useEffect(() => {
   if(num != ""){
    if(num <= 0){
window.alert("Invalid Quantity!");
setNum(1);
let _num = num;
_item.saleQuantity = _num
calTotal();
calTotalProducts();
    }else if(Number(num) > Number(_item.itemQuantity)){
      // calTotal();
      window.alert(_item.itemQuantity+" item(s) remaining!");
      setNum(_item.itemQuantity);
      let _num = num;
      _item.saleQuantity = _num
      calTotal();
      calTotalProducts();
    }else{
      // window.alert('Items'+num)
      let _num = num;
      _item.saleQuantity = _num
      calTotal();
      calTotalProducts();
    }
   }
  }, [num]);

 let handleChange = (e)=>{
  setNum(e.target.value);
  }

const handleMouseLeave = (e) => {
  if(e.target.value === ""){
    // window.alert("Mouse leave");
    setNum(1);
    let _num = num;
      _item.saleQuantity = _num
      calTotal();
      calTotalProducts();
  }
}

   return(
    <>
    <div className="w-75" >
    <div class="input-group">
  <div class="input-group-prepend">
    <button class="btn btn-primary btn-sm" type="button" onClick={decNum}>-</button>
  </div>
  <input
   className="form-control border-0"
   value={num}
   onChange={handleChange}
   onMouseLeave={handleMouseLeave}
   onBlur={handleMouseLeave}
    />
  <div class="input-group-prepend">
    <button class="btn btn-success btn-sm" type="button" onClick={incNum}>+</button>
  </div>
</div>
</div>
   </>
  );
}
export default IncDecCounter;
