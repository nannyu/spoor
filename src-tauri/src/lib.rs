mod local_llama;

use serde_json::Value;

use local_llama::LocalLlamaChatPayload;

/// OpenAI-compatible POST to `url` (e.g. Xiaomi MiMo Token Plan: https://token-plan-cn.xiaomimimo.com/v1/chat/completions).
/// Bypasses browser CORS when running in the Tauri webview.
#[tauri::command]
async fn openai_compatible_chat(api_key: String, url: String, body: Value) -> Result<String, String> {
  let client = reqwest::Client::builder()
    .build()
    .map_err(|e| e.to_string())?;

  let response = client
    .post(&url)
    .header("Authorization", format!("Bearer {api_key}"))
    .header("Content-Type", "application/json")
    .json(&body)
    .send()
    .await
    .map_err(|e| {
      eprintln!("[Scribe AI] openai_compatible_chat network error: {e} (url={url})");
      e.to_string()
    })?;

  let status = response.status();
  let text = response.text().await.map_err(|e| e.to_string())?;

  if !status.is_success() {
    let preview: String = text.chars().take(800).collect();
    eprintln!("[Scribe AI] openai_compatible_chat HTTP {status} url={url} body_preview={preview}");
    return Err(text);
  }

  let json: Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
  let content = json["choices"]
    .get(0)
    .and_then(|c| c.get("message")?.get("content"));

  match content {
    Some(Value::String(s)) => Ok(s.clone()),
    Some(v) => Ok(v.to_string()),
    None => Err(format!("Unexpected API response: {text}")),
  }
}

/// Metaso (秘塔) search API proxy.
/// POST https://metaso.cn/api/v1/search — bypasses browser CORS in Tauri webview.
#[tauri::command]
async fn metaso_search(api_key: String, query: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({
        "q": query,
        "scope": "webpage",
        "size": 5,
    });

    let response = client
        .post("https://metaso.cn/api/v1/search")
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            eprintln!("[Scribe AI] metaso_search network error: {e}");
            e.to_string()
        })?;

    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        let preview: String = text.chars().take(800).collect();
        eprintln!("[Scribe AI] metaso_search HTTP {status} body_preview={preview}");
        return Err(text);
    }

    Ok(text)
}

/// Open an http(s) URL in the system default browser. Webview `target=_blank` is unreliable in Tauri.
#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    let url = url.trim();
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("Only http:// and https:// URLs are allowed".into());
    }
    open::that(url).map_err(|e| e.to_string())
}

/// 内置 llama.cpp：加载本地 GGUF，使用模型自带 chat 模板完成一轮对话（桌面端离线）。
#[tauri::command]
async fn local_llama_chat(payload: LocalLlamaChatPayload) -> Result<String, String> {
  tokio::task::spawn_blocking(move || local_llama::chat(payload))
    .await
    .map_err(|e| format!("推理任务异常: {e}"))?
}

/// 返回本地 LLM 日志文件路径（每次推理的命令行/stdout/stderr/耗时都会写入此文件）。
#[tauri::command]
fn get_local_llama_log_path() -> String {
  local_llama::log_path().to_string_lossy().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      openai_compatible_chat,
      metaso_search,
      open_external_url,
      local_llama_chat,
      get_local_llama_log_path
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
