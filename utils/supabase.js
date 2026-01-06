// Supabase 配置 - 从环境变量安全读取
const SUPABASE_CONFIG = {
    URL: import.meta.env.VITE_SUPABASE_URL,
    API_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// 开发环境下的友好提示
if (import.meta.env.DEV) {
    if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.API_KEY) {
        console.warn('⚠️  Supabase环境变量未加载，请检查：');
        console.warn('1. .env文件是否在项目根目录');
        console.warn('2. 变量名是否正确（VITE_开头）');
        console.warn('3. 是否重启了开发服务器');
    } else {
        console.log('✅ Supabase配置加载成功');
    }
}

// Supabase 请求工具
const supabaseRequest = {
    async request(url, options = {}) {
        try {
            const response = await axios({
                url: SUPABASE_CONFIG.URL + url,
                method: options.method || 'GET',
                data: options.data,
                headers: {
                    'apikey': SUPABASE_CONFIG.API_KEY,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.API_KEY}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    // 查询数据
    async select(table, options = {}) {
        let url = `/rest/v1/${table}`;
        const params = [];
        
        if (options.where) {
            params.push(`${options.where.column}=eq.${options.where.value}`);
        }
        
        if (options.order) {
            const order = options.order.ascending ? 'asc' : 'desc';
            params.push(`order=${options.order.column}.${order}`);
        }
        
        if (options.limit) {
            params.push(`limit=${options.limit}`);
        }
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        return this.request(url);
    },

    // 插入数据
    async insert(table, data) {
        return this.request(`/rest/v1/${table}`, {
            method: 'POST',
            data: Array.isArray(data) ? data : [data],
            headers: {
                'Prefer': 'return=representation'
            }
        });
    },

    // 更新数据
    async update(table, id, data) {
        return this.request(`/rest/v1/${table}?id=eq.${id}`, {
            method: 'PATCH',
            data: data
        });
    },

    // 删除数据
    async delete(table, id) {
        return this.request(`/rest/v1/${table}?id=eq.${id}`, {
            method: 'DELETE'
        });
    }
};
