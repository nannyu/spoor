//! 桌面端内置 llama.cpp 推理（GGUF）。模型常驻内存，按路径切换时重新加载。

use std::num::NonZeroU32;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use encoding_rs::UTF_8;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::AddBos;
use llama_cpp_2::model::LlamaModel;
use llama_cpp_2::openai::OpenAIChatTemplateParams;
use llama_cpp_2::sampling::LlamaSampler;
use serde::Deserialize;

struct LlamaHolder {
    backend: LlamaBackend,
    path: Option<String>,
    model: Option<LlamaModel>,
}

static GLOBAL: Mutex<Option<LlamaHolder>> = Mutex::new(None);

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalLlamaChatPayload {
    pub model_path: String,
    pub system_instruction: Option<String>,
    pub user_message: String,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub max_tokens: Option<i32>,
    pub n_ctx: Option<u32>,
    pub enable_thinking: Option<bool>,
}

fn build_messages_json(payload: &LocalLlamaChatPayload) -> Result<String, String> {
    let mut msgs: Vec<serde_json::Value> = Vec::new();
    if let Some(s) = &payload.system_instruction {
        let t = s.trim();
        if !t.is_empty() {
            msgs.push(serde_json::json!({"role": "system", "content": t}));
        }
    }
    msgs.push(serde_json::json!({"role": "user", "content": payload.user_message}));
    serde_json::to_string(&msgs).map_err(|e| format!("messages JSON: {e}"))
}

/// 同步执行推理（由 `spawn_blocking` 调用，避免阻塞 Tauri 异步运行时）。
pub fn chat(payload: LocalLlamaChatPayload) -> Result<String, String> {
    let path_raw = PathBuf::from(payload.model_path.trim());
    if !path_raw.is_file() {
        return Err(format!("模型文件不存在: {}", path_raw.display()));
    }
    let path = std::fs::canonicalize(&path_raw)
        .map_err(|e| format!("无法解析模型路径 {}: {e}", path_raw.display()))?;
    let path_str = path.to_string_lossy().to_string();

    let mut guard = GLOBAL.lock().map_err(|e| format!("内部锁: {e}"))?;

    if guard.is_none() {
        let backend = LlamaBackend::init().map_err(|e| format!("llama backend 初始化失败: {e}"))?;
        *guard = Some(LlamaHolder {
            backend,
            path: None,
            model: None,
        });
    }

    let holder = guard.as_mut().ok_or_else(|| "内部状态未就绪".to_string())?;

    if holder.path.as_deref() != Some(path_str.as_str()) {
        let model_params = LlamaModelParams::default();
        let model = LlamaModel::load_from_file(&holder.backend, Path::new(&path_str), &model_params)
            .map_err(|e| format!("加载 GGUF 失败: {e}"))?;
        holder.model = Some(model);
        holder.path = Some(path_str.clone());
    }

    let model = holder.model.as_ref().ok_or_else(|| "模型未加载".to_string())?;
    let backend = &holder.backend;

    let messages_json = build_messages_json(&payload)?;
    let tmpl = model
        .chat_template(None)
        .map_err(|e| format!("读取 chat 模板失败: {e}"))?;

    let chat_params = OpenAIChatTemplateParams {
        messages_json: &messages_json,
        tools_json: None,
        tool_choice: None,
        json_schema: None,
        grammar: None,
        reasoning_format: None,
        chat_template_kwargs: Some("{}"),
        add_generation_prompt: true,
        use_jinja: true,
        parallel_tool_calls: false,
        enable_thinking: payload.enable_thinking.unwrap_or(false),
        add_bos: false,
        add_eos: false,
        parse_tool_calls: false,
    };

    let rendered = model
        .apply_chat_template_oaicompat(&tmpl, &chat_params)
        .map_err(|e| format!("套用 chat 模板失败: {e}"))?;

    let prompt = rendered.prompt;

    let n_ctx_u = payload.n_ctx.unwrap_or(4096).clamp(512, 131072);
    let n_ctx_nz = NonZeroU32::new(n_ctx_u).ok_or_else(|| "n_ctx 无效".to_string())?;

    let mut ctx_params = LlamaContextParams::default().with_n_ctx(Some(n_ctx_nz));

    if let Ok(n_threads) = std::thread::available_parallelism() {
        let n = n_threads.get().min(8) as i32;
        if n > 0 {
            ctx_params = ctx_params.with_n_threads(n);
            ctx_params = ctx_params.with_n_threads_batch(n);
        }
    }

    let mut ctx = model
        .new_context(backend, ctx_params)
        .map_err(|e| format!("创建推理上下文失败: {e}"))?;

    let tokens_list = model
        .str_to_token(&prompt, AddBos::Never)
        .map_err(|e| format!("分词失败: {e}"))?;

    let max_new = payload.max_tokens.unwrap_or(1024).clamp(1, 8192);
    let prompt_len = i32::try_from(tokens_list.len()).map_err(|_| "提示过长".to_string())?;
    let n_len = prompt_len.saturating_add(max_new);

    let n_cxt = ctx.n_ctx() as i32;
    if n_len > n_cxt {
        return Err(format!(
            "上下文不足：需要约 {n_len} tokens（提示 + 生成长度），当前 n_ctx={n_cxt}。请在设置中减小请求或提高 n_ctx。"
        ));
    }
    if prompt_len >= n_len {
        return Err("提示词占用 token 超过上限".into());
    }

    let mut batch = LlamaBatch::new(512, 1);
    let last_index = prompt_len - 1;
    for (i, token) in (0_i32..).zip(tokens_list.into_iter()) {
        let is_last = i == last_index;
        batch
            .add(token, i, &[0], is_last)
            .map_err(|e| format!("batch add: {e}"))?;
    }

    ctx.decode(&mut batch)
        .map_err(|e| format!("解码提示失败: {e}"))?;

    let temperature = payload.temperature.unwrap_or(0.7).clamp(0.05, 4.0);
    let top_p = payload.top_p.unwrap_or(0.9).clamp(0.0, 1.0);
    let seed: u32 = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| (d.as_nanos() % u128::from(u32::MAX)) as u32)
        .unwrap_or(12345);

    let mut sampler = LlamaSampler::chain_simple([
        LlamaSampler::top_p(top_p, 1),
        LlamaSampler::temp(temperature),
        LlamaSampler::dist(seed),
    ]);

    let mut n_cur = batch.n_tokens() as i32;
    let mut out = String::new();
    let mut decoder = UTF_8.new_decoder();

    while n_cur <= n_len {
        let token = sampler.sample(&ctx, batch.n_tokens() - 1);
        sampler.accept(token);

        if model.is_eog_token(token) {
            break;
        }

        let piece = model
            .token_to_piece(token, &mut decoder, true, None)
            .map_err(|e| format!("token 转文本: {e}"))?;
        out.push_str(&piece);

        batch.clear();
        batch
            .add(token, n_cur, &[0], true)
            .map_err(|e| format!("batch add: {e}"))?;

        n_cur += 1;

        ctx.decode(&mut batch)
            .map_err(|e| format!("解码生成失败: {e}"))?;
    }

    Ok(out.trim().to_string())
}
