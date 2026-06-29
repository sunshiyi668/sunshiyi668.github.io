// api/supabase.js
const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取 Supabase 配置
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
    // 1. 设置 CORS 头（允许你的域名访问）
    res.setHeader('Access-Control-Allow-Origin', 'https://sunshiyi668.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { table, method, params, body } = req.body;

        // 校验必要参数
        if (!table || !method) {
            return res.status(400).json({ error: '缺少必要参数: table, method' });
        }

        // 允许的操作列表
        const allowedMethods = ['insert', 'update', 'delete'];
        if (!allowedMethods.includes(method)) {
            return res.status(400).json({ error: '不支持的 method: ' + method });
        }

        // 允许的表列表
        const allowedTables = ['access_codes', 'articles'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ error: '不允许操作的表: ' + table });
        }

        // 创建 Supabase 客户端（用 service_role 密钥）
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        let result;

        switch (method) {
            case 'insert':
                if (!body) {
                    return res.status(400).json({ error: 'insert 需要 body 参数' });
                }
                result = await supabase.from(table).insert(body).select();
                break;

            case 'update':
                if (!params || !params.id) {
                    return res.status(400).json({ error: 'update 需要 params.id 参数' });
                }
                if (!body) {
                    return res.status(400).json({ error: 'update 需要 body 参数' });
                }
                result = await supabase
                    .from(table)
                    .update(body)
                    .eq('id', params.id)
                    .select();
                break;

            case 'delete':
                if (!params || !params.id) {
                    return res.status(400).json({ error: 'delete 需要 params.id 参数' });
                }
                result = await supabase
                    .from(table)
                    .delete()
                    .eq('id', params.id);
                break;
        }

        if (result.error) {
            console.error('Supabase 错误:', result.error);
            return res.status(500).json({ error: result.error.message });
        }

        return res.status(200).json({ success: true, data: result.data });

    } catch (err) {
        console.error('代理错误:', err);
        return res.status(500).json({ error: err.message || '服务器内部错误' });
    }
};