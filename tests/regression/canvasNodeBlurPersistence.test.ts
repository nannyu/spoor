import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * 源码契约：画布节点内联编辑须在 onBlur 中写 IndexedDB。
 * 若重构 ThemeNode / NoteBody / AiNode，请同步更新本文件中的断言。
 */
const root = join(__dirname, '../..');

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('画布节点 blur 写库源码契约', () => {
  it('ThemeNode：标题、正文、页脚三处 contentEditable 均调用 db.nodes.update', () => {
    const src = readSrc('src/components/nodes/ThemeNode.tsx');
    expect(src.match(/contentEditable/g)?.length).toBe(3);
    expect(src).toContain("persistThemeField(node.id, 'content'");
    expect(src).toContain("persistThemeField(node.id, 'description'");
    expect(src).toContain("persistThemeField(node.id, 'themeTag'");
    expect(src).toContain('schedulePersist');
  });

  it('NoteBody：编辑区 onBlur 写入 content', () => {
    const src = readSrc('src/components/nodes/note/NoteBody.tsx');
    expect(src).toContain('db.nodes.update(node.id, { content: next');
    expect(src).toContain('isContentBlurPersistenceDisabled()');
  });

  it('AiNode：AI 回复编辑区 onBlur 写入 content', () => {
    const src = readSrc('src/components/nodes/AiNode.tsx');
    expect(src).toContain('db.nodes.update(node.id, { content: e.currentTarget.innerText');
    expect(src).toContain('isContentBlurPersistenceDisabled()');
  });
});
