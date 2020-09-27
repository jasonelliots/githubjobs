// custom hook that gets all the jobs

import { useReducer, useEffect } from 'react';
import axios from 'axios'


const ACTIONS = {
    MAKE_REQUEST: 'make-request',
    GET_DATA: 'get-data',
    ERROR: 'error',
    UPDATE_HAS_NEXT_PAGE: 'update-has-next-page'
}

// cors-anywhere acts as a proxy for us to get around cors - otherwise would need a server to act as a proxy 
const BASE_URL = 'https://cors-anywhere.herokuapp.com/https://jobs.github.com/positions.json'

// reducer function gets called every time we pass something into dispatch 
function reducer(state, action) {

    switch (action.type) {
        case ACTIONS.MAKE_REQUEST:
            return {loading: true, jobs: []}
        case ACTIONS.GET_DATA:
            return { ...state, loading: false, jobs: action.payload.jobs}
        case ACTIONS.ERROR:
            return {...state, loading: false, error: action.payload.error, jobs:[] }
        case ACTIONS.UPDATE_HAS_NEXT_PAGE:
            return {...state, hasNextPage: action.payload.hasNextPage}
        default:
            return state
    }
}

export default function useFetchJobs(params, page) {

    // loop up useReducer hook - handles all of our state in this function 
    const [state, dispatch] = useReducer(reducer, {jobs: [], loading: true})

    useEffect(() => {

        const cancelToken1 = axios.CancelToken.source()

        dispatch({ type: ACTIONS.MAKE_REQUEST })

        axios.get(BASE_URL, {
            cancelToken: cancelToken1.token,
            params: { markdown: true, page: page, ...params}
        }).then(res => {
            // got response, saving it to our state 
            dispatch({ type: ACTIONS.GET_DATA, payload: { jobs: res.data}})
        }).catch(err => {
            if (axios.isCancel(err)) return 
            dispatch({ type: ACTIONS.ERROR, payload: { error: err} })
        })

        const cancelToken2 = axios.CancelToken.source()

        axios.get(BASE_URL, {
            cancelToken: cancelToken2.token,
            params: { markdown: true, page: page + 1, ...params}
        }).then(res => {
            // got response, saving it to our state 
            dispatch({ type: ACTIONS.UPDATE_HAS_NEXT_PAGE, payload: { hasNextPage: res.data.length !== 0}})
        }).catch(err => {
            if (axios.isCancel(err)) return 
            dispatch({ type: ACTIONS.ERROR, payload: { error: err} })
        })

        return () => {
            cancelToken1.cancel()
            cancelToken2.cancel()

        }

    }, [params, page])

    return state
}