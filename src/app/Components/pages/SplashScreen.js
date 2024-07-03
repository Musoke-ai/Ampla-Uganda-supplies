// import { useGetProfileQuery } from "../../features/api/userSlice";
import { useGetProfileQuery } from "../../auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import ReactLoading from 'react-loading';

import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { selectCurrentToken, setProfile } from "../../auth/authSlice";

import { store } from "../../store";
import { extendedApiSlice } from "../../features/stock/stockSlice";
import { extendedCatApiSlice } from "../../features/api/categorySlice";
import { extendedDebtApiSlice } from "../../features/api/debtSlice";
import { extendedHistoryApiSlice } from "../../features/api/historySlice";
import { extendedSalesApiSlice } from "../../features/api/salesSlice";
import { extendedStatsApiSlice } from "../../features/api/statisticsSlice";
import { extendedStokApiSlice } from "../../features/api/stockSlice";
import { extendedUserApiSlice } from "../../features/api/userSlice";


const SplashScreen = () => {
  const {
    isLoading,
    isSuccess,
    isError,
    error
     } = useGetProfileQuery();

  const dispatch = useDispatch()

    store.dispatch(extendedApiSlice.endpoints.getStock.initiate());
    store.dispatch(extendedCatApiSlice.endpoints.getCategories.initiate());
    store.dispatch(extendedDebtApiSlice.endpoints.getDebts.initiate());
    store.dispatch(extendedHistoryApiSlice.endpoints.getHistory.initiate());
    store.dispatch(extendedSalesApiSlice.endpoints.getSales.initiate());
    store.dispatch(extendedStatsApiSlice.endpoints.getStatistics.initiate());
    store.dispatch(extendedStokApiSlice.endpoints.getStok.initiate());
    store.dispatch(extendedUserApiSlice.endpoints.getProfile.initiate());

    const navigate = useNavigate();

   if(isSuccess){
    // dispatch(setProfile({ data }))
     navigate('/dashboard')
   }

  return (
    <div>
         {
      isLoading ?
      <div className='splashScreen'>
     
        <ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''  />
       <br/>
        <span>Loading...</span>
        </div>
   : ""
   }
   {
   isError ? 
    <div className='splashScreen'>
   <div></div>
<div>An Error ocurred { " error "+error.message}</div>
 </div> : ""
} 
    </div>
  );
}

export default SplashScreen;
