import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { formatDistance, formatDistanceToNowStrict, format } from 'date-fns';
import { tags as commonTags } from './commonTags'
const today = new Date();
const passedDate = new Date(2023, 9, 24);
const formattedDate = format(today, 'yyyy.MM.dd');

const result = formatDistance(today, passedDate)

const debtAdapter = createEntityAdapter({
selectId: (debt) => debt.indebtId,
sortComparer: (a, b) => b.indebtDateCreated.localeCompare(a.indebtDateCreated)
})

const initialState = debtAdapter.getInitialState();

export const extendedDebtApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getDebts: builder.query({
            query: () => '/retrievals/debts',
            transformResponse:  responseData => {
                responseData = responseData.map((item) => {
                    const entryDate = format((new Date(item.indebtDateCreated)), 'yyy.MM.dd');
                    // const dateDiff = formatDistance(formattedDate, entryDate);
                    return{ ...item,
                        indebtDateCreated: entryDate ,
                        daysOverDue: '2 days ago',   
                     }} );
            return debtAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addDebt: builder.mutation(
            {
                query: payload => ({
                url: '/entries/debts',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            payDebt: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/entries/paydebt',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
                deleteDebt: builder.mutation(
                    {
                        query: payload => (
                        
                            {
                        url: `/entries/deleteItem/${payload.itemId}`,
                        method: 'post',
                    }
                        ),
                invalidatesTags: [commonTags.inventory],
                    }),
    })
})

export const {
    useGetDebtsQuery,
    useAddDebtMutation,
    usePayDebtMutation,
    useDeleteDebtMutation,
} = extendedDebtApiSlice 

//returns the query result object
export const selectDebtResult = extendedDebtApiSlice.endpoints.getDebts.select();

//Creates memoized selector
const selectDebtData = createSelector(
    selectDebtResult,
    debtResult => debtResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectDebt,
    selectById: selectDebtById,
    selectIds: selectDebtIds
} = debtAdapter.getSelectors(state => selectDebtData(state) ?? initialState);
