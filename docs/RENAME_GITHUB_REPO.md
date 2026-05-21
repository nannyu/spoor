# 将 GitHub 仓库改名为「雪泥-spoor」

## 为什么用 `xue-ni-spoor` 而不是 `雪泥-spoor`？

GitHub **仓库 URL 名（slug）** 只允许英文字母、数字、`-`、`_`、`.`，**不能包含中文「雪泥」**。

推荐做法：

| 位置 | 内容 |
|------|------|
| **仓库名（slug）** | `xue-ni-spoor`（即「雪泥-spoor」的拼音形式，链接好记） |
| **About 描述** | `雪泥 · Spoor — 本地优先空间便签画布`（可显示中文品牌） |

旧地址 `github.com/iimorning/scribe-ai-canvas` 在改名后会 **自动跳转到** 新地址。

---

## 你在 GitHub 上操作（约 1 分钟）

1. 打开：https://github.com/iimorning/scribe-ai-canvas/settings  
2. **General** → **Repository name**  
3. 填入：`xue-ni-spoor`  
4. 点 **Rename**  
5. 可选：右侧 **About** → Description 填 `雪泥 · Spoor`

---

## 本机 Git 远程地址

改名完成后，在项目目录执行：

```powershell
git remote set-url origin https://github.com/iimorning/xue-ni-spoor.git
git remote -v
```

若本地文件夹仍叫 `scribe-ai-canvas`，可不改（仅影响路径）；想统一可重命名为 `xue-ni-spoor`。

---

## 已更新的文档链接

仓库内指向 GitHub 的链接已改为 `iimorning/xue-ni-spoor`（需将上述改名做完后生效）。

**未改：** `scribe-ai-canvas.netlify.app`（Netlify 站点域名，与 GitHub 仓库名无关）。
