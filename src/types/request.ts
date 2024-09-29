import { AxiosInstance, AxiosPromise, AxiosRequestHeaders, AxiosResponse, Method } from 'axios'

export type GeekRequestConfig = {
    /** 请求地址 */
    url?: string,
    /** get请求映射params参数 */
    method?: Method | string,
    /** 请求数据 */
    data?: any,
    /** get请求映射params参数 */
    params?: any,
    headers?: {
        /** 是否需要防止数据重复提交 */
        isRepeatSubmit?: boolean,
        /** 是否需要设置 token */
        isToken?: boolean,
    } | AxiosRequestHeaders
}

export type GeekResponse<T = any> = {
    code: number;
    msg: string;
    data?: T;
    total?: number;
    rows?: Array<T>
}